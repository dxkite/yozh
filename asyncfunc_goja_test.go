package astroruntime

import (
	"context"
	"fmt"
	"testing"
	"time"

	sobek "github.com/dxkite/astro-runtime/pkg/sobek"
)

// newGojaCtx creates a fresh sobek context with an empty polyfill setup for testing.
func newGojaCtx(t *testing.T) sobek.JSContext {
	t.Helper()
	eng := sobek.NewEngineForKind(sobek.EngineGoja)
	rt, err := eng.New()
	if err != nil {
		t.Fatal("New runtime:", err)
	}
	t.Cleanup(rt.Close)
	return rt.Ctx()
}

// TestGojaAsyncFuncSingle verifies a single SetGoAsyncFunc await resolves correctly.
func TestGojaAsyncFuncSingle(t *testing.T) {
	ctx := newGojaCtx(t)

	ctx.SetGoAsyncFunc("asyncFunc", func(_ context.Context, args ...any) (any, error) {
		time.Sleep(50 * time.Millisecond)
		return "hello from async", nil
	})

	err := ctx.Eval("test.js", `
		const r = await asyncFunc();
		if (r !== 'hello from async') throw new Error('got: ' + r);
	`, sobek.EvalAsync)
	if err != nil {
		t.Fatal("Eval error:", err)
	}
	t.Log("single async OK")
}

// TestGojaAsyncFuncError verifies that a rejected Promise propagates as a Go error.
func TestGojaAsyncFuncError(t *testing.T) {
	ctx := newGojaCtx(t)

	ctx.SetGoAsyncFunc("failFunc", func(_ context.Context, args ...any) (any, error) {
		return nil, fmt.Errorf("intentional failure")
	})

	err := ctx.Eval("test.js", `
		try {
			await failFunc();
			throw new Error('should have thrown');
		} catch (e) {
			if (!e.message.includes('intentional failure')) throw e;
		}
	`, sobek.EvalAsync)
	if err != nil {
		t.Fatal("expected error to be caught in JS, got Go error:", err)
	}
	t.Log("error propagation OK")
}

// TestGojaAsyncFuncConcurrent verifies Promise.allSettled works without panic.
func TestGojaAsyncFuncConcurrent(t *testing.T) {
	ctx := newGojaCtx(t)

	ctx.SetGoAsyncFunc("asyncFetch", func(_ context.Context, args ...any) (any, error) {
		id := ""
		if len(args) > 0 {
			id = fmt.Sprintf("%v", args[0])
		}
		time.Sleep(50 * time.Millisecond)
		return "result-" + id, nil
	})

	err := ctx.Eval("test.js", `
		const results = await Promise.allSettled([
			asyncFetch('a'),
			asyncFetch('b'),
			asyncFetch('c'),
		]);
		const values = results.map(r => r.value).join(',');
		if (!values.includes('result-a') || !values.includes('result-b') || !values.includes('result-c')) {
			throw new Error('missing values: ' + values);
		}
	`, sobek.EvalAsync)
	if err != nil {
		t.Fatal("Eval error:", err)
	}
	t.Log("concurrent async OK")
}

// TestGojaAsyncFuncTiming verifies concurrent fetch is truly parallel (~100ms, not ~300ms).
// With the event loop, Promise.all([3×100ms]) should complete in <250ms.
func TestGojaAsyncFuncTiming(t *testing.T) {
	ctx := newGojaCtx(t)

	ctx.SetGoAsyncFunc("asyncFetch", func(_ context.Context, args ...any) (any, error) {
		time.Sleep(100 * time.Millisecond)
		return "ok", nil
	})

	start := time.Now()
	err := ctx.Eval("test.js", `
		const results = await Promise.allSettled([
			asyncFetch(),
			asyncFetch(),
			asyncFetch(),
		]);
	`, sobek.EvalAsync)
	elapsed := time.Since(start)

	if err != nil {
		t.Fatal("Eval error:", err)
	}

	t.Logf("elapsed: %v", elapsed)

	if elapsed > 250*time.Millisecond {
		fmt.Printf("  => SEQUENTIAL (elapsed=%v, ~3x single request)\n", elapsed)
		t.Errorf("expected concurrent execution (<250ms), got %v", elapsed)
	} else {
		fmt.Printf("  => CONCURRENT (elapsed=%v, ~1x single request)\n", elapsed)
	}
}
