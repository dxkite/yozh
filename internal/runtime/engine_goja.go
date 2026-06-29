package jsruntime

import (
	"context"
	"fmt"
	"time"

	"github.com/grafana/sobek"
)

// gojaEngine implements JSEngine using the sobek (grafana/sobek, a goja fork) pure-Go JS interpreter.
// Unlike the QJS/WASM engine, sobek runs host functions synchronously on the
// same goroutine as the JS code, so SetGoAsyncFunc behaves identically to
// SetGoFunc — no goroutine or Promise is created. JS callers that do
// `await __go_fetchRaw(...)` simply receive the resolved value as an inline
// microtask, which sobek drains before RunScript returns.
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
}

func (c *gojaContext) SetContext(ctx context.Context) { c.goCtx = ctx }
func (c *gojaContext) Deadline() (time.Time, bool)    { return c.goCtx.Deadline() }
func (c *gojaContext) Done() <-chan struct{}            { return c.goCtx.Done() }
func (c *gojaContext) Err() error                      { return c.goCtx.Err() }
func (c *gojaContext) Value(key any) any               { return c.goCtx.Value(key) }

// Eval runs src in the sobek runtime.
// EvalModule uses sobek's native ParseModule → Link → Evaluate pipeline.
// EvalAsync wraps src in an async IIFE so top-level `await` is valid.
func (c *gojaContext) Eval(filename, src string, mode EvalMode) error {
	if mode == EvalModule {
		return c.evalAsModule(filename, src)
	}
	code := src
	if mode == EvalAsync {
		code = "(async()=>{\n" + src + "\n})()"
	}
	_, err := c.rt.RunScript(filename, code)
	return err
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
		result, err := fn(c.goCtx, args...)
		if err != nil {
			promise, _, reject := c.rt.NewPromise()
			_ = reject(c.rt.NewGoError(err))
			return c.rt.ToValue(promise)
		}
		promise, resolve, _ := c.rt.NewPromise()
		_ = resolve(gojaToJSValue(c.rt, result))
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
