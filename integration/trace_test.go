package integration_test

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/dxkite/yozh"
	"github.com/dxkite/yozh/trace"
)

// doTrace issues a GET request through pool with the given RequestTrace attached to the context.
func doTrace(t *testing.T, pool *yozh.Pool, path string, rt *trace.RequestTrace) *httptest.ResponseRecorder {
	t.Helper()
	req, err := http.NewRequest(http.MethodGet, "http://localhost"+path, nil)
	if err != nil {
		t.Fatalf("NewRequest: %v", err)
	}
	req = req.WithContext(trace.WithRequestTrace(req.Context(), rt))
	w := httptest.NewRecorder()
	rc, err := pool.RequestContext(w, req)
	if err != nil {
		t.Fatalf("RequestContext: %v", err)
	}
	yozh.HandleRequest(rc)
	return w
}

// TestRequestTraceHooks verifies that all primary hooks fire with non-negative latency
// on a successful SSR request.
func TestRequestTraceHooks(t *testing.T) {
	var (
		poolGetCalled      atomic.Bool
		firstByteCalled    atomic.Bool
		responseDoneCalled atomic.Bool
		goCallDoneCalled   atomic.Bool

		poolGetStart time.Time
		poolGetEnd   time.Time
		respStart    time.Time
		respEnd      time.Time
		goCallStart  time.Time
		goCallEnd    time.Time
		goCallErr    error

		jsNames []string
		jsMu    sync.Mutex
	)

	rt := &trace.RequestTrace{
		PoolGetDone: func(start, end time.Time) {
			poolGetCalled.Store(true)
			poolGetStart = start
			poolGetEnd = end
		},
		GotFirstResponseByte: func() {
			firstByteCalled.Store(true)
		},
		ResponseDone: func(start, end time.Time) {
			responseDoneCalled.Store(true)
			respStart = start
			respEnd = end
		},
		GoCallDone: func(start, end time.Time, err error) {
			goCallDoneCalled.Store(true)
			goCallStart = start
			goCallEnd = end
			goCallErr = err
		},
		JSCallDone: func(name string, start, end time.Time, err error) {
			jsMu.Lock()
			jsNames = append(jsNames, name)
			jsMu.Unlock()
		},
	}

	w := doTrace(t, sharedPool, "/", rt)

	if w.Code != http.StatusOK {
		t.Fatalf("want 200, got %d", w.Code)
	}
	if !poolGetCalled.Load() {
		t.Error("PoolGetDone not called")
	}
	if !poolGetEnd.After(poolGetStart) && poolGetStart != poolGetEnd {
		t.Errorf("PoolGetDone: end %v not after start %v", poolGetEnd, poolGetStart)
	}
	if !firstByteCalled.Load() {
		t.Error("GotFirstResponseByte not called")
	}
	if !responseDoneCalled.Load() {
		t.Error("ResponseDone not called")
	}
	if respEnd.Before(respStart) {
		t.Errorf("ResponseDone: end %v before start %v", respEnd, respStart)
	}

	// GoCallDone fires in the worker goroutine after eval returns; give it time.
	deadline := time.Now().Add(500 * time.Millisecond)
	for !goCallDoneCalled.Load() && time.Now().Before(deadline) {
		time.Sleep(5 * time.Millisecond)
	}
	if !goCallDoneCalled.Load() {
		t.Error("GoCallDone not called within 500ms")
	}
	if goCallEnd.Before(goCallStart) {
		t.Errorf("GoCallDone: end %v before start %v", goCallEnd, goCallStart)
	}
	if goCallErr != nil {
		t.Errorf("GoCallDone: unexpected error: %v", goCallErr)
	}

	jsMu.Lock()
	names := append([]string(nil), jsNames...)
	jsMu.Unlock()

	hasName := func(want string) bool {
		for _, n := range names {
			if n == want {
				return true
			}
		}
		return false
	}
	for _, want := range []string{"__go_sendHeaders", "__go_endStream"} {
		if !hasName(want) {
			t.Errorf("JSCallDone: missing %q (got %v)", want, names)
		}
	}
}

