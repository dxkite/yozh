package astroruntime

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"sync"
	"time"

	jsruntime "github.com/dxkite/astro-runtime/internal/runtime"
	"github.com/dxkite/astro-runtime/trace"
)

// poolConfig holds resolved configuration for NewPool.
type poolConfig struct {
	env               map[string]string
	size              int
	memoryLimit       int
	maxStackSize      int
	maxExecutionTime  int
	gcThreshold       int
	bundleCacheDir    string
	precompiledBundle []byte
	gojaBundle        []byte // IIFE-format bundle for goja engine (from pack's bundle-goja.mjs)
	contextProvider   func(*http.Request) *NetlifyContext
	requestTimeout    time.Duration // 0 = no timeout; applied per request via context.WithTimeout
	engine            JSEngine      // nil → default qjs engine
	bootstrap string // custom bootstrap JS source; "" = use built-in astro bootstrap
	polyfill  string // custom polyfill JS source; when non-empty, replaces all built-in polyfills
	selfURL   string // internal base URL for relative fetch resolution (e.g. http://127.0.0.1:8080)
}

// PoolOption configures a JS runtime pool.
type PoolOption func(*poolConfig)

// WithEnv sets the process.env map visible to JS. Defaults to an empty map.
func WithEnv(env map[string]string) PoolOption {
	return func(c *poolConfig) { c.env = env }
}

// WithSize sets the number of JS runtimes in the pool.
// Defaults to clamp(NumCPU, 2, 8). Valid range: [1, 1000].
func WithSize(size int) PoolOption {
	return func(c *poolConfig) { c.size = size }
}

// WithMemoryLimit caps the WASM heap per runtime in bytes. 0 = no limit. QJS only.
func WithMemoryLimit(bytes int) PoolOption {
	return func(c *poolConfig) { c.memoryLimit = bytes }
}

// WithMaxStackSize caps the JS call stack per runtime in bytes. 0 = default (256 KB). QJS only.
func WithMaxStackSize(bytes int) PoolOption {
	return func(c *poolConfig) { c.maxStackSize = bytes }
}

// WithMaxExecutionTime caps a single Eval call in milliseconds. 0 = no limit. QJS only.
func WithMaxExecutionTime(ms int) PoolOption {
	return func(c *poolConfig) { c.maxExecutionTime = ms }
}

// WithGCThreshold controls the GC trigger threshold in bytes. 0 = default. QJS only.
func WithGCThreshold(bytes int) PoolOption {
	return func(c *poolConfig) { c.gcThreshold = bytes }
}

// WithGojaBundle sets the IIFE-format JS source used by the goja engine when the pool
// is loaded from a .pack file (which provides QJS bytecodes but no IIFE source).
// Ignored by the QJS engine. When unset, the main bundleCode passed to NewPool is used.
func WithGojaBundle(code []byte) PoolOption {
	return func(c *poolConfig) { c.gojaBundle = code }
}

// WithPrecompiledBundle sets pre-compiled raw QuickJS bytecode for bundle.mjs.
// Polyfills and glue are still compiled fresh on each pool init (fast, < 5 ms).
// Use when the bundle.bc is already available (e.g. loaded from a .pack file).
// Ignored when engine does not support bytecode.
func WithPrecompiledBundle(bc []byte) PoolOption {
	return func(c *poolConfig) { c.precompiledBundle = bc }
}

// WithBundleCache enables raw bundle bytecode disk caching in dir.
// Cache key = SHA256(bundle source + vcs.revision); a Go rebuild or bundle change
// produces a cache miss. Pass an empty string to disable (default).
// Ignored when engine does not support bytecode.
func WithBundleCache(dir string) PoolOption {
	return func(c *poolConfig) { c.bundleCacheDir = dir }
}

// WithContextProvider registers a per-request NetlifyContext builder.
// fn is called once per request with the incoming *http.Request and must return
// the NetlifyContext to pass to the JS SSR handler. When set, it replaces the
// default extraction of IP (X-Forwarded-For / X-Real-Ip / RemoteAddr) and
// RequestID (X-Request-Id).
func WithContextProvider(fn func(*http.Request) *NetlifyContext) PoolOption {
	return func(c *poolConfig) { c.contextProvider = fn }
}

