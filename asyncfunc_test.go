package astroruntime

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/dxkite/qjs"
)

// TestSetAsyncFuncSingle verifies a single SetGoAsyncFunc works correctly.
func TestSetAsyncFuncSingle(t *testing.T) {
	rt, err := qjs.New()
	if err != nil {
		t.Fatal("New runtime:", err)
	}
	ctx := rt.Context()

	ctx.SetGoAsyncFunc("asyncFunction", func(_ context.Context, args ...any) (any, error) {
		time.Sleep(50 * time.Millisecond)
		return "hello from async", nil
	})

	result, err := ctx.Eval("test.js", qjs.Code(`
		async function main() {
			const r = await asyncFunction();
			return r;
		}
		({ main: main() });
	`))
	if err != nil {
		t.Fatal("Eval error:", err)
	}
	defer result.Free()

	val, err := result.GetPropertyStr("main").Await()
	if err != nil {
		t.Fatal("Await error:", err)
	}
	if val.String() != "hello from async" {
		t.Fatalf("expected 'hello from async', got %q", val.String())
	}
	t.Log("single async OK:", val.String())
}

// TestSetAsyncFuncConcurrent verifies concurrent Promise.allSettled works without panic.
func TestSetAsyncFuncConcurrent(t *testing.T) {
	rt, err := qjs.New()
	if err != nil {
		t.Fatal("New runtime:", err)
	}
	ctx := rt.Context()

	ctx.SetGoAsyncFunc("asyncFetch", func(_ context.Context, args ...any) (any, error) {
		id := ""
		if len(args) > 0 {
			id, _ = args[0].(string)
		}
		time.Sleep(50 * time.Millisecond)
		return "result-" + id, nil
	})

	result, err := ctx.Eval("test.js", qjs.Code(`
		async function main() {
			const results = await Promise.allSettled([
				asyncFetch('a'),
				asyncFetch('b'),
				asyncFetch('c'),
			]);
			return results.map(r => r.value).join(',');
		}
		({ main: main() });
	`))
	if err != nil {
		t.Fatal("Eval error:", err)
	}
	defer result.Free()

	val, err := result.GetPropertyStr("main").Await()
	if err != nil {
		t.Fatal("Await error:", err)
	}
	t.Log("concurrent async result:", val.String())
}

// TestSetAsyncFuncTiming verifies concurrent fetch is truly parallel (~100ms, not ~300ms).
func TestSetAsyncFuncTiming(t *testing.T) {
	rt, err := qjs.New()
	if err != nil {
		t.Fatal("New runtime:", err)
	}
	ctx := rt.Context()

	ctx.SetGoAsyncFunc("asyncFetch", func(_ context.Context, args ...any) (any, error) {
		time.Sleep(100 * time.Millisecond)
		return "ok", nil
	})

	result, err := ctx.Eval("test.js", qjs.Code(`
		async function main() {
			const results = await Promise.allSettled([
				asyncFetch(),
				asyncFetch(),
				asyncFetch(),
			]);
			return results.map(r => r.value).join(',');
		}
		({ main: main() });
	`))
	if err != nil {
		t.Fatal("Eval error:", err)
	}
	defer result.Free()

	start := time.Now()
	val, err := result.GetPropertyStr("main").Await()
	elapsed := time.Since(start)
	if err != nil {
		t.Fatal("Await error:", err)
	}

	t.Logf("result: %s, elapsed: %v", val.String(), elapsed)

	if elapsed > 250*time.Millisecond {
		fmt.Printf("  => SEQUENTIAL (elapsed=%v, ~3x single request)\n", elapsed)
		t.Errorf("expected concurrent execution (<250ms), got %v", elapsed)
	} else {
		fmt.Printf("  => CONCURRENT (elapsed=%v, ~1x single request)\n", elapsed)
	}
}
