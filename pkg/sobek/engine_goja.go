package sobek

import (
	"context"
	"fmt"
	"sync/atomic"
	"time"

	"github.com/grafana/sobek"
)

// gojaLoop serialises all sobek API calls onto a single goroutine so that
// SetGoAsyncFunc can spawn real Go goroutines without data-racing the runtime.
//
// Every method that touches *sobek.Runtime must be called via schedule/runSync.
type gojaLoop struct {
	queue chan func()
	done  chan struct{}
}

func newGojaLoop() *gojaLoop {
	l := &gojaLoop{
		queue: make(chan func(), 128),
		done:  make(chan struct{}),
	}
	go l.run()
	return l
}

func (l *gojaLoop) run() {
	defer func() {
		if r := recover(); r != nil {
			// A panic in a loop task would otherwise kill the goroutine and
			// deadlock all callers of runSync. Close done so runSync returns
			// "gojaLoop: closed" instead of hanging forever.
			rtlog.Error("gojaLoop panic — closing loop", "panic", fmt.Sprintf("%v", r))
			select {
			case <-l.done:
			default:
				close(l.done)
			}
		}
	}()
	for {
		select {
		case fn := <-l.queue:
			fn()
		case <-l.done:
			// drain remaining jobs before exit
			for {
				select {
				case fn := <-l.queue:
					fn()
				default:
					return
				}
			}
		}
	}
}

// schedule posts fn onto the loop without waiting (fire-and-forget).
func (l *gojaLoop) schedule(fn func()) {
	select {
	case l.queue <- fn:
	case <-l.done:
	}
}

// runSync posts fn onto the loop and blocks until fn returns.
func (l *gojaLoop) runSync(fn func() error) error {
	errc := make(chan error, 1)
	select {
	case l.queue <- func() { errc <- fn() }:
	case <-l.done:
		return fmt.Errorf("gojaLoop: closed")
	}
	return <-errc
}

// runSyncCtx is like runSync but returns ctx.Err() if the context is cancelled
// while waiting to enqueue or waiting for fn to return.
func (l *gojaLoop) runSyncCtx(ctx context.Context, fn func() error) error {
	errc := make(chan error, 1)
	select {
	case l.queue <- func() { errc <- fn() }:
	case <-l.done:
		return fmt.Errorf("gojaLoop: closed")
	case <-ctx.Done():
		return ctx.Err()
	}
	select {
	case err := <-errc:
		return err
	case <-ctx.Done():
		return ctx.Err()
	}
}

func (l *gojaLoop) stop() {
	select {
	case <-l.done:
	default:
		close(l.done)
	}
}

// timerEntry tracks one active setTimeout/setInterval handle.
// active is accessed atomically from multiple goroutines; all other fields
// and the timers map are only touched on the loop goroutine.
type timerEntry struct {
	active int32 // 1 = active, 0 = cancelled/fired
	t      *time.Timer
}

// gojaEngine implements JSEngine using grafana/sobek with a per-runtime event loop.
// SetGoAsyncFunc spawns real Go goroutines; completions are resolved on the loop
// goroutine so that Promise.all([...]) executes in true parallel.
type gojaEngine struct{}

func (e *gojaEngine) New() (JSRuntime, error) {
	rt := sobek.New()
	rt.SetFieldNameMapper(sobek.UncapFieldNameMapper())
	loop := newGojaLoop()
	ctx := &gojaContext{
		rt:     rt,
		loop:   loop,
		goCtx:  context.Background(),
		timers: make(map[int64]*timerEntry),
	}
	_ = loop.runSync(func() error {
		ctx.registerTimers()
		// Log unhandled Promise rejections via rtlog instead of silently dropping them.
		rt.SetPromiseRejectionTracker(func(p *sobek.Promise, op sobek.PromiseRejectionOperation) {
			if op == sobek.PromiseRejectionReject {
				rtlog.Error("unhandled promise rejection", "reason", fmt.Sprintf("%v", p.Result()))
			}
		})
		return nil
	})
	return &gojaRuntime{ctx: ctx, loop: loop}, nil
}

