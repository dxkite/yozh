package astroruntime

import (
	"context"
	"crypto/rand"
	_ "embed"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/dxkite/qjs"
)

// fetchClient is a shared HTTP client with a 30-second timeout to prevent
// fetch() calls from hanging indefinitely and leaking goroutines.
var fetchClient = &http.Client{Timeout: 30 * time.Second}

//go:embed glue.js
var glueJS string

//go:embed js/bundle-wrapper.js
var bundleWrapperJS string

// Pool wraps a QJS runtime pool pre-warmed with polyfills and the SSR bundle.
type Pool struct {
	inner *qjs.Pool
}

// NewPool creates `size` QJS runtimes, each initialized with:
//  1. Go host functions (__go_cryptoRandomBytes, __go_consoleWrite, __go_fetchRaw)
//  2. Web API polyfills (Headers, Request, Response, crypto, File, console, fetch)
//  3. The CJS SSR bundle wrapped in a factory (sets globalThis.__ssrHandler)
//  4. The JS glue adapter (defines globalThis.__handleRequest)
func NewPool(bundleCode []byte, env map[string]string, size int) (*Pool, error) {
	if size <= 0 || size > 1000 {
		return nil, fmt.Errorf("pool size must be between 1 and 1000, got %d", size)
	}
	inner := qjs.NewPool(size, qjs.Option{}, func(rt *qjs.Runtime) error {
		return setupRuntime(rt, bundleCode, env)
	})

	// Eagerly warm one slot to surface initialization errors at startup
	rt, err := inner.Get()
	if err != nil {
		return nil, fmt.Errorf("pool warm-up: %w", err)
	}
	inner.Put(rt)

	return &Pool{inner: inner}, nil
}

// Get checks out a runtime. Caller MUST call Put() when done.
func (p *Pool) Get() (*qjs.Runtime, error) { return p.inner.Get() }

// Put returns a runtime to the pool.
func (p *Pool) Put(rt *qjs.Runtime) { p.inner.Put(rt) }

// Close is a no-op: qjs.Pool has no Close method; pooled runtimes are GC'd on program exit.
func (p *Pool) Close() {}

