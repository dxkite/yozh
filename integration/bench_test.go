package integration_test

import (
	"testing"

	astroruntime "github.com/dxkite/astro-runtime"
)

// benchBundle is a realistic-shape bundle: evaluates polyfills, registers a handler.
var benchBundle = []byte(`
export default function(config) {
    return async function handler(request, context) {
        var url = new URL(request.url);
        return new Response("hello " + url.pathname, {
            status: 200,
            headers: {
                "content-type": "text/plain",
                "x-request-id": crypto.randomUUID(),
            },
        });
    };
}
`)

// BenchmarkNewPool measures time to compile bytecodes + create one pool worker.
// Each iteration creates a fresh pool with size=1.
func BenchmarkNewPool(b *testing.B) {
	b.ReportAllocs()
	for b.Loop() {
		p, err := astroruntime.NewPool(benchBundle, map[string]string{}, 1)
		if err != nil {
			b.Fatal(err)
		}
		p.Close()
	}
}

// BenchmarkNewPoolSize4 measures pool creation with 4 workers.
// Shows how bytecode reuse amortizes compilation across workers.
func BenchmarkNewPoolSize4(b *testing.B) {
	b.ReportAllocs()
	for b.Loop() {
		p, err := astroruntime.NewPool(benchBundle, map[string]string{}, 4)
		if err != nil {
			b.Fatal(err)
		}
		p.Close()
	}
}

// BenchmarkSSRRequestGetPut measures the Get+Put round-trip overhead (no actual JS work).
// Uses a pool size of 1 so Get/Put always reuses the same runtime without creating extras.
func BenchmarkSSRRequestGetPut(b *testing.B) {
	p, err := astroruntime.NewPool(benchBundle, map[string]string{}, 1)
	if err != nil {
		b.Fatal(err)
	}
	defer p.Close()

	b.ResetTimer()
	b.ReportAllocs()
	for b.Loop() {
		rt, err := p.Get()
		if err != nil {
			b.Fatal(err)
		}
		p.Put(rt)
	}
}