func (e *gojaEngine) SupportsBytecode() bool { return false }

// gojaRuntime owns a sobek runtime and its event loop.
type gojaRuntime struct {
	ctx  *gojaContext
	loop *gojaLoop
}

func (r *gojaRuntime) Ctx() JSContext { return r.ctx }

func (r *gojaRuntime) Close() {
	// Cancel all pending timers so in-flight AfterFunc goroutines
	// see active=0 and skip loop.schedule after the loop shuts down.
	for _, entry := range r.ctx.timers {
		atomic.StoreInt32(&entry.active, 0)
		entry.t.Stop()
	}
	r.loop.stop()
}

// gojaContext wraps *sobek.Runtime and implements JSContext.
// All sobek API calls are dispatched through loop.
type gojaContext struct {
	rt      *sobek.Runtime
	loop    *gojaLoop
	goCtx   context.Context
	timerID int64                // monotonically increasing; only accessed on loop goroutine
	timers  map[int64]*timerEntry // only accessed on loop goroutine
}

func (c *gojaContext) SetContext(ctx context.Context) { c.goCtx = ctx }
func (c *gojaContext) Deadline() (time.Time, bool)    { return c.goCtx.Deadline() }
func (c *gojaContext) Done() <-chan struct{}            { return c.goCtx.Done() }
func (c *gojaContext) Err() error                      { return c.goCtx.Err() }
func (c *gojaContext) Value(key any) any               { return c.goCtx.Value(key) }

// cancelAllTimers stops and removes every pending timer.
// Must be called on the loop goroutine.
func (c *gojaContext) cancelAllTimers() {
	for id, entry := range c.timers {
		atomic.StoreInt32(&entry.active, 0)
		entry.t.Stop()
		delete(c.timers, id)
	}
}

// registerTimers installs Go-backed setTimeout/clearTimeout/setInterval/
// clearInterval/setImmediate/clearImmediate on the sobek global object.
// Must be called on the loop goroutine.
//
// Design: each timer spawns a time.AfterFunc goroutine. On expiry the goroutine
// checks entry.active atomically (fast path, no lock) then posts the JS callback
// onto the loop queue. All JS and sobek API calls execute on the loop goroutine.
//
// Extra arguments beyond delay are forwarded to the callback per the HTML spec:
//   setTimeout(fn, 100, arg1, arg2) → fn(arg1, arg2)
func (c *gojaContext) registerTimers() {
	newTimer := func(fn sobek.Callable, delayMs int64, repeat bool, args []sobek.Value) int64 {
		c.timerID++
		id := c.timerID
		entry := &timerEntry{active: 1}
		c.timers[id] = entry

		var fire func()
		fire = func() {
			if atomic.LoadInt32(&entry.active) == 0 {
				return
			}
			c.loop.schedule(func() {
				if atomic.LoadInt32(&entry.active) == 0 {
					return
				}
				if !repeat {
					atomic.StoreInt32(&entry.active, 0)
					delete(c.timers, id)
				}
				_, _ = fn(sobek.Undefined(), args...)
				_, _ = c.rt.RunScript("__drain__", "0")
				if repeat && atomic.LoadInt32(&entry.active) == 1 {
					entry.t = time.AfterFunc(time.Duration(delayMs)*time.Millisecond, fire)
				}
			})
		}

		entry.t = time.AfterFunc(time.Duration(delayMs)*time.Millisecond, fire)
		return id
	}

	cancelTimer := func(id int64) {
		entry, ok := c.timers[id]
		if !ok {
			return
		}
		delete(c.timers, id)
		atomic.StoreInt32(&entry.active, 0)
		entry.t.Stop()
	}

	extraArgs := func(call sobek.FunctionCall, from int) []sobek.Value {
		if len(call.Arguments) <= from {
			return nil
		}
		return call.Arguments[from:]
	}

	c.rt.Set("setTimeout", func(call sobek.FunctionCall) sobek.Value {
		fn, ok := sobek.AssertFunction(call.Argument(0))
		if !ok {
			return sobek.Undefined()
		}
		delay := call.Argument(1).ToInteger()
		if delay < 0 {
			delay = 0
		}
		return c.rt.ToValue(newTimer(fn, delay, false, extraArgs(call, 2)))
	})

	c.rt.Set("clearTimeout", func(call sobek.FunctionCall) sobek.Value {
		cancelTimer(call.Argument(0).ToInteger())
		return sobek.Undefined()
	})

	c.rt.Set("setInterval", func(call sobek.FunctionCall) sobek.Value {
		fn, ok := sobek.AssertFunction(call.Argument(0))
		if !ok {
			return sobek.Undefined()
		}
		delay := call.Argument(1).ToInteger()
		if delay < 1 {
			delay = 1
		}
		return c.rt.ToValue(newTimer(fn, delay, true, extraArgs(call, 2)))
	})

	c.rt.Set("clearInterval", func(call sobek.FunctionCall) sobek.Value {
		cancelTimer(call.Argument(0).ToInteger())
		return sobek.Undefined()
	})

	// setImmediate posts directly to the loop queue — no goroutine, no OS timer.
	c.rt.Set("setImmediate", func(call sobek.FunctionCall) sobek.Value {
		fn, ok := sobek.AssertFunction(call.Argument(0))
		if !ok {
			return sobek.Undefined()
		}
		args := extraArgs(call, 1)
		c.timerID++
		id := c.timerID
		entry := &timerEntry{active: 1}
		c.timers[id] = entry
		c.loop.schedule(func() {
			if atomic.LoadInt32(&entry.active) == 0 {
				return
			}
			atomic.StoreInt32(&entry.active, 0)
			delete(c.timers, id)
			_, _ = fn(sobek.Undefined(), args...)
			_, _ = c.rt.RunScript("__drain__", "0")
		})
		return c.rt.ToValue(id)
	})

	c.rt.Set("clearImmediate", func(call sobek.FunctionCall) sobek.Value {
		cancelTimer(call.Argument(0).ToInteger())
		return sobek.Undefined()
	})
}

