package astroruntime

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path"
	"runtime/debug"
	"strings"
	"sync"
)

// ── Runtime ───────────────────────────────────────────────────────────────────

// Runtime combines a QJS pool and a static-asset FS into a single http.Handler.
// Routing order: /.netlify/images → image CDN; static file → distFS; else → SSR pool.
//
// Create via NewRuntime; close with Close when done.
type Runtime struct {
	pool   *Pool
	distFS fs.FS
	mu     sync.Mutex
	srv    *http.Server
}

// runtimeConfig holds resolved options for NewRuntime.
type runtimeConfig struct {
	// source — exactly one must be non-nil/non-empty
	packData   []byte    // WithPack
	packReader io.Reader // WithPackReader
	packPath   string    // WithPackFile
	bundle     []byte    // WithBundle

	distFS   fs.FS  // WithDistFS
	distDir  string // WithDistDir (converted to distFS on build)
	cacheDir string // WithCacheDir

	poolOpts []PoolOption // WithPoolOptions
}

// RuntimeOption configures NewRuntime.
type RuntimeOption func(*runtimeConfig)

// WithPack sets an in-memory .pack payload as the runtime source.
func WithPack(data []byte) RuntimeOption {
	return func(c *runtimeConfig) { c.packData = data }
}

// WithPackReader reads all bytes from r and uses the result as the pack source.
// The reader is consumed when NewRuntime is called.
func WithPackReader(r io.Reader) RuntimeOption {
	return func(c *runtimeConfig) { c.packReader = r }
}

// WithPackFile sets a .pack file path as the runtime source.
// Use WithCacheDir to enable persistent extraction cache.
func WithPackFile(path string) RuntimeOption {
	return func(c *runtimeConfig) { c.packPath = path }
}

// WithBundle sets a raw JS bundle (the output of BundleSSR or a pre-bundled .mjs)
// as the runtime source.
func WithBundle(code []byte) RuntimeOption {
	return func(c *runtimeConfig) { c.bundle = code }
}

// WithDistFS sets the static-asset file system (dist/).
// Not required when using a pack source (distFS is embedded in the pack).
func WithDistFS(fsys fs.FS) RuntimeOption {
	return func(c *runtimeConfig) { c.distFS = fsys }
}

// WithDistDir sets the static-asset directory path (shorthand for WithDistFS(os.DirFS(path))).
func WithDistDir(path string) RuntimeOption {
	return func(c *runtimeConfig) { c.distDir = path }
}

// WithCacheDir sets a directory for persistent caching.
// For pack sources: extracted to cacheDir/<sha256(pack)>/ (cache hit skips extraction).
// For bundle sources: compiled QJS bytecodes cached as cacheDir/<hash>.bc.
func WithCacheDir(dir string) RuntimeOption {
	return func(c *runtimeConfig) { c.cacheDir = dir }
}

// WithPoolOptions passes PoolOption values (WithEnv, WithSize, etc.) to the
// underlying Pool, allowing reuse of existing pool configuration functions.
func WithPoolOptions(opts ...PoolOption) RuntimeOption {
	return func(c *runtimeConfig) { c.poolOpts = append(c.poolOpts, opts...) }
}

// NewRuntime creates a Runtime from the given options.
// Exactly one source option is required: WithPack, WithPackReader, WithPackFile, or WithBundle.
func NewRuntime(opts ...RuntimeOption) (*Runtime, error) {
	cfg := &runtimeConfig{}
	for _, o := range opts {
		o(cfg)
	}

	// Resolve pack reader → bytes before source detection.
	if cfg.packReader != nil && cfg.packData == nil {
		data, err := loadPackData(cfg.packReader)
		if err != nil {
			return nil, fmt.Errorf("read pack: %w", err)
		}
		cfg.packData = data
	}

	// Count sources.
	sources := 0
	if len(cfg.packData) > 0 {
		sources++
	}
	if cfg.packPath != "" {
		sources++
	}
	if len(cfg.bundle) > 0 {
		sources++
	}
	if sources == 0 {
		return nil, fmt.Errorf("NewRuntime: one source option required (WithPack, WithPackReader, WithPackFile, or WithBundle)")
	}
	if sources > 1 {
		return nil, fmt.Errorf("NewRuntime: only one source option allowed")
	}

	// Resolve distFS from distDir if needed.
	if cfg.distFS == nil && cfg.distDir != "" {
		cfg.distFS = os.DirFS(cfg.distDir)
	}

	var (
		bundleBC []byte
		distFS   fs.FS
		err      error
	)

	switch {
	case len(cfg.packData) > 0:
		if cfg.cacheDir != "" {
			bundleBC, distFS, err = extractPackToCache(cfg.packData, cfg.cacheDir)
		} else {
			bundleBC, distFS, err = openPackInMemory(cfg.packData)
		}
		if err != nil {
			return nil, fmt.Errorf("open pack: %w", err)
		}

	case cfg.packPath != "":
		bundleBC, distFS, err = openPackFile(cfg.packPath, cfg.cacheDir)
		if err != nil {
			return nil, err
		}

	case len(cfg.bundle) > 0:
		distFS = cfg.distFS // may be nil
		poolOpts := cfg.poolOpts
		if cfg.cacheDir != "" {
			poolOpts = append(poolOpts, WithBundleCache(cfg.cacheDir))
		}
		pool, err := NewPool(cfg.bundle, poolOpts...)
		if err != nil {
			return nil, fmt.Errorf("pool init: %w", err)
		}
		return &Runtime{pool: pool, distFS: distFS}, nil
	}

	// Pack path: distFS overrides pack-embedded FS if caller provided one.
	if cfg.distFS != nil {
		distFS = cfg.distFS
	}

	poolOpts := append([]PoolOption{WithPrecompiledBundle(bundleBC)}, cfg.poolOpts...)
	pool, err := NewPool(nil, poolOpts...)
	if err != nil {
		return nil, fmt.Errorf("pool init: %w", err)
	}
	return &Runtime{pool: pool, distFS: distFS}, nil
}

