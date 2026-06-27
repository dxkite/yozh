package astroruntime

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"sync"

	"github.com/dxkite/astro-runtime/trace"
	"github.com/dxkite/qjs"
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
	contextProvider   func(*http.Request) *NetlifyContext
}

// PoolOption configures a QJS runtime pool.
type PoolOption func(*poolConfig)

// WithEnv sets the process.env map visible to JS. Defaults to an empty map.
func WithEnv(env map[string]string) PoolOption {
	return func(c *poolConfig) { c.env = env }
}

// WithSize sets the number of QJS runtimes in the pool.
// Defaults to clamp(NumCPU, 2, 8). Valid range: [1, 1000].
func WithSize(size int) PoolOption {
	return func(c *poolConfig) { c.size = size }
}

// WithMemoryLimit caps the WASM heap per runtime in bytes. 0 = no limit.
func WithMemoryLimit(bytes int) PoolOption {
	return func(c *poolConfig) { c.memoryLimit = bytes }
}

// WithMaxStackSize caps the JS call stack per runtime in bytes. 0 = default (256 KB).
func WithMaxStackSize(bytes int) PoolOption {
	return func(c *poolConfig) { c.maxStackSize = bytes }
}

// WithMaxExecutionTime caps a single Eval call in milliseconds. 0 = no limit.
func WithMaxExecutionTime(ms int) PoolOption {
	return func(c *poolConfig) { c.maxExecutionTime = ms }
}

// WithGCThreshold controls the GC trigger threshold in bytes. 0 = default.
func WithGCThreshold(bytes int) PoolOption {
	return func(c *poolConfig) { c.gcThreshold = bytes }
}

// WithPrecompiledBundle sets pre-compiled raw QuickJS bytecode for bundle.mjs.
// Polyfills and glue are still compiled fresh on each pool init (fast, < 5 ms).
// Use when the bundle.bc is already available (e.g. loaded from a .pack file).
func WithPrecompiledBundle(bc []byte) PoolOption {
	return func(c *poolConfig) { c.precompiledBundle = bc }
}

// WithBundleCache enables raw bundle bytecode disk caching in dir.
// Cache key = SHA256(bundle source + vcs.revision); a Go rebuild or bundle change
// produces a cache miss. Pass an empty string to disable (default).
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

// pooledRuntime wraps a QJS runtime with a per-request streaming channel.
// streamCh is allocated fresh by HandleRequest before each request.
// The pool guarantees exclusive access per request.
type pooledRuntime struct {
	rt       *qjs.Runtime
	streamCh chan ResponseSignal
}

// Pool manages a set of pre-warmed QJS runtimes and a fixed-size eval worker pool.
type Pool struct {
	pool              chan *pooledRuntime
	workers           chan func()
	bundleCode        []byte
	bcs               *bytecodeSet
	bcsOnce           sync.Once
	bcsErr            error
	env               map[string]string
	qjsOpt            qjs.Option
	bundleCacheDir    string
	precompiledBundle []byte
	contextProvider   func(*http.Request) *NetlifyContext
}

// NewPool creates a pool of QJS runtimes, each initialized with:
//  1. Go host functions (__go_cryptoRandomBytes, __go_consoleWrite, __go_fetchRaw, etc.)
//  2. Web API polyfills (Headers, Request, Response, crypto, File, console, fetch)
//  3. The ESM SSR bundle loaded in module mode (sets globalThis.__ssrHandler)
//  4. The JS glue adapter (defines globalThis.__handleRequest)
//
// JS source is compiled to QuickJS bytecode on the first runtime (via sync.Once);
// all subsequent runtimes reuse the same bytecodes, avoiding redundant parsing.
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

	p := &Pool{
		pool:              make(chan *pooledRuntime, size),
		workers:           make(chan func(), size*2),
		bundleCode:        bundleCode,
		env:               env,
		bundleCacheDir:    cfg.bundleCacheDir,
		precompiledBundle: cfg.precompiledBundle,
		contextProvider:   cfg.contextProvider,
		qjsOpt: qjs.Option{
			MemoryLimit:      cfg.memoryLimit,
			MaxStackSize:     cfg.maxStackSize,
			MaxExecutionTime: cfg.maxExecutionTime,
			GCThreshold:      cfg.gcThreshold,
		},
	}

	for i := 0; i < size; i++ {
		go func() {
			for fn := range p.workers {
				fn()
			}
		}()
	}

	// Pre-warm all slots: triggers bytecode compilation (once, shared) and surfaces errors at startup.
	// All runtimes are created upfront so Get() can block safely rather than spawn extras.
	for i := 0; i < size; i++ {
		prt, err := p.newRuntime()
		if err != nil {
			// Drain and close any already-created runtimes.
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

// newRuntime creates and initializes a fresh QJS runtime.
// Bytecodes are compiled once on the first call (via sync.Once) and reused by all subsequent calls.
// If bytecodeCacheDir is set, bytecodes are loaded from disk on cache hit and saved after compilation.
func (p *Pool) newRuntime() (*pooledRuntime, error) {
	rt, err := qjs.New(p.qjsOpt)
	if err != nil {
		return nil, err
	}

	p.bcsOnce.Do(func() {
		bundleBC := p.precompiledBundle

		if bundleBC == nil && p.bundleCacheDir != "" {
			key := bundleCacheKey(p.bundleCode)
			cachePath := filepath.Join(p.bundleCacheDir, key+".bc")
			if bc, err := os.ReadFile(cachePath); err == nil {
				rtlog.Debug("bundle cache hit", "path", cachePath)
				bundleBC = bc
			}
		}

		p.bcs, p.bcsErr = compileBytecodes(rt.Context(), p.bundleCode, bundleBC)

		if p.bcsErr == nil && p.bundleCacheDir != "" && p.precompiledBundle == nil && bundleBC == nil {
			key := bundleCacheKey(p.bundleCode)
			cachePath := filepath.Join(p.bundleCacheDir, key+".bc")
			if mkErr := os.MkdirAll(p.bundleCacheDir, 0755); mkErr == nil {
				if saveErr := os.WriteFile(cachePath, p.bcs.bundle, 0644); saveErr == nil {
					rtlog.Debug("bundle cache saved", "path", cachePath)
				}
			}
		}
	})
	if p.bcsErr != nil {
		rt.Close()
		return nil, fmt.Errorf("compile bytecodes: %w", p.bcsErr)
	}

	prt := &pooledRuntime{rt: rt}
	if err := setupRuntime(prt, p.bcs, p.env); err != nil {
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
