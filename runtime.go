package astroruntime

import (
	"context"
	"crypto/rand"
	_ "embed"
	"encoding/json"
	"fmt"
	"os"

	"github.com/dxkite/qjs"
)

//go:embed glue.js
var glueJS string

// setupRuntime initializes a single QJS runtime.
// Order is critical: host functions → polyfills → ESM bundle → handler setup → glue.
func setupRuntime(rt *qjs.Runtime, bundleCode []byte, env map[string]string) error {
	ctx := rt.Context()
	keyReg := make(map[string]*cryptoKey)

	// 1. Register Go host functions before any JS runs.
	if err := injectHostFunctions(ctx, env, keyReg); err != nil {
		return fmt.Errorf("host functions: %w", err)
	}

	// 2. Evaluate polyfills in order.
	// crypto MUST come before the bundle: the bundle contains astro/app/node's
	// applyPolyfills(), which checks `if (!globalThis.crypto)`. By pre-setting it,
	// the check is skipped and our mock crypto is not overwritten with a broken shim.
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
			return fmt.Errorf("polyfill %s: %w", step.name, err)
		}
		v.Free()
	}

	// 3. Evaluate the ESM bundle in module mode (TypeModule).
	// TypeModule enables native top-level await (ES2023) and returns the default export.
	// All Node builtins and external packages are inlined as stubs by the esbuild
	// nodeShimPlugin, so the bundle has no external imports and is fully self-contained.
	factory, err := ctx.Eval("ssr.mjs", qjs.Code(string(bundleCode)), qjs.TypeModule())
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

	// 5. Evaluate glue adapter — defines globalThis.__handleRequest
	v, err = ctx.Eval("glue.js", qjs.Code(glueJS))
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
globalThis.process = { env: __processEnv, version: 'v20.0.0', versions: {}, platform: 'linux' };
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
