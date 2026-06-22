package astroruntime

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"sync"
	"sync/atomic"

	"github.com/dxkite/qjs"
)

// poolConfig holds resolved configuration for NewPool.
type poolConfig struct {
	env              map[string]string
	size             int
	memoryLimit      int
	maxStackSize     int
	maxExecutionTime int
	gcThreshold      int
	bytecodeCacheDir string
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

// WithBytecodeCache enables bytecode disk caching in dir.
// The cache key is SHA256 of bundle + all embedded polyfill sources, so any
// change to the bundle or a Go rebuild (polyfill update) produces a cache miss.
// Pass an empty string to disable caching (default).
func WithBytecodeCache(dir string) PoolOption {
	return func(c *poolConfig) { c.bytecodeCacheDir = dir }
}

// pooledRuntime wraps a QJS runtime with a per-request streaming channel.
// streamCh is allocated fresh by HandleSSR before each request.
// The pool guarantees exclusive access per request.
type pooledRuntime struct {
	rt             *qjs.Runtime
	streamCh       chan ResponseSignal
	responseDoneNs atomic.Int64 // Unix ns set by handler on sigDone; read by worker after eval
}

// Pool manages a set of pre-warmed QJS runtimes and a fixed-size eval worker pool.
type Pool struct {
	pool             chan *pooledRuntime
	workers          chan func()
	bundleCode       []byte
	bcs              *bytecodeSet
	bcsOnce          sync.Once
	bcsErr           error
	env              map[string]string
	qjsOpt           qjs.Option
	bytecodeCacheDir string
	rtMu             sync.Mutex // serializes lazy runtime creation
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
		pool:             make(chan *pooledRuntime, size),
		workers:          make(chan func(), size*2),
		bundleCode:       bundleCode,
		env:              env,
		bytecodeCacheDir: cfg.bytecodeCacheDir,
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

	// Eagerly warm one slot: triggers bytecode compilation and surfaces errors at startup.
	prt, err := p.newRuntime()
	if err != nil {
		return nil, fmt.Errorf("pool warm-up: %w", err)
	}
	p.pool <- prt

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
		if p.bytecodeCacheDir != "" {
			key := cacheKey(p.bundleCode)
			cachePath := filepath.Join(p.bytecodeCacheDir, key+".bc")
			if bcs, err := loadCachedBytecodes(cachePath); err == nil {
				log.Printf("bytecode cache hit: %s", cachePath)
				p.bcs = bcs
				return
			}
		}
		p.bcs, p.bcsErr = compileBytecodes(rt.Context(), p.bundleCode)
		if p.bcsErr == nil && p.bytecodeCacheDir != "" {
			key := cacheKey(p.bundleCode)
			cachePath := filepath.Join(p.bytecodeCacheDir, key+".bc")
			if mkErr := os.MkdirAll(p.bytecodeCacheDir, 0755); mkErr == nil {
				if saveErr := saveCachedBytecodes(cachePath, p.bcs); saveErr == nil {
					log.Printf("bytecode cache saved: %s", cachePath)
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
// Creates a new runtime lazily if the pool is empty.
func (p *Pool) Get() (*pooledRuntime, error) {
	select {
	case prt := <-p.pool:
		return prt, nil
	default:
	}
	p.rtMu.Lock()
	defer p.rtMu.Unlock()
	select {
	case prt := <-p.pool:
		return prt, nil
	default:
		return p.newRuntime()
	}
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
func (p *Pool) submit(fn func()) {
	select {
	case p.workers <- fn:
	default:
		go fn()
	}
}

// Close stops all worker goroutines.
func (p *Pool) Close() { close(p.workers) }