// TestRequestTraceHookOrder verifies that within the main goroutine hooks fire in
// the order: PoolGetDone → GotFirstResponseByte → ResponseDone.
func TestRequestTraceHookOrder(t *testing.T) {
	var events []string
	var mu sync.Mutex
	add := func(name string) {
		mu.Lock()
		events = append(events, name)
		mu.Unlock()
	}

	rt := &trace.RequestTrace{
		PoolGetDone:          func(_, _ time.Time) { add("PoolGetDone") },
		GotFirstResponseByte: func() { add("GotFirstResponseByte") },
		ResponseDone:         func(_, _ time.Time) { add("ResponseDone") },
	}

	doTrace(t, sharedPool, "/", rt)

	mu.Lock()
	got := append([]string(nil), events...)
	mu.Unlock()

	want := []string{"PoolGetDone", "GotFirstResponseByte", "ResponseDone"}
	if len(got) < len(want) {
		t.Fatalf("want %d events, got %d: %v", len(want), len(got), got)
	}
	for i, w := range want {
		if got[i] != w {
			t.Errorf("event[%d]: want %q, got %q (full: %v)", i, w, got[i], got)
		}
	}
}

// TestRequestTraceJSCallOrder verifies that __go_sendHeaders is recorded before __go_endStream
// in the JSCallDone sequence.
func TestRequestTraceJSCallOrder(t *testing.T) {
	var names []string
	var mu sync.Mutex

	rt := &trace.RequestTrace{
		JSCallDone: func(name string, _, _ time.Time, _ error) {
			mu.Lock()
			names = append(names, name)
			mu.Unlock()
		},
	}

	doTrace(t, sharedPool, "/", rt)

	// GoCallDone/JSCallDone from the worker may still be in flight; wait briefly.
	time.Sleep(50 * time.Millisecond)

	mu.Lock()
	got := append([]string(nil), names...)
	mu.Unlock()

	sendIdx, endIdx := -1, -1
	for i, n := range got {
		if n == "__go_sendHeaders" && sendIdx < 0 {
			sendIdx = i
		}
		if n == "__go_endStream" && endIdx < 0 {
			endIdx = i
		}
	}
	if sendIdx < 0 {
		t.Errorf("__go_sendHeaders not found in JSCallDone sequence: %v", got)
	}
	if endIdx < 0 {
		t.Errorf("__go_endStream not found in JSCallDone sequence: %v", got)
	}
	if sendIdx >= 0 && endIdx >= 0 && sendIdx >= endIdx {
		t.Errorf("__go_sendHeaders (idx %d) should precede __go_endStream (idx %d): %v",
			sendIdx, endIdx, got)
	}
}

// TestRequestTraceCompose verifies that two stacked RequestTraces both receive all hooks,
// with the first (outer) trace firing before the second (inner), mirroring
// net/http/httptrace.WithClientTrace composition semantics.
func TestRequestTraceCompose(t *testing.T) {
	type entry struct{ who, hook string }
	var events []entry
	var mu sync.Mutex
	add := func(who, hook string) {
		mu.Lock()
		events = append(events, entry{who, hook})
		mu.Unlock()
	}

	rt1 := &trace.RequestTrace{
		PoolGetDone:          func(_, _ time.Time) { add("rt1", "PoolGetDone") },
		GotFirstResponseByte: func() { add("rt1", "GotFirstResponseByte") },
		ResponseDone:         func(_, _ time.Time) { add("rt1", "ResponseDone") },
	}
	rt2 := &trace.RequestTrace{
		PoolGetDone:          func(_, _ time.Time) { add("rt2", "PoolGetDone") },
		GotFirstResponseByte: func() { add("rt2", "GotFirstResponseByte") },
		ResponseDone:         func(_, _ time.Time) { add("rt2", "ResponseDone") },
	}

	req, _ := http.NewRequest(http.MethodGet, "http://localhost/", nil)
	ctx := trace.WithRequestTrace(req.Context(), rt1)
	ctx = trace.WithRequestTrace(ctx, rt2)
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()
	rc, err := sharedPool.RequestContext(w, req)
	if err != nil {
		t.Fatal(err)
	}
	yozh.HandleRequest(rc)

	mu.Lock()
	got := append([]entry(nil), events...)
	mu.Unlock()

	// Each hook must appear for both rt1 and rt2.
	hooks := []string{"PoolGetDone", "GotFirstResponseByte", "ResponseDone"}
	for _, hook := range hooks {
		var saw1, saw2 bool
		for _, e := range got {
			if e.hook == hook && e.who == "rt1" {
				saw1 = true
			}
			if e.hook == hook && e.who == "rt2" {
				saw2 = true
			}
		}
		if !saw1 {
			t.Errorf("rt1 did not receive %q", hook)
		}
		if !saw2 {
			t.Errorf("rt2 did not receive %q", hook)
		}
	}

	// rt1 must fire before rt2 for each hook (compose: old first).
	for _, hook := range hooks {
		var idx1, idx2 int = -1, -1
		for i, e := range got {
			if e.hook == hook {
				if e.who == "rt1" && idx1 < 0 {
					idx1 = i
				}
				if e.who == "rt2" && idx2 < 0 {
					idx2 = i
				}
			}
		}
		if idx1 >= 0 && idx2 >= 0 && idx1 >= idx2 {
			t.Errorf("%q: rt1 (idx %d) should fire before rt2 (idx %d)", hook, idx1, idx2)
		}
	}
}

