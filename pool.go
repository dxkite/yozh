package astroruntime

import (
	"fmt"

	"github.com/dxkite/qjs"
)

// Pool wraps a QJS runtime pool pre-warmed with polyfills and the SSR bundle.
type Pool struct {
	inner *qjs.Pool
}

// NewPool creates `size` QJS runtimes, each initialized with:
//  1. Go host functions (__go_cryptoRandomBytes, __go_consoleWrite, __go_fetchRaw, etc.)
//  2. Web API polyfills (Headers, Request, Response, crypto, File, console, fetch)
//  3. The ESM SSR bundle loaded in module mode (sets globalThis.__ssrHandler)
//  4. The JS glue adapter (defines globalThis.__handleRequest)
func NewPool(bundleCode []byte, env map[string]string, size int) (*Pool, error) {
	if size <= 0 || size > 1000 {
		return nil, fmt.Errorf("pool size must be between 1 and 1000, got %d", size)
	}
	inner := qjs.NewPool(size, qjs.Option{}, func(rt *qjs.Runtime) error {
		return setupRuntime(rt, bundleCode, env)
	})

	// Eagerly warm one slot to surface initialization errors at startup.
	rt, err := inner.Get()
	if err != nil {
		return nil, fmt.Errorf("pool warm-up: %w", err)
	}
	inner.Put(rt)

	return &Pool{inner: inner}, nil
}

// Get checks out a runtime. Caller MUST call Put() when done.
func (p *Pool) Get() (*qjs.Runtime, error) { return p.inner.Get() }

// Put returns a runtime to the pool.
func (p *Pool) Put(rt *qjs.Runtime) { p.inner.Put(rt) }

// Close is a no-op: qjs.Pool has no Close method; pooled runtimes are GC'd on program exit.
func (p *Pool) Close() {}
