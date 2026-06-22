package astroruntime

import (
	"testing"

	"github.com/dxkite/qjs"
)

// benchBundleSrc is a small but realistic bundle used for setup benchmarks.
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
func setupRuntimeLegacy(rt *qjs.Runtime, bundleCode []byte, env map[string]string) error {
	ctx := rt.Context()
	keyReg := make(map[string]*cryptoKey)

	if err := injectHostFunctions(ctx, env, keyReg); err != nil {
		return err
	}

	for _, step := range []struct{ name, code string }{
		{"web-api-polyfill.js", webAPIPolyfill},
		{"crypto-polyfill.js", cryptoPolyfill},
		{"file-polyfill.js", filePolyfill},
		{"env-api-stub.js", envAPIStub},
		{"intl-stub.js", intlStub},
		{"structured-clone.js", structuredCloneGuard},
		{"console.js", consoleDef},
		{"fetch.js", fetchDef},
	} {
		v, err := ctx.Eval(step.name, qjs.Code(step.code))
		if err != nil {
			return err
		}
		v.Free()
	}

	factory, err := ctx.Eval("ssr.mjs", qjs.Code(string(bundleCode)), qjs.TypeModule())
	if err != nil {
		return err
	}
	ctx.Global().SetPropertyStr("__ssrHandlerFactory", factory)
	factory.Free()

	v, err := ctx.Eval("setup-handler.js", qjs.Code(`(function() {
  var raw = globalThis.__ssrHandlerFactory;
  if (typeof raw === 'function' && raw.length < 2) {
    var candidate = raw({});
    globalThis.__ssrHandler = (typeof candidate === 'function') ? candidate : raw;
  } else {
    globalThis.__ssrHandler = raw;
  }
  delete globalThis.__ssrHandlerFactory;
})()`))
	if err != nil {
		return err
	}
	v.Free()

	v, err = ctx.Eval("glue.js", qjs.Code(glueJS))
	if err != nil {
		return err
	}
	v.Free()
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
	rt, err := qjs.New(qjs.Option{})
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

// ── NewPool end-to-end: size=1 ────────────────────────────────────────────────

// BenchmarkNewPoolLegacySize1 measures total NewPool(size=1) time with source eval.
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

// BenchmarkNewPoolBytecodeSize1 measures total NewPool(size=1) time with bytecode (new).
// Includes one-time compilation cost.
func BenchmarkNewPoolBytecodeSize1(b *testing.B) {
	b.ReportAllocs()
	for b.Loop() {
		p, err := NewPool(benchBundleSrc, WithSize(1))
		if err != nil {
			b.Fatal(err)
		}
		p.Close()
	}
}

// ── NewPool end-to-end: size=4 ────────────────────────────────────────────────

// BenchmarkNewPoolLegacySize4 measures total NewPool(size=4) time with source eval.
// Legacy cost scales linearly with pool size.
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

// BenchmarkNewPoolBytecodeSize4 measures total NewPool(size=4) time with bytecode (new).
// Compilation cost is paid once; worker setup reuses the same bytecodes.
func BenchmarkNewPoolBytecodeSize4(b *testing.B) {
	b.ReportAllocs()
	for b.Loop() {
		p, err := NewPool(benchBundleSrc, WithSize(4))
		if err != nil {
			b.Fatal(err)
		}
		p.Close()
	}
}