// Eval runs src on the loop goroutine.
// EvalAsync wraps src in an async IIFE and waits for the resulting Promise to settle,
// allowing goroutine-backed Promises (SetGoAsyncFunc) to resolve concurrently.
func (c *gojaContext) Eval(filename, src string, mode EvalMode) error {
	if mode == EvalAsync {
		return c.evalAsync(filename, src)
	}
	return c.loop.runSync(func() error {
		if mode == EvalModule {
			return c.evalAsModule(filename, src)
		}
		_, err := c.rt.RunScript(filename, src)
		return err
	})
}

// evalAsync runs an async IIFE on the loop, attaches .then/.catch handlers,
// and blocks until the Promise settles. After settling it cancels all pending
// timers so fire-and-forget timers from this request do not bleed into the next
// request that reuses this pooled runtime.
func (c *gojaContext) evalAsync(filename, src string) error {
	doneCh := make(chan error, 1)
	// sendDone fills doneCh exactly once. Using select/default prevents a
	// second sender (safety task or a late goroutine) from blocking the loop.
	sendDone := func(e error) {
		select {
		case doneCh <- e:
		default:
		}
	}
	c.loop.schedule(func() {
		code := "(async()=>{\n" + src + "\n})()"
		val, err := c.rt.RunScript(filename, code)
		if err != nil {
			sendDone(err)
			return
		}
		promObj := val.ToObject(c.rt)
		thenFn := func(call sobek.FunctionCall) sobek.Value {
			sendDone(nil)
			return sobek.Undefined()
		}
		catchFn := func(call sobek.FunctionCall) sobek.Value {
			reason := call.Argument(0)
			if ex, ok := reason.Export().(error); ok {
				sendDone(ex)
			} else {
				sendDone(fmt.Errorf("js: %v", reason))
			}
			return sobek.Undefined()
		}
		thenMethod, ok := sobek.AssertFunction(promObj.Get("then"))
		if !ok {
			sendDone(fmt.Errorf("evalAsync: result is not a thenable"))
			return
		}
		if _, err := thenMethod(promObj, c.rt.ToValue(thenFn), c.rt.ToValue(catchFn)); err != nil {
			sendDone(err)
		}
	})
	var err error
	select {
	case err = <-doneCh:
		// normal completion
	case <-c.goCtx.Done():
		// Deadline exceeded or cancelled. Interrupt the sobek VM so the next
		// JS opcode or RunScript call throws *InterruptedError, which triggers
		// catchFn and unblocks doneCh. rt.Interrupt is thread-safe.
		c.rt.Interrupt(c.goCtx.Err())
		// Safety valve: if all SetGoAsyncFunc goroutines returned early (P2 fix)
		// without scheduling back, no JS ever executes on the loop and the
		// interrupt never fires — doneCh would block forever. Post a task that
		// fills doneCh with the context error if thenFn/catchFn haven't already.
		ctxErr := c.goCtx.Err()
		c.loop.schedule(func() { sendDone(ctxErr) })
		err = <-doneCh
	}
	// Cancel leftover timers and clear the interrupt flag so this runtime is
	// clean when returned to the pool for the next request.
	// Use a background context so this cleanup is not itself subject to the
	// (already-expired) request deadline.
	_ = c.loop.runSyncCtx(context.Background(), func() error {
		c.cancelAllTimers()
		c.rt.ClearInterrupt()
		return nil
	})
	// Reset goCtx so a stale (possibly cancelled) request context is not
	// visible to the next request that reuses this pooled runtime.
	// Safe here: all SetGoAsyncFunc goroutines have exited or snapshotted
	// goCtx locally, and the loop cleanup task above has already returned.
	c.goCtx = context.Background()
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

// EvalBytecode falls back to source eval (sobek does not support bytecode).
func (c *gojaContext) EvalBytecode(filename string, bc []byte, mode EvalMode) error {
	return c.Eval(filename, string(bc), mode)
}

// Compile is not supported by sobek.
func (c *gojaContext) Compile(_, _ string, _ EvalMode) ([]byte, error) { return nil, nil }

// SetGoFunc registers a synchronous host function. The function runs on the loop
// goroutine (called from within JS execution), so it may freely call sobek APIs.
func (c *gojaContext) SetGoFunc(name string, fn GoFunc) {
	_ = c.loop.runSync(func() error {
		c.rt.Set(name, func(call sobek.FunctionCall) sobek.Value {
			args := gojaExportArgs(call.Arguments)
			result, err := fn(c.goCtx, args...)
			if err != nil {
				panic(c.rt.NewGoError(err))
			}
			return gojaToJSValue(c.rt, result)
		})
		return nil
	})
}

// SetGoAsyncFunc registers an async host function backed by a real goroutine.
// When JS calls the function it immediately receives a pending Promise. The Go
// function runs in a goroutine; on completion it schedules resolve/reject back
// onto the loop goroutine and then drains the microtask queue so that any
// awaiting .then() handlers execute (e.g. Promise.all internals, evalAsync
// .then handler).
func (c *gojaContext) SetGoAsyncFunc(name string, fn GoFunc) {
	_ = c.loop.runSync(func() error {
		c.rt.Set(name, func(call sobek.FunctionCall) sobek.Value {
			args := gojaExportArgs(call.Arguments)
			goCtx := c.goCtx
			promise, resolve, reject := c.rt.NewPromise()
			go func() {
				result, err := fn(goCtx, args...)
				// If the request context was cancelled while the goroutine ran,
				// skip pushing back to the loop: evalAsync will have already
				// called rt.Interrupt, and the resolve/reject would land on a
				// runtime that is being torn down for the next request.
				if goCtx.Err() != nil {
					return
				}
				c.loop.schedule(func() {
					if err != nil {
						_ = reject(c.rt.NewGoError(err))
					} else {
						_ = resolve(gojaToJSValue(c.rt, result))
					}
					_, _ = c.rt.RunScript("__drain__", "0")
				})
			}()
			return c.rt.ToValue(promise)
		})
		return nil
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
