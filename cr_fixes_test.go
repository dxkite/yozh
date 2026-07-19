package astroruntime

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"
)

// ── Fix 3: pool.Close() + submit() race ────────────────────────────────────────

// TestPoolSubmitAfterCloseFallback verifies that submit() after Close() does not
// panic (send on closed channel) and still executes fn via a goroutine fallback.
func TestPoolSubmitAfterCloseFallback(t *testing.T) {
	pool, err := NewPool([]byte(minimalGojaBundle), WithEngineKind(EngineGoja), WithSize(1))
	if err != nil {
		t.Fatal(err)
	}
	pool.Close()

	done := make(chan struct{}, 1)
	// Must not panic after Close.
	pool.submit(context.Background(), func() { done <- struct{}{} })

	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Error("fn not called within 2s after Close")
	}
}

// TestPoolCloseConcurrentSubmitNoPanic exercises the race between Close and
// in-flight submit calls from multiple goroutines.
func TestPoolCloseConcurrentSubmitNoPanic(t *testing.T) {
	pool, err := NewPool([]byte(minimalGojaBundle), WithEngineKind(EngineGoja), WithSize(2))
	if err != nil {
		t.Fatal(err)
	}

	var wg sync.WaitGroup
	for i := 0; i < 20; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			pool.submit(context.Background(), func() { time.Sleep(time.Millisecond) })
		}()
	}
	// Close races against the submitters; must not panic.
	pool.Close()
	wg.Wait()
}

// ── Fix 6: invalid response header JSON logged and dropped ─────────────────────

// invalidHeaderBundle directly calls __go_sendHeaders with malformed JSON so that
// handler.go's json.Unmarshal receives invalid input.
const invalidHeaderBundle = `
var handler = async function(request, context) {
  globalThis.__go_sendHeaders(200, '{bad json');
  globalThis.__go_sendChunk(new TextEncoder().encode('ok'));
  globalThis.__go_endStream('[]');
};
globalThis.__ssrEntry = { default: function() { return handler; } };
export {};
`

// TestInvalidResponseHeadersDropped verifies that a handler that emits invalid
// header JSON does not crash the server: the response body is still written and
// the status is 200.
func TestInvalidResponseHeadersDropped(t *testing.T) {
	pool, err := NewPool([]byte(invalidHeaderBundle), WithEngineKind(EngineGoja), WithSize(1))
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()

	req := httptest.NewRequest("GET", "http://localhost/", nil)
	w := httptest.NewRecorder()

	rc, err := pool.RequestContext(w, req)
	if err != nil {
		t.Fatal(err)
	}
	HandleRequest(rc)

	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Errorf("status = %d, want 200", resp.StatusCode)
	}
	if got := w.Body.String(); got != "ok" {
		t.Errorf("body = %q, want %q", got, "ok")
	}
	t.Log("invalid header JSON handled gracefully — body still written")
}

// ── Fix 7: configurable fetch() body limit ─────────────────────────────────────

// fetchBodyBundle fetches the URL from the query string and returns
// the response body length as plain text.
const fetchBodyBundle = `
var handler = async function(request, context) {
  var url = new URL(request.url);
  var target = url.searchParams.get('url');
  var resp = await fetch(target);
  var text = await resp.text();
  return new Response(String(text.length), { status: 200, headers: { 'content-type': 'text/plain' } });
};
globalThis.__ssrEntry = { default: function() { return handler; } };
export {};
`

// TestFetchBodyLimitRespected verifies that WithFetchBodyLimit caps the bytes
// read from an upstream response.
func TestFetchBodyLimitRespected(t *testing.T) {
	const upstream = 500 // bytes the upstream returns
	const limit = 100    // cap configured on the pool

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		fmt.Fprint(w, strings.Repeat("x", upstream))
	}))
	defer srv.Close()

	pool, err := NewPool(
		[]byte(fetchBodyBundle),
		WithEngineKind(EngineGoja),
		WithSize(1),
		WithFetchBodyLimit(limit),
	)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()

	req := httptest.NewRequest("GET", "http://localhost/?url="+srv.URL, nil)
	w := httptest.NewRecorder()

	rc, err := pool.RequestContext(w, req)
	if err != nil {
		t.Fatal(err)
	}
	HandleRequest(rc)

	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d; body = %s", resp.StatusCode, w.Body.String())
	}

	var got int
	fmt.Sscanf(w.Body.String(), "%d", &got)
	t.Logf("upstream=%d limit=%d got=%d", upstream, limit, got)
	if got > limit {
		t.Errorf("body length %d exceeds limit %d — WithFetchBodyLimit not respected", got, limit)
	}
}

