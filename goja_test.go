package yozh

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
	"time"
)

// minimalGojaBundle is a minimal ESM-format SSR bundle for goja engine testing.
// Simulates what BundleSSRGoja produces: sets globalThis.__ssrEntry as a side effect
// and exports {} so sobek's ParseModule accepts it as a valid ES module.
const minimalGojaBundle = `
var handler = async function(request, context) {
  return new Response("hello world", {
    status: 200,
    headers: { "content-type": "text/plain" },
  });
};
globalThis.__ssrEntry = {
  default: function() { return handler; },
};
export {};
`

func TestGojaPoolInit(t *testing.T) {
	pool, err := NewPool(
		[]byte(minimalGojaBundle),
		WithEngineKind(EngineGoja),
		WithSize(1),
	)
	if err != nil {
		t.Fatalf("NewPool (goja): %v", err)
	}
	defer pool.Close()
	t.Log("goja pool initialized OK")
}

func TestGojaRequest(t *testing.T) {
	pool, err := NewPool(
		[]byte(minimalGojaBundle),
		WithEngineKind(EngineGoja),
		WithSize(1),
	)
	if err != nil {
		t.Fatalf("NewPool (goja): %v", err)
	}
	defer pool.Close()

	req := httptest.NewRequest("GET", "http://localhost/hello", nil)
	w := httptest.NewRecorder()

	rc, err := pool.RequestContext(w, req)
	if err != nil {
		t.Fatalf("RequestContext: %v", err)
	}
	HandleRequest(rc)

	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Errorf("status = %d, want 200", resp.StatusCode)
	}
	body := w.Body.String()
	if body != "hello world" {
		t.Errorf("body = %q, want %q", body, "hello world")
	}
	t.Logf("goja response: %d %q", resp.StatusCode, body)
}

// concurrentFetchGojaBundle issues three fetches via Promise.all and returns their bodies
// joined; used to verify SetGoAsyncFunc dispatches real concurrent work under goja.
const concurrentFetchGojaBundle = `
var handler = async function(request, context) {
  var url = new URL(request.url);
  var urls = JSON.parse(url.searchParams.get('urls'));
  var results = await Promise.all(urls.map(function(u) {
    return fetch(u).then(function(r) { return r.text(); });
  }));
  return new Response(results.join(','), { status: 200 });
};
globalThis.__ssrEntry = {
  default: function() { return handler; },
};
export {};
`

// TestGojaConcurrentFetch verifies that Promise.all([fetch, fetch, fetch]) issued from a
// goja-hosted handler runs the underlying __go_fetchRaw calls concurrently rather than
// sequentially: total elapsed time should be ~1x a single upstream delay, not ~3x.
func TestGojaConcurrentFetch(t *testing.T) {
	const delay = 80 * time.Millisecond

	slow := func(body string) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			time.Sleep(delay)
			fmt.Fprint(w, body)
		}
	}
	svc1 := httptest.NewServer(slow("a"))
	defer svc1.Close()
	svc2 := httptest.NewServer(slow("b"))
	defer svc2.Close()
	svc3 := httptest.NewServer(slow("c"))
	defer svc3.Close()

	pool, err := NewPool([]byte(concurrentFetchGojaBundle), WithEngineKind(EngineGoja), WithSize(1))
	if err != nil {
		t.Fatalf("NewPool (goja): %v", err)
	}
	defer pool.Close()

	urlsJSON := fmt.Sprintf(`["%s","%s","%s"]`, svc1.URL, svc2.URL, svc3.URL)
	req := httptest.NewRequest("GET", "http://localhost/?urls="+url.QueryEscape(urlsJSON), nil)
	w := httptest.NewRecorder()

	rc, err := pool.RequestContext(w, req)
	if err != nil {
		t.Fatalf("RequestContext: %v", err)
	}
	start := time.Now()
	HandleRequest(rc)
	elapsed := time.Since(start)

	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200; body: %s", resp.StatusCode, w.Body.String())
	}
	body := w.Body.String()
	if body != "a,b,c" {
		t.Errorf("body = %q, want %q", body, "a,b,c")
	}

	t.Logf("3x %v concurrent fetch elapsed: %v", delay, elapsed)
	if elapsed >= 2*delay {
		t.Errorf("fetches appear sequential: elapsed %v >= 2x%v; expected concurrent (~1x)", elapsed, delay)
	}
}