// Pool returns the underlying Pool for lower-level access (e.g. RequestContext in tests).
func (rt *Runtime) Pool() *Pool { return rt.pool }

// DistFS returns the static-asset file system embedded in or configured for this Runtime.
func (rt *Runtime) DistFS() fs.FS { return rt.distFS }

// Close stops worker goroutines. Call when the Runtime will no longer serve requests.
func (rt *Runtime) Close() { rt.pool.Close() }

// Stats returns a snapshot of pool utilization.
func (rt *Runtime) Stats() PoolStats { return rt.pool.Stats() }

// ListenAndServe starts an HTTP server on addr (e.g. ":8888").
// Returns nil when the server is stopped via Shutdown.
func (rt *Runtime) ListenAndServe(addr string) error {
	srv := &http.Server{Addr: addr, Handler: rt}
	rt.mu.Lock()
	rt.srv = srv
	rt.mu.Unlock()
	err := srv.ListenAndServe()
	if errors.Is(err, http.ErrServerClosed) {
		return nil
	}
	return err
}

// Shutdown gracefully drains in-flight HTTP requests within ctx's deadline.
// Call Close afterward to release pool resources.
func (rt *Runtime) Shutdown(ctx context.Context) error {
	rt.mu.Lock()
	srv := rt.srv
	rt.mu.Unlock()
	if srv == nil {
		return nil
	}
	return srv.Shutdown(ctx)
}

// ServeHTTP implements http.Handler.
// Routing: /.netlify/images → image CDN; static files in distFS; else → SSR pool.
func (rt *Runtime) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path == "/.netlify/images" {
		if rt.distFS != nil {
			HandleImageCDN(rt.distFS, w, r)
		} else {
			http.Error(w, "no distFS configured", http.StatusNotFound)
		}
		return
	}

	defer func() {
		if v := recover(); v != nil {
			log.Printf("panic: %v\n%s", v, debug.Stack())
			http.Error(w, fmt.Sprintf("internal server error: %v", v), http.StatusInternalServerError)
		}
	}()

	urlPath := path.Clean(r.URL.Path)
	rel := strings.TrimLeft(urlPath, "/")
	if rt.distFS != nil {
		if served := tryStatic(w, r, rt.distFS, rel, urlPath); served {
			return
		}
	}

	rc, err := rt.pool.RequestContext(w, r)
	if err != nil {
		http.Error(w, "runtime pool exhausted", http.StatusServiceUnavailable)
		return
	}
	HandleRequest(rc)
}

// ── StartServer (backward-compatible) ────────────────────────────────────────

// StartServer starts the HTTP server.
// Deprecated: prefer NewRuntime + Runtime.ListenAndServe for new code.
func StartServer(pool *Pool, distFS fs.FS, addr string) error {
	return (&Runtime{pool: pool, distFS: distFS}).ListenAndServe(addr)
}

// ── static file helpers ───────────────────────────────────────────────────────

func tryStatic(w http.ResponseWriter, r *http.Request, distFS fs.FS, rel, urlPath string) bool {
	if rel != "" {
		if fi, err := fs.Stat(distFS, rel); err == nil && !fi.IsDir() {
			serveStaticFS(w, r, distFS, rel, urlPath)
			return true
		}
	}

	var indexRel string
	if rel == "" {
		indexRel = "index.html"
	} else {
		indexRel = rel + "/index.html"
	}
	if fi, err := fs.Stat(distFS, indexRel); err == nil && !fi.IsDir() {
		serveStaticFS(w, r, distFS, indexRel, urlPath)
		return true
	}

	return false
}

func serveStaticFS(w http.ResponseWriter, r *http.Request, distFS fs.FS, rel, urlPath string) {
	ext := path.Ext(rel)
	switch {
	case strings.HasPrefix(urlPath, "/_astro/"):
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	case ext != "" && ext != ".html" && ext != ".htm":
		// Non-hashed assets (fonts, images, etc.) — short-lived cache.
		w.Header().Set("Cache-Control", "public, max-age=3600")
	}
	f, err := distFS.Open(rel)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	defer f.Close()
	fi, err := f.Stat()
	if err != nil {
		http.Error(w, "stat failed", http.StatusInternalServerError)
		return
	}
	if rs, ok := f.(io.ReadSeeker); ok {
		http.ServeContent(w, r, fi.Name(), fi.ModTime(), rs)
		return
	}
	data, err := io.ReadAll(f)
	if err != nil {
		http.Error(w, "read failed", http.StatusInternalServerError)
		return
	}
	http.ServeContent(w, r, fi.Name(), fi.ModTime(), bytes.NewReader(data))
}
