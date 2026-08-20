package yozh

import (
	"fmt"
	"testing"
	"time"

	"github.com/dxkite/yozh/pkg/node"
	sobek "github.com/dxkite/yozh/pkg/sobek"
)

func newTimerCtx(t *testing.T) sobek.JSContext {
	t.Helper()
	eng := sobek.NewEngineForKind(sobek.EngineGoja)
	rt, err := eng.New()
	if err != nil {
		t.Fatal("New runtime:", err)
	}
	t.Cleanup(rt.Close)
	return rt.Ctx()
}

func TestGojaSetTimeoutFires(t *testing.T) {
	ctx := newTimerCtx(t)
	start := time.Now()
	err := ctx.Eval("test.js", `
		await new Promise(resolve => setTimeout(resolve, 80));
	`, sobek.EvalAsync)
	elapsed := time.Since(start)
	if err != nil {
		t.Fatal(err)
	}
	if elapsed < 70*time.Millisecond {
		t.Errorf("setTimeout fired too early: %v", elapsed)
	}
	t.Logf("setTimeout(80ms) elapsed: %v", elapsed)
}

// TestGojaSetTimeoutExtraArgs verifies extra args are forwarded to the callback.
func TestGojaSetTimeoutExtraArgs(t *testing.T) {
	ctx := newTimerCtx(t)
	err := ctx.Eval("test.js", `
		let got;
		await new Promise(resolve => setTimeout((a, b) => { got = a + b; resolve(); }, 10, 'hello', ' world'));
		if (got !== 'hello world') throw new Error('got: ' + got);
	`, sobek.EvalAsync)
	if err != nil {
		t.Fatal(err)
	}
}

func TestGojaClearTimeout(t *testing.T) {
	ctx := newTimerCtx(t)
	err := ctx.Eval("test.js", `
		let fired = false;
		const id = setTimeout(() => { fired = true; }, 50);
		clearTimeout(id);
		await new Promise(resolve => setTimeout(resolve, 100));
		if (fired) throw new Error('clearTimeout did not cancel the timer');
	`, sobek.EvalAsync)
	if err != nil {
		t.Fatal(err)
	}
}

func TestGojaSetIntervalRepeats(t *testing.T) {
	ctx := newTimerCtx(t)
	err := ctx.Eval("test.js", `
		let count = 0;
		await new Promise(resolve => {
			const id = setInterval(() => {
				count++;
				if (count >= 3) { clearInterval(id); resolve(); }
			}, 20);
		});
		if (count !== 3) throw new Error('count: ' + count);
	`, sobek.EvalAsync)
	if err != nil {
		t.Fatal(err)
	}
	t.Log("setInterval fired 3 times OK")
}

// TestGojaSetIntervalExtraArgs verifies extra args are forwarded by setInterval.
func TestGojaSetIntervalExtraArgs(t *testing.T) {
	ctx := newTimerCtx(t)
	err := ctx.Eval("test.js", `
		let sum = 0;
		await new Promise(resolve => {
			const id = setInterval((x) => { sum += x; if (sum >= 6) { clearInterval(id); resolve(); } }, 15, 2);
		});
		if (sum < 6) throw new Error('sum: ' + sum);
	`, sobek.EvalAsync)
	if err != nil {
		t.Fatal(err)
	}
}

func TestGojaClearInterval(t *testing.T) {
	ctx := newTimerCtx(t)
	err := ctx.Eval("test.js", `
		let count = 0;
		await new Promise(resolve => {
			const id = setInterval(() => {
				count++;
				clearInterval(id);
				setTimeout(resolve, 60);
			}, 10);
		});
		if (count !== 1) throw new Error('interval fired after clearInterval: count=' + count);
	`, sobek.EvalAsync)
	if err != nil {
		t.Fatal(err)
	}
}

func TestGojaSetImmediateFires(t *testing.T) {
	ctx := newTimerCtx(t)
	err := ctx.Eval("test.js", `
		let fired = false;
		await new Promise(resolve => setImmediate(() => { fired = true; resolve(); }));
		if (!fired) throw new Error('setImmediate did not fire');
	`, sobek.EvalAsync)
	if err != nil {
		t.Fatal(err)
	}
}

// TestGojaSetImmediateExtraArgs verifies extra args are forwarded by setImmediate.
func TestGojaSetImmediateExtraArgs(t *testing.T) {
	ctx := newTimerCtx(t)
	err := ctx.Eval("test.js", `
		let got;
		await new Promise(resolve => setImmediate((v) => { got = v; resolve(); }, 42));
		if (got !== 42) throw new Error('got: ' + got);
	`, sobek.EvalAsync)
	if err != nil {
		t.Fatal(err)
	}
}