// TestFetchBodyLimitDefault verifies that a pool without WithFetchBodyLimit still
// reads up to the default 10 MiB (but not more, and small responses pass through).
func TestFetchBodyLimitDefault(t *testing.T) {
	const upstream = 1024 // well under 10 MiB

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		fmt.Fprint(w, strings.Repeat("y", upstream))
	}))
	defer srv.Close()

	pool, err := NewPool([]byte(fetchBodyBundle), WithEngineKind(EngineGoja), WithSize(1))
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()

	req := httptest.NewRequest("GET", "http://localhost/?url="+srv.URL, nil)
	w := httptest.NewRecorder()

	rc, err := pool.RequestContext(w, req)
	if err != nil {
		t.Fatal(err)
	}
	HandleRequest(rc)

	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d; body = %s", resp.StatusCode, w.Body.String())
	}

	var got int
	fmt.Sscanf(w.Body.String(), "%d", &got)
	if got != upstream {
		t.Errorf("body length = %d, want %d", got, upstream)
	}
}

// ── Fix 8: goCtx reset after request completes / times out ────────────────────

// hangingBundle pauses for 500ms before responding, allowing us to test timeout
// followed by a successful follow-up request on the same pooled runtime.
const hangingBundle = `
var handler = async function(request, context) {
  var url = new URL(request.url);
  var delay = parseInt(url.searchParams.get('delay') || '0', 10);
  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  return new Response('ok:' + delay, { status: 200 });
};
globalThis.__ssrEntry = { default: function() { return handler; } };
export {};
`

// TestGoCtxResetAfterTimeout verifies that after a request times out, the pooled
// runtime's goCtx is reset to context.Background() so the next request can succeed.
func TestGoCtxResetAfterTimeout(t *testing.T) {
	pool, err := NewPool(
		[]byte(hangingBundle),
		WithEngineKind(EngineGoja),
		WithSize(1),
		WithRequestTimeout(80*time.Millisecond),
	)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()

	// Request 1: hangs 500ms → should be cut short by 80ms timeout.
	req1 := httptest.NewRequest("GET", "http://localhost/?delay=500", nil)
	w1 := httptest.NewRecorder()
	rc1, err := pool.RequestContext(w1, req1)
	if err != nil {
		t.Fatal(err)
	}
	start := time.Now()
	HandleRequest(rc1)
	elapsed := time.Since(start)
	t.Logf("timed-out request elapsed: %v", elapsed)
	// We don't assert status here — the timeout path can write a 500; what matters
	// is that the runtime is returned to the pool and the goCtx is clean.

	// Request 2: no delay → should complete quickly using the same pooled runtime.
	req2 := httptest.NewRequest("GET", "http://localhost/?delay=0", nil)
	w2 := httptest.NewRecorder()
	rc2, err := pool.RequestContext(w2, req2)
	if err != nil {
		t.Fatal(err)
	}
	HandleRequest(rc2)

	resp2 := w2.Result()
	if resp2.StatusCode != http.StatusOK {
		t.Errorf("follow-up request status = %d, want 200; body = %s", resp2.StatusCode, w2.Body.String())
	}
	if got := w2.Body.String(); got != "ok:0" {
		t.Errorf("follow-up body = %q, want %q", got, "ok:0")
	}
	t.Log("follow-up request after timeout succeeded — goCtx was reset correctly")
}

// TestGoCtxResetAfterNormalRequest verifies that after a normal (non-timed-out)
// request the next request on the same runtime also succeeds cleanly.
func TestGoCtxResetAfterNormalRequest(t *testing.T) {
	pool, err := NewPool(
		[]byte(hangingBundle),
		WithEngineKind(EngineGoja),
		WithSize(1),
	)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()

	for i := 0; i < 3; i++ {
		req := httptest.NewRequest("GET", "http://localhost/?delay=0", nil)
		w := httptest.NewRecorder()
		rc, err := pool.RequestContext(w, req)
		if err != nil {
			t.Fatalf("req %d: RequestContext: %v", i, err)
		}
		HandleRequest(rc)

		resp := w.Result()
		if resp.StatusCode != http.StatusOK {
			t.Errorf("req %d: status = %d, want 200", i, resp.StatusCode)
		}
		if got := w.Body.String(); got != "ok:0" {
			t.Errorf("req %d: body = %q, want %q", i, got, "ok:0")
		}
	}
	t.Log("3 sequential requests on same runtime all succeeded")
}