// setupRuntime initializes a single QJS runtime.
// Order is critical: host functions → polyfills → bundle → glue.
func setupRuntime(rt *qjs.Runtime, bundleCode []byte, env map[string]string) error {
	ctx := rt.Context()
	keyReg := make(map[string]*cryptoKey)

	// 1. Register Go host functions before any JS runs
	if err := injectHostFunctions(ctx, env, keyReg); err != nil {
		return fmt.Errorf("host functions: %w", err)
	}

	// 2. Evaluate polyfills in order
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

	// 3. Evaluate the CJS bundle wrapped in a factory.
	// bundleWrapperJS (js/bundle-wrapper.js) contains the require shim and handler
	// detection logic; __BUNDLE_CODE__ is replaced with the actual bundle bytes.
	wrapped := strings.Replace(bundleWrapperJS, "__BUNDLE_CODE__", string(bundleCode), 1)

	v, err := ctx.Eval("ssr-bundle.js", qjs.Code(wrapped))
	if err != nil {
		return fmt.Errorf("bundle eval: %w", err)
	}
	v.Free()

	// 4. Evaluate glue adapter — defines globalThis.__handleRequest
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

// injectBinaryOps registers host functions for binary data transfer between Go and QJS.
// Enables efficient UTF-8 encoding/decoding and base64 conversion via Go stdlib.
func injectBinaryOps(ctx *qjs.Context) {
	// __go_textEncodeUTF8(str) → ArrayBuffer — Go string is already UTF-8
	ctx.SetGoFunc("__go_textEncodeUTF8", func(_ context.Context, args ...any) (any, error) {
		if len(args) == 0 {
			return []byte{}, nil
		}
		s, _ := args[0].(string)
		return []byte(s), nil
	})

	// __go_textDecodeUTF8(b64) → string — decodes base64 bytes as UTF-8 string
	ctx.SetGoFunc("__go_textDecodeUTF8", func(_ context.Context, args ...any) (any, error) {
		if len(args) == 0 {
			return "", nil
		}
		s, _ := args[0].(string)
		b, err := base64.StdEncoding.DecodeString(s)
		if err != nil {
			return "", nil
		}
		return string(b), nil
	})

	// __go_bufToB64(jsonNumArray) → base64 string — JS passes byte array as JSON [1,2,3,...]
	ctx.SetGoFunc("__go_bufToB64", func(_ context.Context, args ...any) (any, error) {
		if len(args) == 0 {
			return "", nil
		}
		s, _ := args[0].(string)
		var nums []int
		if err := json.Unmarshal([]byte(s), &nums); err != nil {
			return "", nil
		}
		buf := make([]byte, len(nums))
		for i, n := range nums {
			buf[i] = byte(n)
		}
		return base64.StdEncoding.EncodeToString(buf), nil
	})

	// __go_b64ToBuf(b64) → ArrayBuffer — decodes base64 to binary ArrayBuffer
	ctx.SetGoFunc("__go_b64ToBuf", func(_ context.Context, args ...any) (any, error) {
		if len(args) == 0 {
			return []byte{}, nil
		}
		s, _ := args[0].(string)
		b, err := base64.StdEncoding.DecodeString(s)
		if err != nil {
			return []byte{}, nil
		}
		return b, nil
	})
}

// injectURLParser registers __go_urlParse for WHATWG-compliant URL parsing via net/url.
func injectURLParser(ctx *qjs.Context) {
	ctx.SetGoFunc("__go_urlParse", func(_ context.Context, args ...any) (any, error) {
		errResult := func(msg string) (any, error) {
			r, _ := json.Marshal(map[string]string{"error": msg})
			return string(r), nil
		}

		if len(args) == 0 {
			return errResult("missing input")
		}
		input, _ := args[0].(string)
		baseStr := ""
		if len(args) > 1 {
			baseStr, _ = args[1].(string)
		}

		var u *url.URL
		var parseErr error
		if baseStr != "" {
			base, berr := url.Parse(baseStr)
			if berr != nil {
				return errResult(berr.Error())
			}
			ref, rerr := url.Parse(input)
			if rerr != nil {
				return errResult(rerr.Error())
			}
			u = base.ResolveReference(ref)
		} else {
			u, parseErr = url.Parse(input)
			if parseErr != nil {
				return errResult(parseErr.Error())
			}
		}

		searchStr := ""
		if u.RawQuery != "" {
			searchStr = "?" + u.RawQuery
		}
		hashStr := ""
		if u.Fragment != "" {
			hashStr = "#" + u.Fragment
		}
		originStr := ""
		if u.Scheme != "" && u.Host != "" {
			originStr = u.Scheme + "://" + u.Host
		}
		username := ""
		password := ""
		if u.User != nil {
			username = u.User.Username()
			password, _ = u.User.Password()
		}

		result, _ := json.Marshal(map[string]string{
			"protocol": u.Scheme + ":",
			"host":     u.Host,
			"hostname": u.Hostname(),
			"port":     u.Port(),
			"pathname": u.Path,
			"search":   searchStr,
			"hash":     hashStr,
			"origin":   originStr,
			"href":     u.String(),
			"username": username,
			"password": password,
		})
		return string(result), nil
	})
}

// goFetch performs a real HTTP request from Go and returns the response as JSON.
func goFetch(urlStr, method, headersJSON, body string) (string, error) {
	var bodyReader io.Reader
	if body != "" {
		bodyReader = strings.NewReader(body)
	}

	req, err := http.NewRequest(method, urlStr, bodyReader)
	if err != nil {
		return "", fmt.Errorf("fetch: create request: %w", err)
	}

	var headers map[string]string
	if err := json.Unmarshal([]byte(headersJSON), &headers); err == nil {
		for k, v := range headers {
			req.Header.Set(k, v)
		}
	}

	resp, err := fetchClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("fetch: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(io.LimitReader(resp.Body, 10<<20))
	if err != nil {
		return "", fmt.Errorf("fetch: read body: %w", err)
	}

	respHeaders := make([][2]string, 0, len(resp.Header))
	for k, vals := range resp.Header {
		for _, v := range vals {
			respHeaders = append(respHeaders, [2]string{k, v})
		}
	}

	result, _ := json.Marshal(map[string]any{
		"status":  resp.StatusCode,
		"headers": respHeaders,
		"body":    string(respBody),
	})
	return string(result), nil
}
