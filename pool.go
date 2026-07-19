package astroruntime

import (
	"context"
	"fmt"
	"net/http"
	"runtime"
	"sync/atomic"
	"time"

	"github.com/dxkite/astro-runtime/pkg/node"
	sobek "github.com/dxkite/astro-runtime/pkg/sobek"
	"github.com/dxkite/astro-runtime/trace"
)

// poolConfig holds resolved configuration for NewPool.
type poolConfig struct {
	env             map[string]string
	size            int
	gojaBundle      []byte // IIFE-format bundle for goja engine (from pack's bundle-goja.mjs)
	contextProvider func(*http.Request) *NetlifyContext
	requestTimeout  time.Duration // 0 = no timeout; applied per request via context.WithTimeout
	engine          JSEngine      // nil → default goja engine
	bootstrap      string // custom bootstrap JS source; "" = use built-in astro bootstrap
	polyfill       string // custom polyfill JS source; when non-empty, replaces all built-in polyfills
	selfURL        string // internal base URL for relative fetch resolution (e.g. http://127.0.0.1:8080)
	fetchBodyLimit int64  // max fetch() response body bytes; 0 = default 10 MiB
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

// WithGojaBundle sets the IIFE-format JS source used by the goja engine when the pool
// is loaded from a .pack file. When unset, the main bundleCode passed to NewPool is used.
func WithGojaBundle(code []byte) PoolOption {
	return func(c *poolConfig) { c.gojaBundle = code }
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

// WithFetchBodyLimit sets the maximum bytes read from any fetch() response body.
// Defaults to 10 MiB when unset or zero.
func WithFetchBodyLimit(limit int64) PoolOption {
	return func(c *poolConfig) { c.fetchBodyLimit = limit }
}

// WithEngine sets a custom JSEngine implementation for the pool.
func WithEngine(engine JSEngine) PoolOption {
	return func(c *poolConfig) { c.engine = engine }
}

// WithEngineKind selects the JS engine by kind using default options.
func WithEngineKind(kind EngineKind) PoolOption {
	return func(c *poolConfig) {
		c.engine = &kindSentinel{kind: kind}
	}
}

// kindSentinel is a placeholder engine that carries only the EngineKind.
// NewPool replaces it with the real engine constructed from poolConfig.
type kindSentinel struct{ kind EngineKind }

func (*kindSentinel) New() (JSRuntime, error) { panic("kindSentinel.New called") }

// pooledRuntime wraps a JS runtime with a per-request streaming channel.
// streamCh is allocated fresh by HandleRequest before each request.
// The pool guarantees exclusive access per request.
type pooledRuntime struct {
	rt       JSRuntime
	streamCh chan ResponseSignal
}

// Pool manages a set of pre-warmed JS runtimes and a fixed-size eval worker pool.
type Pool struct {
	pool            chan *pooledRuntime
	workers         chan func()
	closed          atomic.Bool
	bundleCode      []byte
	gojaBundle      []byte // IIFE bundle for goja; falls back to bundleCode when nil
	engine          JSEngine
	env             map[string]string
	contextProvider func(*http.Request) *NetlifyContext
	requestTimeout  time.Duration
	bootstrap      string // custom bootstrap source; "" = use built-in astro bootstrap
	polyfill       string // custom polyfill source; "" = use built-in polyfills
	selfURL        string // internal base URL for relative fetch resolution
	fetchBodyLimit int64  // max fetch() response body bytes; 0 = default 10 MiB
}

// NewPoolFromPack creates a JS runtime pool from the goja bundle inside a .pack file.
// It opens the pack, extracts the goja-format bundle, and forwards to NewPool.
func NewPoolFromPack(packData []byte, opts ...PoolOption) (*Pool, error) {
	pc, err := openPackContentsInMemory(packData)
	if err != nil {
		return nil, fmt.Errorf("open pack: %w", err)
	}
	opts = append([]PoolOption{WithGojaBundle(pc.gojaCode)}, opts...)
	return NewPool(nil, opts...)
}

// NewPool creates a pool of JS runtimes, each initialized with:
//  1. Go host functions (__go_cryptoRandomBytes, __go_consoleWrite, __go_fetchRaw, etc.)
//  2. Web API polyfills (Headers, Request, Response, crypto, File, console, fetch)
//  3. The ESM SSR bundle loaded in module mode (sets globalThis.__ssrHandler)
//  4. The JS glue adapter (defines globalThis.__handleRequest)
//
// Source strings are evaluated directly in each runtime; no bytecode compilation is used.
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

	if cfg.requestTimeout == 0 {
		cfg.requestTimeout = 30 * time.Second
	}

	// Resolve the engine: if a kindSentinel was set, build the real engine now.
	eng := cfg.engine
	if eng == nil {
		eng = sobek.NewEngineForKind(sobek.DefaultEngineKind())
	} else if sentinel, ok := eng.(*kindSentinel); ok {
		eng = sobek.NewEngineForKind(sentinel.kind)
	}

	p := &Pool{
		pool:            make(chan *pooledRuntime, size),
		workers:         make(chan func(), size*2),
		bundleCode:      bundleCode,
		gojaBundle:      cfg.gojaBundle,
		engine:          eng,
		env:             env,
		contextProvider: cfg.contextProvider,
		requestTimeout:  cfg.requestTimeout,
		bootstrap:      cfg.bootstrap,
		polyfill:       cfg.polyfill,
		selfURL:        cfg.selfURL,
		fetchBodyLimit: cfg.fetchBodyLimit,
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
// Source strings are stored and eval'd per runtime.
func (p *Pool) newRuntime() (*pooledRuntime, error) {
	rt, err := p.engine.New()
	if err != nil {
		return nil, err
	}

	// Prefer the explicit IIFE bundle (e.g. from a .pack file); fall back to bundleCode.
	bundleSrc := p.bundleCode
	if len(p.gojaBundle) > 0 {
		bundleSrc = p.gojaBundle
	}

	prt := &pooledRuntime{rt: rt}
	ctx := rt.Ctx()

	streamCallbacks := sobek.StreamCallbacks{
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

	if err := node.SetupNodeGlobals(ctx, p.env); err != nil {
		rt.Close()
		return nil, fmt.Errorf("node globals: %w", err)
	}

	if err := sobek.SetupRuntime(ctx, sobek.SetupOptions{
		Bundle:         bundleSrc,
		Stream:         streamCallbacks,
		Bootstrap:      p.bootstrap,
		Polyfill:       p.polyfill,
		SelfURL:        p.selfURL,
		FetchBodyLimit: p.fetchBodyLimit,
	}); err != nil {
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

// submit sends fn to a worker goroutine. Falls back to a temporary goroutine if all workers are busy or closed.
// ctx is used to call WorkerFallback on the RequestTrace when the fallback path is taken.
func (p *Pool) submit(ctx context.Context, fn func()) {
	if p.closed.Load() {
		go fn()
		return
	}
	// Recover from "send on closed channel" that can occur if Close() fires between
	// the closed.Load() check above and the channel send in the select below.
	defer func() {
		if recover() != nil {
			go fn()
		}
	}()
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

// Close stops all worker goroutines. Safe to call once; subsequent submit() calls fall back to go fn().
func (p *Pool) Close() {
	p.closed.Store(true)
	close(p.workers)
}
