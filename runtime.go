package astroruntime

import (
	"context"
	"crypto/rand"
	_ "embed"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/url"
	"time"

	"github.com/dxkite/astro-runtime/trace"
	"github.com/dxkite/qjs"
)

// signalKind tags each ResponseSignal to distinguish header, chunk, done, and error events.
type signalKind uint8

const (
	sigHeader signalKind = iota // JS sent response headers; handler writes status + headers
	sigChunk                    // JS produced a body chunk; handler writes and flushes it
	sigDone                     // body fully consumed; handler records trace and returns
	sigError                    // eval error; handler sends 5xx
)

// responseMeta holds the status code and serialized headers from a JS response.
type responseMeta struct {
	Status      int
	HeadersJSON string
}

// ResponseSignal carries streaming events from the JS goroutine to HandleSSR.
// One sigHeader is sent first, then zero or more sigChunk signals, then sigDone.
// sigError may be sent at any point if the JS eval fails.
type ResponseSignal struct {
	Kind          signalKind
	Meta          responseMeta         // sigHeader
	Chunk         []byte               // sigChunk
	Err           error                // sigError
	JSCheckpoints []trace.JSCheckpoint // sigDone
	BodyTime      time.Time            // sigHeader: time.Now() when headers are ready
}

//go:embed bootstrap.mjs
var bootstrapMJS string

