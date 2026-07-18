//go:build qjs

package astroruntime

import (
	"net/http/httptest"
	"testing"
)

// benchBundleSrc is a small but realistic ESM bundle used for QJS setup benchmarks.
var benchBundleSrc = []byte(`
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

// setupRuntimeLegacy replicates the pre-compilation path: source code eval per worker.
// Used only for benchmark comparison; not part of the production code path.
func setupRuntimeLegacy(rt JSRuntime, bundleCode []byte, env map[string]string) error {
	ctx := rt.Ctx()
	keyReg := make(map[string]*cryptoKey)

	if err := injectHostFunctions(ctx, env, keyReg); err != nil {
		return err
	}

	for _, step := range polyfillSources() {
		if err := ctx.Eval(step.name, step.src, EvalScript); err != nil {
			return err
		}
	}

	if err := ctx.Eval("entry.mjs", string(bundleCode), EvalModule); err != nil {
		return err
	}
	if err := ctx.Eval("bootstrap.mjs", bootstrapMJS, EvalModule); err != nil {
		return err
	}
	return nil
}

// newPoolLegacy creates a pool using source code eval (old approach), for benchmark comparison.
func newPoolLegacy(bundleCode []byte, env map[string]string, size int) (*Pool, error) {
	p := &Pool{
		pool:    make(chan *pooledRuntime, size),
		workers: make(chan func(), size*2),
	}
	for i := 0; i < size; i++ {
		go func() {
			for fn := range p.workers {
				fn()
			}
		}()
	}
	eng := &qjsEngine{}
	rt, err := eng.New()
	if err != nil {
		return nil, err
	}
	if err := setupRuntimeLegacy(rt, bundleCode, env); err != nil {
		rt.Close()
		return nil, err
	}
	p.pool <- &pooledRuntime{rt: rt}
	return p, nil
}

func BenchmarkNewPoolLegacySize1(b *testing.B) {
	b.ReportAllocs()
	for b.Loop() {
		p, err := newPoolLegacy(benchBundleSrc, map[string]string{}, 1)
		if err != nil {
			b.Fatal(err)
		}
		p.Close()
	}
}

func BenchmarkNewPoolBytecodeSize1(b *testing.B) {
	b.ReportAllocs()
	for b.Loop() {
		p, err := NewPool(benchBundleSrc, WithEngineKind(EngineQJS), WithSize(1))
		if err != nil {
			b.Fatal(err)
		}
		p.Close()
	}
}

func BenchmarkNewPoolLegacySize4(b *testing.B) {
	b.ReportAllocs()
	for b.Loop() {
		p, err := newPoolLegacy(benchBundleSrc, map[string]string{}, 4)
		if err != nil {
			b.Fatal(err)
		}
		p.Close()
	}
}

func BenchmarkNewPoolBytecodeSize4(b *testing.B) {
	b.ReportAllocs()
	for b.Loop() {
		p, err := NewPool(benchBundleSrc, WithEngineKind(EngineQJS), WithSize(4))
		if err != nil {
			b.Fatal(err)
		}
		p.Close()
	}
}

func BenchmarkSSRRequest_QJS(b *testing.B) {
	p, err := NewPool(benchBundleSrc, WithEngineKind(EngineQJS), WithSize(1))
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