// TestRequestTracePoolWaiting verifies PoolWaiting fires when the pool has no idle runtimes.
func TestRequestTracePoolWaiting(t *testing.T) {
	bundleCode, err := os.ReadFile(filepath.Join("testdata", "example", "bundle.mjs"))
	if err != nil {
		t.Skip("testdata not available:", err)
	}

	p, err := yozh.NewPool(bundleCode, yozh.WithSize(1))
	if err != nil {
		t.Fatal(err)
	}
	defer p.Close()

	// Step 1: hold the only runtime by acquiring a RequestContext and not yet calling HandleRequest.
	held := make(chan struct{})
	release := make(chan struct{})
	firstDone := make(chan struct{})
	go func() {
		defer close(firstDone)
		req, _ := http.NewRequest(http.MethodGet, "http://localhost/", nil)
		w := httptest.NewRecorder()
		rc, err := p.RequestContext(w, req)
		if err != nil {
			return
		}
		close(held) // runtime checked out
		<-release   // wait for signal before releasing
		yozh.HandleRequest(rc)
	}()
	<-held

	// Step 2: a second request should find the pool empty and trigger PoolWaiting.
	waiting := make(chan struct{}, 1)
	var poolWaitingFired atomic.Bool

	rt := &trace.RequestTrace{
		PoolWaiting: func() {
			poolWaitingFired.Store(true)
			select {
			case waiting <- struct{}{}: // signal that we're about to block
			default:
			}
		},
	}

	secondDone := make(chan struct{})
	go func() {
		defer close(secondDone)
		req, _ := http.NewRequest(http.MethodGet, "http://localhost/", nil)
		req = req.WithContext(trace.WithRequestTrace(req.Context(), rt))
		w := httptest.NewRecorder()
		rc, err := p.RequestContext(w, req) // blocks after PoolWaiting fires
		if err != nil {
			return
		}
		yozh.HandleRequest(rc)
	}()

	// Wait for PoolWaiting to fire before releasing the held runtime.
	select {
	case <-waiting:
	case <-time.After(3 * time.Second):
		t.Fatal("PoolWaiting not fired within 3s")
	}

	close(release) // unblock first goroutine → runtime returns to pool → second goroutine unblocks
	<-firstDone
	<-secondDone

	if !poolWaitingFired.Load() {
		t.Error("PoolWaiting hook was not called")
	}
}

