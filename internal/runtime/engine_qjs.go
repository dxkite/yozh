//go:build qjs

package jsruntime

import (
	"context"
	"time"

	"github.com/dxkite/qjs"
)

// qjsEngineOpt mirrors the qjs.Option fields used by the pool.
type qjsEngineOpt struct {
	MemoryLimit      int
	MaxStackSize     int
	MaxExecutionTime int
	GCThreshold      int
}

// qjsEngine implements JSEngine using QuickJS over WASM.
type qjsEngine struct {
	opt qjsEngineOpt
}

func (e *qjsEngine) New() (JSRuntime, error) {
	rt, err := qjs.New(qjs.Option{
		MemoryLimit:      e.opt.MemoryLimit,
		MaxStackSize:     e.opt.MaxStackSize,
		MaxExecutionTime: e.opt.MaxExecutionTime,
		GCThreshold:      e.opt.GCThreshold,
	})
	if err != nil {
		return nil, err
	}
	return &qjsRuntime{rt: rt}, nil
}

func (e *qjsEngine) SupportsBytecode() bool { return true }

// qjsRuntime wraps *qjs.Runtime.
type qjsRuntime struct {
	rt  *qjs.Runtime
	ctx *qjsContext
}

func (r *qjsRuntime) Ctx() JSContext {
	if r.ctx == nil {
		r.ctx = &qjsContext{ctx: r.rt.Context()}
	}
	return r.ctx
}

func (r *qjsRuntime) Close() { r.rt.Close() }

// qjsContext wraps *qjs.Context and implements JSContext.
type qjsContext struct {
	ctx *qjs.Context
}

func (c *qjsContext) SetContext(goCtx context.Context) { c.ctx.Context = goCtx }
func (c *qjsContext) Deadline() (time.Time, bool)       { return c.ctx.Deadline() }
func (c *qjsContext) Done() <-chan struct{}              { return c.ctx.Done() }
func (c *qjsContext) Err() error                        { return c.ctx.Err() }
func (c *qjsContext) Value(key any) any                 { return c.ctx.Value(key) }

func (c *qjsContext) Eval(filename, src string, mode EvalMode) error {
	flags := []qjs.EvalOptionFunc{qjs.Code(src)}
	flags = append(flags, evalModeToQJSFlags(mode)...)
	v, err := c.ctx.Eval(filename, flags...)
	if err != nil {
		return err
	}
	v.Free()
	return nil
}

func (c *qjsContext) EvalBytecode(filename string, bc []byte, mode EvalMode) error {
	flags := []qjs.EvalOptionFunc{qjs.Bytecode(bc)}
	flags = append(flags, evalModeToQJSFlags(mode)...)
	v, err := c.ctx.Eval(filename, flags...)
	if err != nil {
		return err
	}
	v.Free()
	return nil
}

func (c *qjsContext) Compile(filename, src string, mode EvalMode) ([]byte, error) {
	flags := []qjs.EvalOptionFunc{qjs.Code(src)}
	flags = append(flags, evalModeToQJSFlags(mode)...)
	return c.ctx.Compile(filename, flags...)
}

func (c *qjsContext) SetGoFunc(name string, fn GoFunc) {
	c.ctx.SetGoFunc(name, qjs.GoFunction(fn))
}

func (c *qjsContext) SetGoAsyncFunc(name string, fn GoFunc) {
	c.ctx.SetGoAsyncFunc(name, qjs.GoAsyncFunction(fn))
}

func evalModeToQJSFlags(mode EvalMode) []qjs.EvalOptionFunc {
	switch mode {
	case EvalModule:
		return []qjs.EvalOptionFunc{qjs.TypeModule()}
	case EvalAsync:
		return []qjs.EvalOptionFunc{qjs.FlagAsync()}
	default:
		return nil
	}
}