// WithRequestTimeout sets a per-request deadline applied via context.WithTimeout.
// When the deadline is exceeded, Await() in the event loop returns ctx.Err()
// and the eval returns an error, releasing the pool slot immediately.
// 0 (default) means no per-request timeout.
func WithRequestTimeout(d time.Duration) PoolOption {
	return func(c *poolConfig) { c.requestTimeout = d }
}

// WithBootstrap sets a custom bootstrap JS source for each runtime in the pool.
// src is evaluated as a plain script after the SSR bundle; it must define
// globalThis.__handleRequest. Takes precedence over WithBootstrapKind.
func WithBootstrap(src string) PoolOption {
	return func(c *poolConfig) { c.bootstrap = src }
}

// WithSelfURL sets the internal base URL used by fetch.js to resolve relative URLs.
// Set this to the server's own address as reachable from within the process
// (e.g. http://127.0.0.1:8080) so that self-referential fetches work behind proxies or in Docker.
func WithSelfURL(u string) PoolOption {
	return func(c *poolConfig) { c.selfURL = u }
}

// WithPolyfill replaces all built-in polyfills with the provided JS source.
// When set, none of the built-in polyfill files are evaluated.
// Pass the full polyfill source (not a file path).
func WithPolyfill(src string) PoolOption {
	return func(c *poolConfig) { c.polyfill = src }
}

// WithEngine sets a custom JSEngine implementation for the pool.
// The provided engine is used as-is; engine-specific options (WithMemoryLimit, etc.)
// are ignored if the engine was already configured externally.
func WithEngine(engine JSEngine) PoolOption {
	return func(c *poolConfig) { c.engine = engine }
}

// WithEngineKind selects the JS engine by kind using default options.
// QJS-specific options (WithMemoryLimit, WithMaxStackSize, etc.) are applied
// automatically for EngineQJS. For EngineGoja they are silently ignored.
func WithEngineKind(kind EngineKind) PoolOption {
	return func(c *poolConfig) {
		c.engine = &kindSentinel{kind: kind}
	}
}

// kindSentinel is a placeholder engine that carries only the EngineKind.
// NewPool replaces it with the real engine constructed from poolConfig.
type kindSentinel struct{ kind EngineKind }

func (*kindSentinel) New() (JSRuntime, error)   { panic("kindSentinel.New called") }
func (*kindSentinel) SupportsBytecode() bool    { panic("kindSentinel.SupportsBytecode called") }

// pooledRuntime wraps a JS runtime with a per-request streaming channel.
// streamCh is allocated fresh by HandleRequest before each request.
// The pool guarantees exclusive access per request.
type pooledRuntime struct {
	rt       JSRuntime
	streamCh chan ResponseSignal
}

// Pool manages a set of pre-warmed JS runtimes and a fixed-size eval worker pool.
type Pool struct {
	pool              chan *pooledRuntime
	workers           chan func()
	bundleCode        []byte
	gojaBundle        []byte // IIFE bundle for goja; falls back to bundleCode when nil
	bcs               *jsruntime.BytecodeSet
	bcsOnce           sync.Once
	bcsErr            error
	engine            JSEngine
	env               map[string]string
	bundleCacheDir    string
	precompiledBundle []byte
	contextProvider   func(*http.Request) *NetlifyContext
	requestTimeout    time.Duration
	bootstrap string // custom bootstrap source; "" = use built-in astro bootstrap
	polyfill  string // custom polyfill source; "" = use built-in polyfills
	selfURL   string // internal base URL for relative fetch resolution
}

