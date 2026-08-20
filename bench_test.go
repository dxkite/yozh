package yozh

import (
	"net/http/httptest"
	"testing"
)

// benchGojaBundle is an ESM-format bundle for the goja engine.
// Sets globalThis.__ssrEntry as a side effect; export {} makes it a valid ES module
// for sobek's ParseModule.
var benchGojaBundle = []byte(`
var handler = function(config) {
    return async function(request, context) {
        var url = new URL(request.url);
        return new Response("hello " + url.pathname, {
            status: 200,
            headers: {
                "content-type": "text/plain",
                "x-request-id": crypto.randomUUID(),
            },
        });
    };
};
globalThis.__ssrEntry = { default: handler };
export {};
`)

// BenchmarkNewPoolGojaSize1 measures goja pool creation with size=1.
// Goja evals source directly; no bytecode compilation step.
func BenchmarkNewPoolGojaSize1(b *testing.B) {
	b.ReportAllocs()
	for b.Loop() {
		p, err := NewPool(benchGojaBundle, WithEngineKind(EngineGoja), WithSize(1))
		if err != nil {
			b.Fatal(err)
		}
		p.Close()
	}
}

// BenchmarkNewPoolGojaSize4 measures goja pool creation with size=4.
func BenchmarkNewPoolGojaSize4(b *testing.B) {
	b.ReportAllocs()
	for b.Loop() {
		p, err := NewPool(benchGojaBundle, WithEngineKind(EngineGoja), WithSize(4))
		if err != nil {
			b.Fatal(err)
		}
		p.Close()
	}
}

// BenchmarkSSRRequest_Goja measures sequential SSR request throughput with goja.
func BenchmarkSSRRequest_Goja(b *testing.B) {
	p, err := NewPool(benchGojaBundle, WithEngineKind(EngineGoja), WithSize(1))
	if err != nil {
		b.Fatal(err)
	}
	defer p.Close()

	b.ResetTimer()
	b.ReportAllocs()
	for b.Loop() {
		req := httptest.NewRequest("GET", "http://localhost/bench", nil)
		w := httptest.NewRecorder()
		rc, err := p.RequestContext(w, req)
		if err != nil {
			b.Fatal(err)
		}
		HandleRequest(rc)
		if w.Code != 200 {
			b.Fatalf("unexpected status %d: %s", w.Code, w.Body.String())
		}
	}
}
