package jsruntime

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
)

//go:embed bootstrap-goja.js
var bootstrapGojaJS string

// StreamCallbacks carries the Go-side streaming callbacks registered as JS host functions.
// Pool creates these to write ResponseSignal values to the per-request channel.
type StreamCallbacks struct {
	SendHeaders func(status int, headersJSON string)
	SendChunk   func(chunk []byte)
	EndStream   func(checkpoints []trace.JSCheckpoint)
}

// SetupOptions configures a single JS runtime initialization.
type SetupOptions struct {
	Bundle []byte            // goja: ESM bundle source
	Env    map[string]string
	Stream StreamCallbacks
}

// SetupRuntime initializes a single JS runtime.
// Order: host functions → stream callbacks → polyfills → bundle → bootstrap.
func SetupRuntime(ctx JSContext, opts SetupOptions) error {
	keyReg := make(map[string]*cryptoKey)

	if err := injectHostFunctions(ctx, opts.Env, keyReg); err != nil {
		return fmt.Errorf("host functions: %w", err)
	}

	// __go_sendHeaders(status, headersJSON) — first streaming event.
	setGoFunc(ctx, "__go_sendHeaders", func(_ context.Context, args ...any) (any, error) {
		if len(args) < 2 {
			return nil, nil
		}
		status, _ := args[0].(int64)
		headersJSON, _ := args[1].(string)
		if opts.Stream.SendHeaders != nil {
			opts.Stream.SendHeaders(int(status), headersJSON)
		}
		return nil, nil
	})

	// __go_sendChunk(buf) — streams one body chunk.
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
		if len(chunk) > 0 && opts.Stream.SendChunk != nil {
			opts.Stream.SendChunk(chunk)
		}
		return nil, nil
	})

	// __go_endStream(traceJSON) — final streaming event.
	setGoFunc(ctx, "__go_endStream", func(_ context.Context, args ...any) (any, error) {
		var points []trace.JSCheckpoint
		if len(args) > 0 {
			if s, _ := args[0].(string); s != "" {
				points = parseJSTrace(s)
			}
		}
		if opts.Stream.EndStream != nil {
			opts.Stream.EndStream(points)
		}
		return nil, nil
	})

	for _, step := range polyfillSources() {
		if err := ctx.Eval(step.name, step.src, EvalScript); err != nil {
			return fmt.Errorf("polyfill %s: %w", step.name, err)
		}
	}
	if len(opts.Bundle) > 0 {
		if err := ctx.Eval("entry.js", string(opts.Bundle), EvalModule); err != nil {
			return fmt.Errorf("bundle eval: %w", err)
		}
	}
	if err := ctx.Eval("bootstrap.js", bootstrapGojaJS, EvalScript); err != nil {
		return fmt.Errorf("bootstrap eval: %w", err)
	}

	return nil
}

// setGoFunc wraps ctx.SetGoFunc to record JSCallDone timing on the RequestTrace.
func setGoFunc(ctx JSContext, name string, fn func(context.Context, ...any) (any, error)) {
	ctx.SetGoFunc(name, func(goCtx context.Context, args ...any) (any, error) {
		start := time.Now()
		result, err := fn(goCtx, args...)
		if rt := trace.ContextRequestTrace(goCtx); rt != nil && rt.JSCallDone != nil {
			rt.JSCallDone(name, start, time.Now(), err)
		}
		return result, err
	})
}

// setGoAsyncFunc wraps ctx.SetGoAsyncFunc to record JSCallDone timing.
func setGoAsyncFunc(ctx JSContext, name string, fn func(context.Context, ...any) (any, error)) {
	ctx.SetGoAsyncFunc(name, func(goCtx context.Context, args ...any) (any, error) {
		start := time.Now()
		result, err := fn(goCtx, args...)
		if rt := trace.ContextRequestTrace(goCtx); rt != nil && rt.JSCallDone != nil {
			rt.JSCallDone(name, start, time.Now(), err)
		}
		return result, err
	})
}

// injectHostFunctions registers Go-backed globals on the JS context.
func injectHostFunctions(ctx JSContext, env map[string]string, keyReg map[string]*cryptoKey) error {
	envJSON, _ := json.Marshal(env)
	setupEnv := fmt.Sprintf(`
globalThis.__processEnv = %s;
globalThis.process = { env: __processEnv, version: 'v20.0.0', versions: {}, platform: 'linux', stdout: { fd: 1, write: function(){} }, stderr: { fd: 2, write: function(){} } };
try {
  Object.defineProperty(globalThis.process, Symbol.toStringTag, { value: 'process' });
} catch(e) {}
`, string(envJSON))
	if err := ctx.Eval("process-env.js", setupEnv, EvalScript); err != nil {
		return fmt.Errorf("process.env: %w", err)
	}

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

// parseJSTrace decodes the JSON trace emitted by bootstrap.mjs into JSCheckpoint slices.
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
