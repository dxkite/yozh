package astroruntime

import (
	"context"
	"crypto/rand"
	_ "embed"
	"encoding/json"
	"fmt"
	"os"
	"sync"

	"github.com/dxkite/qjs"
)

// responseMeta holds the status code and serialized headers from a JS response,
// stored by __go_storeResponseMeta and consumed by loadAndDeleteResponseMeta.
type responseMeta struct {
	Status      int
	HeadersJSON string
}

// runtimeMetas maps each *qjs.Runtime to its pending responseMeta.
// Each runtime is exclusive per-request (Pool guarantees this), so there is
// never a concurrent write to the same key.
var runtimeMetas sync.Map // key: *qjs.Runtime, value: responseMeta

// loadAndDeleteResponseMeta retrieves and removes the responseMeta stored for rt.
// Returns a zero-value responseMeta if none was stored (e.g. on error paths).
func loadAndDeleteResponseMeta(rt *qjs.Runtime) responseMeta {
	v, _ := runtimeMetas.LoadAndDelete(rt)
	m, _ := v.(responseMeta)
	return m
}

//go:embed glue.js
var glueJS string

// setupRuntime initializes a single QJS runtime using pre-compiled bytecodes.
// Order is critical: host functions → polyfills → ESM bundle → handler setup → glue.
func setupRuntime(rt *qjs.Runtime, bcs *bytecodeSet, env map[string]string) error {
	ctx := rt.Context()
	keyReg := make(map[string]*cryptoKey)

	// 1. Register Go host functions before any JS runs.
	if err := injectHostFunctions(ctx, env, keyReg); err != nil {
		return fmt.Errorf("host functions: %w", err)
	}

	// __go_storeResponseMeta(statusCode, headersJSON) — stores the response status and
	// headers JSON in runtimeMetas so that HandleSSR can retrieve them after Eval returns.
	// The response body is returned directly as the __handleRequest return value,
	// avoiding JSON.stringify({status, headers, body: "220KB"}) in glue.js (~0.5s saved).
	ctx.SetGoFunc("__go_storeResponseMeta", func(_ context.Context, args ...any) (any, error) {
		if len(args) < 2 {
			return nil, nil
		}
		status, _ := args[0].(int64)
		headersJSON, _ := args[1].(string)
		runtimeMetas.Store(rt, responseMeta{Status: int(status), HeadersJSON: headersJSON})
		return nil, nil
	})

	// 2. Evaluate polyfill bytecodes in order.
	// crypto MUST come before the bundle: the bundle contains astro/app/node's
	// applyPolyfills(), which checks `if (!globalThis.crypto)`. By pre-setting it,
	// the check is skipped and our mock crypto is not overwritten with a broken shim.
	for _, step := range bcs.polyfills {
		v, err := ctx.Eval(step.name, qjs.Bytecode(step.bc))
		if err != nil {
			return fmt.Errorf("polyfill %s: %w", step.name, err)
		}
		v.Free()
	}

	// 3. Evaluate the pre-compiled ESM bundle bytecode in module mode.
	// The bundle has no external imports (all Node builtins inlined by esbuild).
	factory, err := ctx.Eval("ssr.mjs", qjs.Bytecode(bcs.bundle), qjs.TypeModule())
	if err != nil {
		return fmt.Errorf("bundle eval: %w", err)
	}

	// 4. Extract the SSR handler from the module's default export.
	// The default export is the handler (length>=2) or a factory (length<2) that returns
	// the handler when called with an empty config object.
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
		return fmt.Errorf("handler setup: %w", err)
	}
	v.Free()

	// 5. Evaluate glue adapter bytecode — defines globalThis.__handleRequest
	v, err = ctx.Eval("glue.js", qjs.Bytecode(bcs.glue))
	if err != nil {
		return fmt.Errorf("glue eval: %w", err)
	}
	v.Free()

	return nil
}

// injectHostFunctions registers Go-backed globals on the QJS context.
func injectHostFunctions(ctx *qjs.Context, env map[string]string, keyReg map[string]*cryptoKey) error {
	// process.env — injected as both __processEnv and process.env
	envJSON, _ := json.Marshal(env)
	setupEnv := fmt.Sprintf(`
globalThis.__processEnv = %s;
globalThis.process = { env: __processEnv, version: 'v20.0.0', versions: {}, platform: 'linux', stdout: { fd: 1, write: function(){} }, stderr: { fd: 2, write: function(){} } };
// Make Object.prototype.toString.call(process) === '[object process]'
// so that Astro's isNode check returns true and it uses renderToAsyncIterable
// (async generator) instead of renderToReadableStream (ReadableStream-based).
// renderToAsyncIterable is much simpler to consume and doesn't need setTimeout.
try {
  Object.defineProperty(globalThis.process, Symbol.toStringTag, { value: 'process' });
} catch(e) {}
`, string(envJSON))
	v, err := ctx.Eval("process-env.js", qjs.Code(setupEnv))
	if err != nil {
		return fmt.Errorf("process.env: %w", err)
	}
	v.Free()

	// __go_cryptoRandomBytes(n) — returns ArrayBuffer of n cryptographically-random bytes
	ctx.SetGoFunc("__go_cryptoRandomBytes", func(_ context.Context, args ...any) (any, error) {
		if len(args) == 0 {
			return nil, fmt.Errorf("__go_cryptoRandomBytes requires 1 argument")
		}
		n, _ := args[0].(int64)
		if n <= 0 || n > 65536 {
			return nil, fmt.Errorf("__go_cryptoRandomBytes: invalid size %d", n)
		}
		buf := make([]byte, n)
		if _, err := rand.Read(buf); err != nil {
			return nil, fmt.Errorf("rand.Read: %w", err)
		}
		return buf, nil
	})

	// __go_consoleWrite(level, message) — forwards to Go stderr
	ctx.SetGoFunc("__go_consoleWrite", func(_ context.Context, args ...any) (any, error) {
		level, msg := "log", ""
		if len(args) > 0 {
			level, _ = args[0].(string)
		}
		if len(args) > 1 {
			msg, _ = args[1].(string)
		}
		fmt.Fprintf(os.Stderr, "[JS %s] %s\n", level, msg)
		return "", nil
	})

	injectBinaryOps(ctx)
	injectURLParser(ctx)
	injectCryptoSubtle(ctx, keyReg)

	// __go_fetchRaw(url, method, headersJSON, body) — async Go HTTP client.
	// Each call spawns a goroutine that performs the HTTP request and resolves
	// the returned JS Promise via the QJS pendingCallbacks channel.
	// Promise.allSettled([fetch(a), fetch(b), fetch(c)]) launches all goroutines
	// concurrently; the QJS event loop drains the channel as each one completes.
	ctx.SetGoAsyncFunc("__go_fetchRaw", func(_ context.Context, args ...any) (any, error) {
		urlStr, method, headersJSON, reqBody := "", "GET", "{}", ""
		if len(args) > 0 {
			urlStr, _ = args[0].(string)
		}
		if len(args) > 1 {
			method, _ = args[1].(string)
		}
		if len(args) > 2 {
			headersJSON, _ = args[2].(string)
		}
		if len(args) > 3 {
			if s, _ := args[3].(string); s != "null" && s != "undefined" {
				reqBody = s
			}
		}
		return goFetch(urlStr, method, headersJSON, reqBody)
	})

	return nil
}