// TestRequestTraceFetchDone verifies FetchDone fires with correct method, status, and latency
// when JS code issues an outbound fetch.
func TestRequestTraceFetchDone(t *testing.T) {
	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"ok":true}`)
	}))
	defer backend.Close()

	var (
		mu          sync.Mutex
		fetchCalled bool
		fetchMethod string
		fetchStatus int
		fetchStart  time.Time
		fetchEnd    time.Time
		fetchErr    error
	)

	rt := &trace.RequestTrace{
		FetchDone: func(method, path string, status int, start, end time.Time, err error) {
			mu.Lock()
			fetchCalled = true
			fetchMethod = method
			fetchStatus = status
			fetchStart = start
			fetchEnd = end
			fetchErr = err
			mu.Unlock()
		},
	}

	expr := fmt.Sprintf(`(async function() { var r = await fetch(%q); return r.status; })()`, backend.URL)
	path := "/test?expr=" + encodeURIComponent(expr)

	req, _ := http.NewRequest(http.MethodGet, "http://localhost"+path, nil)
	req = req.WithContext(trace.WithRequestTrace(req.Context(), rt))
	w := httptest.NewRecorder()
	rc, err := minPool.RequestContext(w, req)
	if err != nil {
		t.Fatal(err)
	}
	yozh.HandleRequest(rc)

	mu.Lock()
	defer mu.Unlock()

	if !fetchCalled {
		t.Fatal("FetchDone not called")
	}
	if fetchErr != nil {
		t.Errorf("FetchDone: unexpected error: %v", fetchErr)
	}
	if fetchMethod != "GET" {
		t.Errorf("FetchDone: method want GET, got %q", fetchMethod)
	}
	if fetchStatus != http.StatusOK {
		t.Errorf("FetchDone: status want 200, got %d", fetchStatus)
	}
	if !fetchEnd.After(fetchStart) {
		t.Errorf("FetchDone: end %v not after start %v", fetchEnd, fetchStart)
	}
}

// TestRequestTraceFetchError verifies FetchDone is called with a non-nil error when the
// upstream is unreachable.
func TestRequestTraceFetchError(t *testing.T) {
	var (
		mu          sync.Mutex
		fetchCalled bool
		fetchErr    error
		fetchStatus int
	)

	rt := &trace.RequestTrace{
		FetchDone: func(method, path string, status int, start, end time.Time, err error) {
			mu.Lock()
			fetchCalled = true
			fetchErr = err
			fetchStatus = status
			mu.Unlock()
		},
	}

	// Dial a port that should be unreachable (use a local address that refuses connections).
	expr := `(async function() { try { var r = await fetch('http://127.0.0.1:1'); return r.status; } catch(e) { return String(e); } })()`
	path := "/test?expr=" + encodeURIComponent(expr)

	req, _ := http.NewRequest(http.MethodGet, "http://localhost"+path, nil)
	req = req.WithContext(trace.WithRequestTrace(req.Context(), rt))
	w := httptest.NewRecorder()
	rc, err := minPool.RequestContext(w, req)
	if err != nil {
		t.Fatal(err)
	}
	yozh.HandleRequest(rc)

	mu.Lock()
	defer mu.Unlock()

	if !fetchCalled {
		t.Fatal("FetchDone not called on fetch error")
	}
	if fetchErr == nil {
		t.Error("FetchDone: expected non-nil error for unreachable host")
	}
	if fetchStatus != 0 {
		t.Errorf("FetchDone: status want 0 on error, got %d", fetchStatus)
	}
}

// TestRequestTraceJSCheckpointsDone verifies that JSCheckpointsDone is called once per
// JS-side checkpoint with valid absolute timestamps.
func TestRequestTraceJSCheckpointsDone(t *testing.T) {
	var (
		mu          sync.Mutex
		checkpoints []struct{ name string; start, end time.Time }
	)

	rt := &trace.RequestTrace{
		JSCheckpointsDone: func(name string, start, end time.Time) {
			mu.Lock()
			checkpoints = append(checkpoints, struct{ name string; start, end time.Time }{name, start, end})
			mu.Unlock()
		},
	}

	w := doTrace(t, sharedPool, "/", rt)
	if w.Code != http.StatusOK {
		t.Fatalf("want 200, got %d", w.Code)
	}

	mu.Lock()
	got := append(checkpoints[:0:0], checkpoints...)
	mu.Unlock()

	if len(got) == 0 {
		t.Fatal("JSCheckpointsDone not called; expected JS checkpoint data from sharedPool bundle")
	}

	names := make(map[string]bool)
	for _, cp := range got {
		names[cp.name] = true
		if cp.start.IsZero() {
			t.Errorf("checkpoint %q: start is zero", cp.name)
		}
		if cp.end.Before(cp.start) {
			t.Errorf("checkpoint %q: end %v before start %v", cp.name, cp.end, cp.start)
		}
	}
	if !names["ssr"] {
		t.Errorf("expected checkpoint \"ssr\", got names: %v", names)
	}
}

// TestRequestTraceNilSafe verifies requests without a RequestTrace in context do not panic.
func TestRequestTraceNilSafe(t *testing.T) {
	// No WithRequestTrace — just a plain request through the pool.
	w := do(t, sharedPool, http.MethodGet, "/", "", "")
	if w.Code != http.StatusOK {
		t.Fatalf("want 200, got %d", w.Code)
	}
}