// NewPool creates a pool of JS runtimes, each initialized with:
//  1. Go host functions (__go_cryptoRandomBytes, __go_consoleWrite, __go_fetchRaw, etc.)
//  2. Web API polyfills (Headers, Request, Response, crypto, File, console, fetch)
//  3. The ESM SSR bundle loaded in module mode (sets globalThis.__ssrHandler)
//  4. The JS glue adapter (defines globalThis.__handleRequest)
//
// For QJS: JS source is compiled to bytecode on the first runtime (via sync.Once);
// all subsequent runtimes reuse the same bytecodes.
// For goja: source strings are evaluated directly; bytecode is not used.
func NewPool(bundleCode []byte, opts ...PoolOption) (*Pool, error) {
	cfg := &poolConfig{}
	for _, o := range opts {
		o(cfg)
	}

	size := cfg.size
	if size == 0 {
		size = runtime.NumCPU()
		if size < 2 {
			size = 2
		}
		if size > 8 {
			size = 8
		}
	}
	if size < 1 || size > 1000 {
		return nil, fmt.Errorf("pool size must be between 1 and 1000, got %d", size)
	}

	env := cfg.env
	if env == nil {
		env = map[string]string{}
	}

	// Resolve the engine: if a kindSentinel was set, build the real engine now
	// that all options (memory limit, stack size, etc.) are available.
	eng := cfg.engine
	if eng == nil {
		eng = jsruntime.NewEngineForKind(jsruntime.DefaultEngineKind(),
			cfg.memoryLimit, cfg.maxStackSize, cfg.maxExecutionTime, cfg.gcThreshold)
	} else if sentinel, ok := eng.(*kindSentinel); ok {
		eng = jsruntime.NewEngineForKind(sentinel.kind, cfg.memoryLimit, cfg.maxStackSize, cfg.maxExecutionTime, cfg.gcThreshold)
	}

	p := &Pool{
		pool:              make(chan *pooledRuntime, size),
		workers:           make(chan func(), size*2),
		bundleCode:        bundleCode,
		gojaBundle:        cfg.gojaBundle,
		engine:            eng,
		env:               env,
		bundleCacheDir:    cfg.bundleCacheDir,
		precompiledBundle: cfg.precompiledBundle,
		contextProvider:   cfg.contextProvider,
		requestTimeout:    cfg.requestTimeout,
		bootstrap: cfg.bootstrap,
		polyfill:  cfg.polyfill,
		selfURL:   cfg.selfURL,
	}

	for i := 0; i < size; i++ {
		go func() {
			for fn := range p.workers {
				fn()
			}
		}()
	}

	// Pre-warm all slots: triggers bytecode compilation (once, shared) and surfaces errors at startup.
	for i := 0; i < size; i++ {
		prt, err := p.newRuntime()
		if err != nil {
			close(p.pool)
			for prt := range p.pool {
				prt.rt.Close()
			}
			return nil, fmt.Errorf("pool warm-up (slot %d/%d): %w", i+1, size, err)
		}
		p.pool <- prt
	}

	return p, nil
}

