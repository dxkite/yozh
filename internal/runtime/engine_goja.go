package jsruntime

import (
	"context"
	"fmt"
	"time"

	"github.com/grafana/sobek"
)

// gojaEngine implements JSEngine using the sobek (grafana/sobek, a goja fork) pure-Go JS interpreter.
// sobek has no built-in event loop: a Promise left pending when RunScript returns just stays
// pending until something later calls its resolve/reject on the runtime-owning goroutine (see
// gojaContext.pumpUntilSettled). SetGoFunc host functions still run synchronously in place.
// SetGoAsyncFunc host functions (currently only __go_fetchRaw) dispatch the real work to a
// background goroutine and hand the result back through gojaContext.pending, so JS code doing
// `await Promise.allSettled([fetch(a), fetch(b), fetch(c)])` runs the fetches concurrently.
type gojaEngine struct{}

func (e *gojaEngine) New() (JSRuntime, error) {
	rt := sobek.New()
	rt.SetFieldNameMapper(sobek.UncapFieldNameMapper())
	return &gojaRuntime{
		rt:  rt,
		ctx: &gojaContext{rt: rt, goCtx: context.Background()},
	}, nil
}

// gojaRuntime wraps *sobek.Runtime.
type gojaRuntime struct {
	rt  *sobek.Runtime
	ctx *gojaContext
}

func (r *gojaRuntime) Ctx() JSContext { return r.ctx }
func (r *gojaRuntime) Close()         {}

// gojaContext wraps *sobek.Runtime and implements JSContext.
type gojaContext struct {
	rt    *sobek.Runtime
	goCtx context.Context

	// pending carries resolve/reject jobs from SetGoAsyncFunc's background goroutines back to
	// whichever goroutine currently owns rt. Eval creates a fresh channel per top-level call —
	// required, not just cautious: rt is reused sequentially across many requests, and a stale
	// job from an earlier (already-settled or abandoned) call must never be deliverable into a
	// later, unrelated call's pump loop.
	pending chan func()
}

func (c *gojaContext) SetContext(ctx context.Context) { c.goCtx = ctx }
func (c *gojaContext) Deadline() (time.Time, bool)    { return c.goCtx.Deadline() }
func (c *gojaContext) Done() <-chan struct{}            { return c.goCtx.Done() }
func (c *gojaContext) Err() error                      { return c.goCtx.Err() }
func (c *gojaContext) Value(key any) any               { return c.goCtx.Value(key) }

// Eval runs src in the sobek runtime.
// EvalModule uses sobek's native ParseModule → Link → Evaluate pipeline.
// EvalAsync wraps src in an async IIFE so top-level `await` is valid; since SetGoAsyncFunc's
// background goroutines may leave the resulting top-level Promise pending when RunScript
// returns, this drives it to completion via pumpUntilSettled.
func (c *gojaContext) Eval(filename, src string, mode EvalMode) error {
	if mode == EvalModule {
		return c.evalAsModule(filename, src)
	}
	code := src
	if mode == EvalAsync {
		code = "(async()=>{\n" + src + "\n})()"
	}
	c.pending = make(chan func())
	val, err := c.rt.RunScript(filename, code)
	if err != nil {
		return err
	}
	if mode != EvalAsync {
		return nil
	}
	promise, ok := val.Export().(*sobek.Promise)
	if !ok {
		return nil
	}
	return c.pumpUntilSettled(promise)
}

// pumpUntilSettled drives p to completion by running resolve/reject jobs delivered on
// c.pending as SetGoAsyncFunc's background goroutines finish their work. Every such goroutine
// is guaranteed to eventually send exactly one job (bounded by the host function's own timeout,
// with a recover() fallback for panics), so this loop always terminates.
func (c *gojaContext) pumpUntilSettled(p *sobek.Promise) error {
	for p.State() == sobek.PromiseStatePending {
		job := <-c.pending
		job()
	}
	if p.State() == sobek.PromiseStateRejected {
		return fmt.Errorf("%v", p.Result())
	}
	return nil
}

func (c *gojaContext) evalAsModule(filename, src string) error {
	rt := c.rt
	noExternal := func(_ any, specifier string) (sobek.ModuleRecord, error) {
		return nil, fmt.Errorf("goja: external module not supported: %s", specifier)
	}
	module, err := sobek.ParseModule(filename, src, noExternal)
	if err != nil {
		return err
	}
	if err := module.Link(); err != nil {
		return err
	}
	rt.SetImportModuleDynamically(func(ref any, specifier sobek.Value, promiseCap any) {
		empty, e := sobek.ParseModule("goja:dyn-import", "export default void 0", noExternal)
		if e != nil {
			rt.FinishLoadingImportModule(ref, specifier, promiseCap, nil, rt.NewGoError(e))
			return
		}
		if e = empty.Link(); e != nil {
			rt.FinishLoadingImportModule(ref, specifier, promiseCap, nil, rt.NewGoError(e))
			return
		}
		rt.FinishLoadingImportModule(ref, specifier, promiseCap, empty, nil)
	})
	promise := module.Evaluate(rt)
	switch promise.State() {
	case sobek.PromiseStateFulfilled:
		return nil
	case sobek.PromiseStateRejected:
		return fmt.Errorf("%v", promise.Result())
	default:
		return fmt.Errorf("goja: module evaluation left pending Promise")
	}
}

func (c *gojaContext) SetGoFunc(name string, fn GoFunc) {
	c.rt.Set(name, func(call sobek.FunctionCall) sobek.Value {
		args := gojaExportArgs(call.Arguments)
		result, err := fn(c.goCtx, args...)
		if err != nil {
			panic(c.rt.NewGoError(err))
		}
		return gojaToJSValue(c.rt, result)
	})
}

func (c *gojaContext) SetGoAsyncFunc(name string, fn GoFunc) {
	c.rt.Set(name, func(call sobek.FunctionCall) sobek.Value {
		args := gojaExportArgs(call.Arguments)
		promise, resolve, reject := c.rt.NewPromise()
		goCtx := c.goCtx     // capture per call, not per registration
		pending := c.pending // capture the current Eval call's channel
		go func() {
			defer func() {
				if r := recover(); r != nil {
					pending <- func() { reject(c.rt.NewGoError(fmt.Errorf("panic: %v", r))) }
				}
			}()
			result, err := fn(goCtx, args...)
			if err != nil {
				pending <- func() { reject(c.rt.NewGoError(err)) }
			} else {
				pending <- func() { resolve(gojaToJSValue(c.rt, result)) }
			}
		}()
		return c.rt.ToValue(promise)
	})
}

func gojaExportArgs(vals []sobek.Value) []any {
	out := make([]any, len(vals))
	for i, v := range vals {
		exported := v.Export()
		if ab, ok := exported.(sobek.ArrayBuffer); ok {
			out[i] = ab.Bytes()
		} else {
			out[i] = exported
		}
	}
	return out
}

func gojaToJSValue(rt *sobek.Runtime, v any) sobek.Value {
	if v == nil {
		return sobek.Undefined()
	}
	if b, ok := v.([]byte); ok {
		return rt.ToValue(rt.NewArrayBuffer(b))
	}
	return rt.ToValue(v)
}
