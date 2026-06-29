package astroruntime

import (
	"net/http"
	"net/http/httptest"
	"testing"
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