// newRuntime creates and initializes a fresh JS runtime.
// For QJS: bytecodes are compiled once on the first call (via sync.Once) and reused.
// For goja: source strings are stored and eval'd per runtime.
func (p *Pool) newRuntime() (*pooledRuntime, error) {
	rt, err := p.engine.New()
	if err != nil {
		return nil, err
	}

	if p.engine.SupportsBytecode() {
		p.bcsOnce.Do(func() {
			bundleBC := p.precompiledBundle

			if bundleBC == nil && p.bundleCacheDir != "" {
				key := jsruntime.BundleCacheKey(p.bundleCode)
				cachePath := filepath.Join(p.bundleCacheDir, key+".bc")
				if bc, err := os.ReadFile(cachePath); err == nil {
					rtlog.Debug("bundle cache hit", "path", cachePath)
					bundleBC = bc
				}
			}

			p.bcs, p.bcsErr = jsruntime.CompileBytecodes(rt.Ctx(), p.bundleCode, bundleBC)

			if p.bcsErr == nil && p.bundleCacheDir != "" && p.precompiledBundle == nil && bundleBC == nil {
				key := jsruntime.BundleCacheKey(p.bundleCode)
				cachePath := filepath.Join(p.bundleCacheDir, key+".bc")
				if mkErr := os.MkdirAll(p.bundleCacheDir, 0755); mkErr == nil {
					if saveErr := os.WriteFile(cachePath, p.bcs.Bundle, 0644); saveErr == nil {
						rtlog.Debug("bundle cache saved", "path", cachePath)
					}
				}
			}
		})
		if p.bcsErr != nil {
			rt.Close()
			return nil, fmt.Errorf("compile bytecodes: %w", p.bcsErr)
		}
	}

	// For goja engine, prefer the explicit IIFE bundle; fall back to bundleCode.
	bundleSrc := p.bundleCode
	if !p.engine.SupportsBytecode() && len(p.gojaBundle) > 0 {
		bundleSrc = p.gojaBundle
	}

	prt := &pooledRuntime{rt: rt}
	ctx := rt.Ctx()

	streamCallbacks := jsruntime.StreamCallbacks{
		SendHeaders: func(status int, headersJSON string) {
			if ch := prt.streamCh; ch != nil {
				ch <- ResponseSignal{
					Kind:     sigHeader,
					Meta:     responseMeta{Status: status, HeadersJSON: headersJSON},
					BodyTime: time.Now(),
				}
			}
		},
		SendChunk: func(chunk []byte) {
			if ch := prt.streamCh; ch != nil {
				ch <- ResponseSignal{Kind: sigChunk, Chunk: chunk}
			}
		},
		EndStream: func(checkpoints []trace.JSCheckpoint) {
			if ch := prt.streamCh; ch != nil {
				ch <- ResponseSignal{Kind: sigDone, JSCheckpoints: checkpoints}
			}
		},
	}

	if err := jsruntime.SetupRuntime(ctx, jsruntime.SetupOptions{
		BCS:           p.bcs,
		Bundle:        bundleSrc,
		Env:           p.env,
		Stream:        streamCallbacks,
		Bootstrap: p.bootstrap,
		Polyfill:  p.polyfill,
		SelfURL:   p.selfURL,
	}, p.engine); err != nil {
		rt.Close()
		return nil, err
	}
	return prt, nil
}

// Get checks out a runtime. Caller MUST call Put() when done.
// Blocks until a runtime is available (bounded pool — never exceeds size).
// ctx is used to call PoolWaiting on the RequestTrace if the pool has no idle runtimes.
func (p *Pool) Get(ctx context.Context) (*pooledRuntime, error) {
	select {
	case prt := <-p.pool:
		return prt, nil
	default:
		if rt := trace.ContextRequestTrace(ctx); rt != nil && rt.PoolWaiting != nil {
			rt.PoolWaiting()
		}
	}
	prt := <-p.pool
	return prt, nil
}

// Put returns a runtime to the pool. Closes the runtime if the pool channel is full.
func (p *Pool) Put(prt *pooledRuntime) {
	select {
	case p.pool <- prt:
	default:
		prt.rt.Close()
	}
}

// submit sends fn to a worker goroutine. Falls back to a temporary goroutine if all workers are busy.
// ctx is used to call WorkerFallback on the RequestTrace when the fallback path is taken.
func (p *Pool) submit(ctx context.Context, fn func()) {
	select {
	case p.workers <- fn:
	default:
		if rt := trace.ContextRequestTrace(ctx); rt != nil && rt.WorkerFallback != nil {
			rt.WorkerFallback()
		}
		go fn()
	}
}

// PoolStats is a point-in-time snapshot of pool utilization.
type PoolStats struct {
	Size int // total runtimes in the pool
	Idle int // currently idle (available)
	Busy int // currently in use
}

// Stats returns a snapshot of the pool's current utilization.
func (p *Pool) Stats() PoolStats {
	idle := len(p.pool)
	size := cap(p.pool)
	return PoolStats{Size: size, Idle: idle, Busy: size - idle}
}

// Close stops all worker goroutines.
func (p *Pool) Close() { close(p.workers) }