// setupRuntime initializes a single QJS runtime using pre-compiled bytecodes.
// Order is critical: host functions → polyfills → entry bundle → bootstrap.
func setupRuntime(prt *pooledRuntime, bcs *bytecodeSet, env map[string]string) error {
	rt := prt.rt
	ctx := rt.Context()
	keyReg := make(map[string]*cryptoKey)

	// 1. Register Go host functions before any JS runs.
	if err := injectHostFunctions(ctx, env, keyReg); err != nil {
		return fmt.Errorf("host functions: %w", err)
	}

	// __go_sendHeaders(status, headersJSON) — first streaming event; signals HandleSSR to write
	// HTTP status and headers immediately, before body chunks are available.
	setGoFunc(ctx, "__go_sendHeaders", func(_ context.Context, args ...any) (any, error) {
		if len(args) < 2 {
			return nil, nil
		}
		status, _ := args[0].(int64)
		headersJSON, _ := args[1].(string)
		if ch := prt.streamCh; ch != nil {
			ch <- ResponseSignal{
				Kind:     sigHeader,
				Meta:     responseMeta{Status: int(status), HeadersJSON: headersJSON},
				BodyTime: time.Now(),
			}
		}
		return nil, nil
	})

	// __go_sendChunk(buf ArrayBuffer) — streams one body chunk to HandleSSR.
	// Blocks until HandleSSR reads the chunk, providing natural back-pressure.
	setGoFunc(ctx, "__go_sendChunk", func(_ context.Context, args ...any) (any, error) {
		if len(args) < 1 {
			return nil, nil
		}
		var chunk []byte
		switch v := args[0].(type) {
		case []byte:
			chunk = v
		case string:
			chunk = []byte(v)
		}
		if len(chunk) > 0 {
			if ch := prt.streamCh; ch != nil {
				ch <- ResponseSignal{Kind: sigChunk, Chunk: chunk}
			}
		}
		return nil, nil
	})

	// __go_endStream(traceJSON) — final streaming event; HandleSSR records trace and returns.
	setGoFunc(ctx, "__go_endStream", func(_ context.Context, args ...any) (any, error) {
		var points []trace.JSCheckpoint
		if len(args) > 0 {
			if s, _ := args[0].(string); s != "" {
				points = parseJSTrace(s)
			}
		}
		if ch := prt.streamCh; ch != nil {
			ch <- ResponseSignal{Kind: sigDone, JSCheckpoints: points}
		}
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
	v, err := ctx.Eval("entry.mjs", qjs.Bytecode(bcs.bundle), qjs.TypeModule())
	if err != nil {
		return fmt.Errorf("bundle eval: %w", err)
	}
	v.Free()

	// 4. bootstrap: detects adapter export format, initializes __ssrHandler,
	// and defines globalThis.__handleRequest.
	// Evaluated here (not pre-compiled) because it imports from entry.mjs, which
	// is only in the module cache after step 3.
	v, err = ctx.Eval("bootstrap.mjs", qjs.Code(bootstrapMJS), qjs.TypeModule())
	if err != nil {
		return fmt.Errorf("bootstrap eval: %w", err)
	}
	v.Free()

	return nil
}

// parseJSTrace decodes the JSON trace emitted by bootstrap.mjs into JSCheckpoint slices.
// Format: [{name: string, s: epochMs, e: epochMs}, ...]
func parseJSTrace(jsonStr string) []trace.JSCheckpoint {
	var raw []struct {
		Name string `json:"name"`
		S    int64  `json:"s"`
		E    int64  `json:"e"`
	}
	if err := json.Unmarshal([]byte(jsonStr), &raw); err != nil {
		return nil
	}
	out := make([]trace.JSCheckpoint, 0, len(raw))
	for _, r := range raw {
		out = append(out, trace.JSCheckpoint{
			Name:  r.Name,
			Start: time.UnixMilli(r.S),
			End:   time.UnixMilli(r.E),
		})
	}
	return out
}

// setGoFunc wraps ctx.SetGoFunc to automatically record JSCallDone timing on the RequestTrace.
func setGoFunc(ctx *qjs.Context, name string, fn func(context.Context, ...any) (any, error)) {
	ctx.SetGoFunc(name, func(goCtx context.Context, args ...any) (any, error) {
		start := time.Now()
		result, err := fn(goCtx, args...)
		if rt := trace.ContextRequestTrace(goCtx); rt != nil && rt.JSCallDone != nil {
			rt.JSCallDone(name, start, time.Now(), err)
		}
		return result, err
	})
}

// setGoAsyncFunc wraps ctx.SetGoAsyncFunc to automatically record JSCallDone timing.
func setGoAsyncFunc(ctx *qjs.Context, name string, fn func(context.Context, ...any) (any, error)) {
	ctx.SetGoAsyncFunc(name, func(goCtx context.Context, args ...any) (any, error) {
		start := time.Now()
		result, err := fn(goCtx, args...)
		if rt := trace.ContextRequestTrace(goCtx); rt != nil && rt.JSCallDone != nil {
			rt.JSCallDone(name, start, time.Now(), err)
		}
		return result, err
	})
}

// injectHostFunctions registers Go-backed globals on the QJS context.
// Host functions receive ctx (*qjs.Context, which embeds context.Context) as their first argument.
// The embedded context.Context is replaced with the per-request Go context before each Eval,
// so ctx.Value / ctx.Done carry per-request log attrs and cancellation signals automatically.
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
	setGoFunc(ctx, "__go_cryptoRandomBytes", func(goCtx context.Context, args ...any) (any, error) {
		if len(args) == 0 {
			return nil, fmt.Errorf("__go_cryptoRandomBytes requires 1 argument")
		}
		n, _ := args[0].(int64)
		if n <= 0 || n > 65536 {
			return nil, fmt.Errorf("__go_cryptoRandomBytes: invalid size %d", n)
		}
		start := time.Now()
		buf := make([]byte, n)
		if _, err := rand.Read(buf); err != nil {
			return nil, fmt.Errorf("rand.Read: %w", err)
		}
		rtlog.DebugContext(goCtx, "__go_cryptoRandomBytes", "n", n, "latency", time.Since(start).Seconds())
		return buf, nil
	})

	// __go_consoleWrite(level, message) — forwards JS console.* to slog
	setGoFunc(ctx, "__go_consoleWrite", func(goCtx context.Context, args ...any) (any, error) {
		jsLevel, msg := "log", ""
		if len(args) > 0 {
			jsLevel, _ = args[0].(string)
		}
		if len(args) > 1 {
			msg, _ = args[1].(string)
		}
		var lvl slog.Level
		switch jsLevel {
		case "error", "assert":
			lvl = slog.LevelError
		case "warn":
			lvl = slog.LevelWarn
		case "debug", "trace":
			lvl = slog.LevelDebug
		default:
			lvl = slog.LevelInfo
		}
		rtlog.Log(goCtx, lvl, msg, "source", "js")
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
	setGoAsyncFunc(ctx, "__go_fetchRaw", func(goCtx context.Context, args ...any) (any, error) {
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
		// Log only the path portion to avoid exposing upstream base URL in every log line.
		logPath := urlStr
		if u, err := url.Parse(urlStr); err == nil {
			logPath = u.Path
		}
		fetchStart := time.Now()
		result, status, err := goFetch(urlStr, method, headersJSON, reqBody)
		fetchEnd := time.Now()
		latency := fetchEnd.Sub(fetchStart)
		if err != nil {
			rtlog.DebugContext(goCtx, "__go_fetchRaw", "fetch_method", method, "fetch_path", logPath, "err", err, "latency", latency.Seconds())
		} else {
			rtlog.DebugContext(goCtx, "__go_fetchRaw", "fetch_method", method, "fetch_path", logPath, "latency", latency.Seconds())
		}
		if rt := trace.ContextRequestTrace(goCtx); rt != nil && rt.FetchDone != nil {
			rt.FetchDone(method, logPath, status, fetchStart, fetchEnd, err)
		}
		return result, err
	})

	return nil
}