// TestGojaTimerCleanup verifies that timers from a completed request are cancelled
// and do not execute after evalAsync returns.
func TestGojaTimerCleanup(t *testing.T) {
	eng := sobek.NewEngineForKind(sobek.EngineGoja)
	rt, err := eng.New()
	if err != nil {
		t.Fatal(err)
	}
	defer rt.Close()
	ctx := rt.Ctx()

	// Request 1: set a fire-and-forget timer that would fire after the request ends.
	err = ctx.Eval("req1.js", `
		let strayFired = false;
		globalThis.__strayFired = false;
		setTimeout(() => { globalThis.__strayFired = true; }, 200);
		// Request completes immediately without waiting for the timer.
	`, sobek.EvalAsync)
	if err != nil {
		t.Fatal("req1:", err)
	}

	// Wait longer than the timer delay — the cancelled timer must NOT fire.
	time.Sleep(300 * time.Millisecond)

	// Request 2: check that the stray timer did not execute.
	err = ctx.Eval("req2.js", `
		if (globalThis.__strayFired) throw new Error('stray timer fired after request ended');
	`, sobek.EvalAsync)
	if err != nil {
		t.Fatal("req2:", err)
	}
	t.Log("timer cleanup OK: stray timer was cancelled")
}

// TestGojaProcessNextTick verifies process.nextTick schedules a microtask.
func TestGojaProcessNextTick(t *testing.T) {
	eng := sobek.NewEngineForKind(sobek.EngineGoja)
	rt, err := eng.New()
	if err != nil {
		t.Fatal(err)
	}
	defer rt.Close()

	// Setup polyfills so process is defined.
	if err := node.SetupNodeGlobals(rt.Ctx(), map[string]string{}); err != nil {
		t.Fatal("setup node globals:", err)
	}
	if err := sobek.SetupRuntime(rt.Ctx(), sobek.SetupOptions{}); err != nil {
		t.Fatal("setup:", err)
	}

	err = rt.Ctx().Eval("test.js", `
		let order = [];
		process.nextTick(() => order.push('nextTick'));
		order.push('sync');
		await new Promise(resolve => setTimeout(resolve, 10));
		if (order[0] !== 'sync') throw new Error('order[0]: ' + order[0]);
		if (order[1] !== 'nextTick') throw new Error('order[1]: ' + order[1]);
	`, sobek.EvalAsync)
	if err != nil {
		t.Fatal(err)
	}
	t.Log("process.nextTick OK")
}

// TestGojaProcessNextTickArgs verifies process.nextTick forwards extra args.
func TestGojaProcessNextTickArgs(t *testing.T) {
	eng := sobek.NewEngineForKind(sobek.EngineGoja)
	rt, err := eng.New()
	if err != nil {
		t.Fatal(err)
	}
	defer rt.Close()

	if err := node.SetupNodeGlobals(rt.Ctx(), map[string]string{}); err != nil {
		t.Fatal("setup node globals:", err)
	}
	if err := sobek.SetupRuntime(rt.Ctx(), sobek.SetupOptions{}); err != nil {
		t.Fatal("setup:", err)
	}

	err = rt.Ctx().Eval("test.js", `
		let result;
		await new Promise(resolve => {
			process.nextTick((a, b) => { result = a + b; resolve(); }, 'hello', ' world');
		});
		if (result !== 'hello world') throw new Error('result: ' + result);
	`, sobek.EvalAsync)
	if err != nil {
		t.Fatal(err)
	}
}

// TestGojaSetTimeoutTiming verifies that 3 parallel setTimeouts complete in ~100ms.
func TestGojaSetTimeoutTiming(t *testing.T) {
	ctx := newTimerCtx(t)
	start := time.Now()
	err := ctx.Eval("test.js", `
		await Promise.all([
			new Promise(r => setTimeout(r, 100)),
			new Promise(r => setTimeout(r, 100)),
			new Promise(r => setTimeout(r, 100)),
		]);
	`, sobek.EvalAsync)
	elapsed := time.Since(start)
	if err != nil {
		t.Fatal(err)
	}
	if elapsed > 250*time.Millisecond {
		fmt.Printf("  => SEQUENTIAL timers (elapsed=%v)\n", elapsed)
		t.Errorf("expected parallel setTimeout (<250ms), got %v", elapsed)
	} else {
		fmt.Printf("  => PARALLEL timers (elapsed=%v)\n", elapsed)
	}
}
