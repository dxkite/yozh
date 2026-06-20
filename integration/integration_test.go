package integration_test

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	netlifyruntime "github.com/dxkite/astro-runtime"
)

// loadPool loads the pre-bundled testapp-ssr CJS from testdata.
func loadPool(t *testing.T, size int) *netlifyruntime.Pool {
	t.Helper()
	bundle := filepath.Join("testdata", "testapp-ssr", "bundle.cjs")
	code, err := os.ReadFile(bundle)
	if err != nil {
		t.Fatalf("read testdata bundle: %v", err)
	}
	pool, err := netlifyruntime.NewPool(code, map[string]string{"NODE_ENV": "production"}, size)
	if err != nil {
		t.Fatalf("NewPool: %v", err)
	}
	return pool
}

// do performs a single SSR request and returns the response recorder.
func do(t *testing.T, pool *netlifyruntime.Pool, method, path, cookie, body string) *httptest.ResponseRecorder {
	t.Helper()
	var bodyReader *strings.Reader
	if body != "" {
		bodyReader = strings.NewReader(body)
	}
	var req *http.Request
	var err error
	if bodyReader != nil {
		req, err = http.NewRequest(method, "http://localhost"+path, bodyReader)
	} else {
		req, err = http.NewRequest(method, "http://localhost"+path, nil)
	}
	if err != nil {
		t.Fatalf("NewRequest: %v", err)
	}
	if cookie != "" {
		req.Header.Set("Cookie", cookie)
	}
	if body != "" {
		req.Header.Set("Content-Type", "application/json")
	}
	w := httptest.NewRecorder()
	netlifyruntime.HandleSSR(pool, w, req)
	return w
}

// ── Original 11 test cases ────────────────────────────────────────────────────

func TestHomePage(t *testing.T) {
	pool := loadPool(t, 2)
	w := do(t, pool, "GET", "/", "", "")
	if w.Code != 200 {
		t.Fatalf("status %d, want 200", w.Code)
	}
	if !strings.Contains(w.Body.String(), "Online Store") {
		t.Errorf("body missing 'Online Store'; got: %.200s", w.Body.String())
	}
}

func TestProductDetail(t *testing.T) {
	pool := loadPool(t, 2)
	w := do(t, pool, "GET", "/products/1", "", "")
	if w.Code != 200 {
		t.Fatalf("status %d, want 200", w.Code)
	}
	if !strings.Contains(w.Body.String(), "Cereal") {
		t.Errorf("body missing 'Cereal'; got: %.200s", w.Body.String())
	}
}

func TestProductNotFound(t *testing.T) {
	pool := loadPool(t, 2)
	w := do(t, pool, "GET", "/products/99", "", "")
	if w.Code != 302 && w.Code != 301 && w.Code != 200 {
		t.Fatalf("status %d, want redirect or 200", w.Code)
	}
}

func TestProductsAPI(t *testing.T) {
	pool := loadPool(t, 2)
	w := do(t, pool, "GET", "/api/products", "", "")
	if w.Code != 200 {
		t.Fatalf("status %d, want 200", w.Code)
	}
	var items []map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &items); err != nil {
		t.Fatalf("JSON parse: %v — body: %.200s", err, w.Body.String())
	}
	if len(items) == 0 {
		t.Errorf("expected non-empty product list")
	}
}

func TestSingleProductAPI(t *testing.T) {
	pool := loadPool(t, 2)
	w := do(t, pool, "GET", "/api/products/2", "", "")
	if w.Code != 200 {
		t.Fatalf("status %d, want 200", w.Code)
	}
	if !strings.Contains(w.Body.String(), "Yogurt") {
		t.Errorf("body missing 'Yogurt'; got: %.200s", w.Body.String())
	}
}

func TestCartEmpty(t *testing.T) {
	pool := loadPool(t, 2)
	w := do(t, pool, "GET", "/cart", "", "")
	if w.Code != 200 {
		t.Fatalf("status %d, want 200", w.Code)
	}
	if !strings.Contains(w.Body.String(), "empty") {
		t.Errorf("body missing 'empty'; got: %.200s", w.Body.String())
	}
}

func TestCartAPIEmpty(t *testing.T) {
	pool := loadPool(t, 2)
	w := do(t, pool, "GET", "/api/cart", "", "")
	if w.Code != 200 {
		t.Fatalf("status %d, want 200", w.Code)
	}
	if !strings.Contains(w.Body.String(), "items") {
		t.Errorf("body missing 'items'; got: %.200s", w.Body.String())
	}
}

// TestCartSession uses pool size 1 so all requests hit the same runtime (same in-memory session Map).
func TestCartSession(t *testing.T) {
	pool := loadPool(t, 1)
	cookie := "user-id=integtest999"

	w := do(t, pool, "POST", "/api/cart", cookie, `{"id":1,"name":"Cereal"}`)
	if w.Code != 200 {
		t.Fatalf("add to cart: status %d — body: %.200s", w.Code, w.Body.String())
	}
	if !strings.Contains(w.Body.String(), "ok") {
		t.Errorf("add to cart: expected 'ok'; got: %.200s", w.Body.String())
	}

	w = do(t, pool, "GET", "/api/cart", cookie, "")
	if w.Code != 200 {
		t.Fatalf("get cart: status %d", w.Code)
	}
	if !strings.Contains(w.Body.String(), "Cereal") {
		t.Errorf("cart API missing 'Cereal'; got: %.200s", w.Body.String())
	}

	w = do(t, pool, "GET", "/cart", cookie, "")
	if w.Code != 200 {
		t.Fatalf("cart page: status %d", w.Code)
	}
	if !strings.Contains(w.Body.String(), "Cereal") {
		t.Errorf("cart page missing 'Cereal'; got: %.200s", w.Body.String())
	}
}

// ── Polyfill unit tests ───────────────────────────────────────────────────────

// minimalPool creates a pool with a minimal CJS bundle for polyfill testing.
func minimalPool(t *testing.T, size int) *netlifyruntime.Pool {
	t.Helper()
	bundle := []byte(`
module.exports.default = function(config) {
    return async function handler(request, context) {
        var url = new URL(request.url);
        var expr = url.searchParams.get('expr');
        var result;
        try {
            result = await eval(expr);
        } catch(e) {
            return new Response(JSON.stringify({error: String(e)}), {
                status: 500,
                headers: {'content-type': 'application/json'},
            });
        }
        var body;
        if (result instanceof ArrayBuffer) {
            body = JSON.stringify({arrayBuffer: true, byteLength: result.byteLength});
        } else if (result instanceof Uint8Array) {
            body = JSON.stringify({uint8Array: true, byteLength: result.byteLength});
        } else {
            body = JSON.stringify({result: result});
        }
        return new Response(body, {
            status: 200,
            headers: {'content-type': 'application/json'},
        });
    };
};
`)
	pool, err := netlifyruntime.NewPool(bundle, map[string]string{}, size)
	if err != nil {
		t.Fatalf("minimalPool NewPool: %v", err)
	}
	return pool
}

func evalExpr(t *testing.T, pool *netlifyruntime.Pool, expr string) map[string]interface{} {
	t.Helper()
	path := "/test?expr=" + encodeURIComponent(expr)
	w := do(t, pool, "GET", path, "", "")
	if w.Code == 500 {
		var errResp map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &errResp)
		t.Fatalf("JS error evaluating %q: %v", expr, errResp["error"])
	}
	if w.Code != 200 {
		t.Fatalf("unexpected status %d for %q", w.Code, expr)
	}
	var result map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatalf("JSON parse failed: %v — body: %s", err, w.Body.String())
	}
	return result
}

func encodeURIComponent(s string) string {
	var b strings.Builder
	for _, c := range []byte(s) {
		if (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') ||
			c == '-' || c == '_' || c == '.' || c == '!' || c == '~' || c == '*' || c == '\'' || c == '(' || c == ')' {
			b.WriteByte(c)
		} else {
			fmt.Fprintf(&b, "%%%02X", c)
		}
	}
	return b.String()
}

func TestTextEncoderDecoder(t *testing.T) {
	pool := minimalPool(t, 1)

	r := evalExpr(t, pool, `(function() { var e = new TextEncoder(); var u = e.encode("hello"); return u.byteLength; })()`)
	if r["result"] != float64(5) {
		t.Errorf("TextEncoder encode byteLength: got %v, want 5", r["result"])
	}

	r = evalExpr(t, pool, `(function() { var e = new TextEncoder(); return e.encode("中").byteLength; })()`)
	if r["result"] != float64(3) {
		t.Errorf("TextEncoder encode Chinese char: got %v, want 3", r["result"])
	}

	r = evalExpr(t, pool, `(function() { var e = new TextEncoder(); var d = new TextDecoder(); return d.decode(e.encode("hello world")); })()`)
	if r["result"] != "hello world" {
		t.Errorf("TextDecoder round-trip: got %v, want 'hello world'", r["result"])
	}

	r = evalExpr(t, pool, `(function() { var e = new TextEncoder(); var d = new TextDecoder(); return d.decode(e.encode("中文")); })()`)
	if r["result"] != "中文" {
		t.Errorf("TextDecoder multi-byte round-trip: got %v, want '中文'", r["result"])
	}
}

func TestHeadersSetCookie(t *testing.T) {
	pool := minimalPool(t, 1)

	r := evalExpr(t, pool, `(function() {
		var h = new Headers();
		h.append('set-cookie', 'a=1; Path=/');
		h.append('set-cookie', 'b=2; Path=/; Secure');
		return h.getSetCookie().length;
	})()`)
	if r["result"] != float64(2) {
		t.Errorf("getSetCookie count: got %v, want 2", r["result"])
	}

	r = evalExpr(t, pool, `(function() {
		var h = new Headers();
		h.append('set-cookie', 'data=foo,bar; Path=/');
		var cookies = h.getSetCookie();
		return cookies[0];
	})()`)
	if r["result"] != "data=foo,bar; Path=/" {
		t.Errorf("set-cookie with comma: got %v, want 'data=foo,bar; Path=/'", r["result"])
	}
}

func TestAtobBtoa(t *testing.T) {
	pool := minimalPool(t, 1)

	r := evalExpr(t, pool, `btoa('hello world')`)
	if r["result"] != "aGVsbG8gd29ybGQ=" {
		t.Errorf("btoa: got %v, want 'aGVsbG8gd29ybGQ='", r["result"])
	}

	r = evalExpr(t, pool, `atob('aGVsbG8gd29ybGQ=')`)
	if r["result"] != "hello world" {
		t.Errorf("atob: got %v, want 'hello world'", r["result"])
	}

	r = evalExpr(t, pool, `atob(btoa('test data 123'))`)
	if r["result"] != "test data 123" {
		t.Errorf("atob(btoa) round-trip: got %v", r["result"])
	}
}

func TestURLParsing(t *testing.T) {
	pool := minimalPool(t, 1)

	r := evalExpr(t, pool, `(function() { var u = new URL('http://example.com/path?q=1#hash'); return [u.hostname, u.pathname, u.search, u.hash].join('|'); })()`)
	if r["result"] != "example.com|/path|?q=1|#hash" {
		t.Errorf("URL absolute: got %v", r["result"])
	}

	r = evalExpr(t, pool, `(function() { var u = new URL('/other', 'http://base.com/path'); return u.href; })()`)
	if r["result"] != "http://base.com/other" {
		t.Errorf("URL relative: got %v, want 'http://base.com/other'", r["result"])
	}

	r = evalExpr(t, pool, `URL.canParse('http://valid.com')`)
	if r["result"] != true {
		t.Errorf("URL.canParse valid: got %v, want true", r["result"])
	}

	r = evalExpr(t, pool, `(function() { var u = new URL('http://[::1]:8080/'); return u.host; })()`)
	if r["result"] != "[::1]:8080" {
		t.Errorf("URL IPv6 host: got %v, want '[::1]:8080'", r["result"])
	}
}

func TestCryptoRandomUUID(t *testing.T) {
	pool := minimalPool(t, 1)
	r := evalExpr(t, pool, `crypto.randomUUID()`)
	uuid, ok := r["result"].(string)
	if !ok || len(uuid) != 36 {
		t.Errorf("randomUUID: got %v (len %d), want 36-char UUID", r["result"], len(uuid))
	}
	parts := strings.Split(uuid, "-")
	if len(parts) != 5 {
		t.Errorf("randomUUID: expected 5 dash-separated groups, got %v", uuid)
	}
}

func TestCryptoSubtleDigest(t *testing.T) {
	pool := minimalPool(t, 1)

	r := evalExpr(t, pool, `(async function() {
		var data = new TextEncoder().encode('abc');
		var hash = await crypto.subtle.digest('SHA-256', data);
		return hash.byteLength;
	})()`)
	if r["result"] != float64(32) {
		t.Errorf("SHA-256 digest byteLength: got %v, want 32", r["result"])
	}

	r = evalExpr(t, pool, `(async function() {
		var hash = await crypto.subtle.digest('SHA-512', new TextEncoder().encode('hello'));
		return hash.byteLength;
	})()`)
	if r["result"] != float64(64) {
		t.Errorf("SHA-512 digest byteLength: got %v, want 64", r["result"])
	}
}

func TestCryptoSubtleHMAC(t *testing.T) {
	pool := minimalPool(t, 1)

	r := evalExpr(t, pool, `(async function() {
		var key = await crypto.subtle.generateKey({name:'HMAC', hash:'SHA-256'}, true, ['sign','verify']);
		var data = new TextEncoder().encode('hello world');
		var sig = await crypto.subtle.sign('HMAC', key, data);
		var ok = await crypto.subtle.verify('HMAC', key, sig, data);
		var badOk = await crypto.subtle.verify('HMAC', key, sig, new TextEncoder().encode('bad'));
		return ok && !badOk;
	})()`)
	if r["result"] != true {
		t.Errorf("HMAC sign/verify: got %v, want true", r["result"])
	}

	r = evalExpr(t, pool, `(async function() {
		var key = await crypto.subtle.generateKey({name:'HMAC', hash:'SHA-256'}, false, ['sign']);
		var sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('test'));
		return sig.byteLength;
	})()`)
	if r["result"] != float64(32) {
		t.Errorf("HMAC SHA-256 sig byteLength: got %v, want 32", r["result"])
	}

	r = evalExpr(t, pool, `(async function() {
		var rawKey = new Uint8Array(32);
		crypto.getRandomValues(rawKey);
		var key = await crypto.subtle.importKey('raw', rawKey, {name:'HMAC', hash:'SHA-256'}, false, ['sign','verify']);
		var sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('message'));
		return await crypto.subtle.verify('HMAC', key, sig, new TextEncoder().encode('message'));
	})()`)
	if r["result"] != true {
		t.Errorf("HMAC importKey+sign+verify: got %v", r["result"])
	}

	r = evalExpr(t, pool, `(async function() {
		var raw = new Uint8Array([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32]);
		var key = await crypto.subtle.importKey('raw', raw, {name:'HMAC', hash:'SHA-256'}, true, ['sign']);
		var exported = await crypto.subtle.exportKey('raw', key);
		var u = new Uint8Array(exported);
		return u[0] === 1 && u[31] === 32 && u.byteLength === 32;
	})()`)
	if r["result"] != true {
		t.Errorf("HMAC exportKey raw: got %v", r["result"])
	}
}

func TestCryptoSubtleAESGCM(t *testing.T) {
	pool := minimalPool(t, 1)

	r := evalExpr(t, pool, `(async function() {
		var key = await crypto.subtle.generateKey({name:'AES-GCM', length:256}, true, ['encrypt','decrypt']);
		var iv = crypto.getRandomValues(new Uint8Array(12));
		var plain = new TextEncoder().encode('secret message');
		var cipher = await crypto.subtle.encrypt({name:'AES-GCM', iv:iv}, key, plain);
		var dec = await crypto.subtle.decrypt({name:'AES-GCM', iv:iv}, key, cipher);
		return new TextDecoder().decode(dec);
	})()`)
	if r["result"] != "secret message" {
		t.Errorf("AES-GCM round-trip: got %v, want 'secret message'", r["result"])
	}

	r = evalExpr(t, pool, `(async function() {
		var key = await crypto.subtle.generateKey({name:'AES-GCM', length:128}, false, ['encrypt','decrypt']);
		var iv = new Uint8Array(12);
		var cipher = await crypto.subtle.encrypt({name:'AES-GCM', iv:iv}, key, new TextEncoder().encode('data'));
		var dec = await crypto.subtle.decrypt({name:'AES-GCM', iv:iv}, key, cipher);
		return new TextDecoder().decode(dec);
	})()`)
	if r["result"] != "data" {
		t.Errorf("AES-128-GCM round-trip: got %v, want 'data'", r["result"])
	}
}

func TestCryptoSubtleExportImportJWK(t *testing.T) {
	pool := minimalPool(t, 1)

	r := evalExpr(t, pool, `(async function() {
		var key = await crypto.subtle.generateKey({name:'HMAC', hash:'SHA-256'}, true, ['sign','verify']);
		var jwk = await crypto.subtle.exportKey('jwk', key);
		var key2 = await crypto.subtle.importKey('jwk', jwk, {name:'HMAC', hash:'SHA-256'}, false, ['sign','verify']);
		var msg = new TextEncoder().encode('roundtrip');
		var sig = await crypto.subtle.sign('HMAC', key, msg);
		return await crypto.subtle.verify('HMAC', key2, sig, msg);
	})()`)
	if r["result"] != true {
		t.Errorf("HMAC JWK export/import round-trip: got %v", r["result"])
	}
}

func TestGetRandomValues(t *testing.T) {
	pool := minimalPool(t, 1)

	r := evalExpr(t, pool, `(function() {
		var arr = new Uint8Array(16);
		crypto.getRandomValues(arr);
		var sum = 0;
		for (var i = 0; i < arr.length; i++) sum += arr[i];
		return sum > 0;
	})()`)
	if r["result"] != true {
		t.Errorf("getRandomValues: sum of 16 random bytes is 0 (should be > 0)")
	}
}

func TestPolyfillsQJSInit(t *testing.T) {
	bundle := []byte(`module.exports.default = function() { return async function(req) { return new Response('ok'); }; };`)
	_, err := netlifyruntime.NewPool(bundle, map[string]string{}, 2)
	if err != nil {
		t.Fatalf("pool init failed (polyfill error): %v", err)
	}
}

// ── Fix regression tests ──────────────────────────────────────────────────────

// TestPoolSizeValidation verifies that invalid pool sizes are rejected.
func TestPoolSizeValidation(t *testing.T) {
	bundle := []byte(`module.exports.default = function() { return async function(req) { return new Response('ok'); }; };`)
	cases := []struct {
		size int
		ok   bool
	}{
		{0, false},
		{-1, false},
		{1001, false},
		{1, true},
		{1000, true},
	}
	for _, c := range cases {
		_, err := netlifyruntime.NewPool(bundle, map[string]string{}, c.size)
		if c.ok && err != nil {
			t.Errorf("size=%d: unexpected error: %v", c.size, err)
		}
		if !c.ok && err == nil {
			t.Errorf("size=%d: expected error, got nil", c.size)
		}
	}
}

// TestEmptyBodyPOST verifies that an explicit empty POST body is passed as ""
// rather than null, so JS handlers can distinguish "no body" from "empty body".
func TestEmptyBodyPOST(t *testing.T) {
	bundle := []byte(`
module.exports.default = function() {
  return async function(req) {
    var body = await req.text();
    return new Response(JSON.stringify({body: body, bodyType: typeof body}), {
      status: 200, headers: {'content-type': 'application/json'},
    });
  };
};
`)
	p, err := netlifyruntime.NewPool(bundle, map[string]string{}, 1)
	if err != nil {
		t.Fatalf("NewPool: %v", err)
	}
	w := do(t, p, "POST", "/", "", "")
	if w.Code != 200 {
		t.Fatalf("status %d", w.Code)
	}
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["bodyType"] != "string" {
		t.Errorf("empty POST body: expected string type, got %v", resp["bodyType"])
	}
}

// TestURLSearchParamsSetter verifies that assigning url.search updates searchParams.
func TestURLSearchParamsSetter(t *testing.T) {
	pool := minimalPool(t, 1)

	r := evalExpr(t, pool, `(function() {
		var u = new URL('http://example.com/');
		u.search = '?foo=bar&x=1';
		return u.searchParams.get('foo');
	})()`)
	if r["result"] != "bar" {
		t.Errorf("URL search setter: searchParams.get('foo') = %v, want 'bar'", r["result"])
	}

	r = evalExpr(t, pool, `(function() {
		var u = new URL('http://example.com/?a=1');
		u.search = '?b=2';
		return u.searchParams.get('a') === null && u.searchParams.get('b') === '2';
	})()`)
	if r["result"] != true {
		t.Errorf("URL search setter: old params should be gone after reassignment: %v", r["result"])
	}

	r = evalExpr(t, pool, `(function() {
		var u = new URL('http://example.com/?q=hello');
		u.search = '';
		return u.searchParams.get('q');
	})()`)
	if r["result"] != nil {
		t.Errorf("URL search clear: searchParams.get('q') = %v, want null", r["result"])
	}
}

// TestAESCBC verifies AES-CBC encrypt/decrypt round-trip.
func TestAESCBC(t *testing.T) {
	pool := minimalPool(t, 1)

	r := evalExpr(t, pool, `(async function() {
		var key = await crypto.subtle.generateKey({name:'AES-CBC', length:256}, true, ['encrypt','decrypt']);
		var iv = crypto.getRandomValues(new Uint8Array(16));
		var plain = new TextEncoder().encode('AES-CBC test message');
		var cipher = await crypto.subtle.encrypt({name:'AES-CBC', iv:iv}, key, plain);
		var dec = await crypto.subtle.decrypt({name:'AES-CBC', iv:iv}, key, cipher);
		return new TextDecoder().decode(dec);
	})()`)
	if r["result"] != "AES-CBC test message" {
		t.Errorf("AES-CBC round-trip: got %v, want 'AES-CBC test message'", r["result"])
	}
}

// TestAESCBCWrongIV verifies that AES-CBC rejects an IV that is not exactly 16 bytes.
func TestAESCBCWrongIV(t *testing.T) {
	pool := minimalPool(t, 1)

	r := evalExpr(t, pool, `(async function() {
		var key = await crypto.subtle.generateKey({name:'AES-CBC', length:256}, false, ['encrypt','decrypt']);
		var iv12 = new Uint8Array(12);
		try {
			await crypto.subtle.encrypt({name:'AES-CBC', iv:iv12}, key, new TextEncoder().encode('x'));
			return 'no error';
		} catch(e) {
			return e.name + ':' + (e.message.indexOf('IV') >= 0 || e.message.indexOf('16') >= 0);
		}
	})()`)
	result, _ := r["result"].(string)
	if result == "no error" || result == "" {
		t.Errorf("AES-CBC wrong IV: expected error, got %v", r["result"])
	}
}

// TestAESGCMWrongIV verifies that AES-GCM rejects an IV that is not exactly 12 bytes.
func TestAESGCMWrongIV(t *testing.T) {
	pool := minimalPool(t, 1)

	r := evalExpr(t, pool, `(async function() {
		var key = await crypto.subtle.generateKey({name:'AES-GCM', length:256}, false, ['encrypt','decrypt']);
		var iv8 = new Uint8Array(8);
		try {
			await crypto.subtle.encrypt({name:'AES-GCM', iv:iv8}, key, new TextEncoder().encode('x'));
			return 'no error';
		} catch(e) {
			return e.name + ':' + (e.message.indexOf('IV') >= 0 || e.message.indexOf('12') >= 0);
		}
	})()`)
	result, _ := r["result"].(string)
	if result == "no error" || result == "" {
		t.Errorf("AES-GCM wrong IV: expected error, got %v", r["result"])
	}
}

// TestAESCBCTamperedCiphertext verifies that decryption fails when ciphertext is tampered,
// confirming the constant-time padding validation rejects invalid input.
func TestAESCBCTamperedCiphertext(t *testing.T) {
	pool := minimalPool(t, 1)

	// Pass a buffer of all zeros as ciphertext — decrypting random-key AES-CBC over zeros
	// produces garbage that almost certainly fails PKCS7 padding validation.
	r := evalExpr(t, pool, `(async function() {
		var key = await crypto.subtle.generateKey({name:'AES-CBC', length:256}, false, ['encrypt','decrypt']);
		var iv = new Uint8Array(16);
		var garbage = new Uint8Array(32); // valid length, invalid content
		try {
			await crypto.subtle.decrypt({name:'AES-CBC', iv:iv}, key, garbage.buffer);
			return 'no error';
		} catch(e) {
			return 'error';
		}
	})()`)
	if r["result"] != "error" {
		t.Errorf("AES-CBC garbage decrypt: expected error, got %v", r["result"])
	}

	// Wrong block size (not multiple of 16) must always fail.
	r = evalExpr(t, pool, `(async function() {
		var key = await crypto.subtle.generateKey({name:'AES-CBC', length:256}, false, ['encrypt','decrypt']);
		var iv = new Uint8Array(16);
		var badLen = new Uint8Array(17);
		try {
			await crypto.subtle.decrypt({name:'AES-CBC', iv:iv}, key, badLen.buffer);
			return 'no error';
		} catch(e) {
			return 'error';
		}
	})()`)
	if r["result"] != "error" {
		t.Errorf("AES-CBC wrong-length decrypt: expected error, got %v", r["result"])
	}
}

// ── BFF capability tests ─────────────────────────────────────────────────────

// TestBFFUpstreamFetch verifies that JS fetch() can call a real upstream HTTP service,
// which is the fundamental requirement for Astro API Routes acting as BFF.
func TestBFFUpstreamFetch(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"id":1,"name":"Widget","price":9.99}`)
	}))
	defer upstream.Close()

	pool := minimalPool(t, 1)

	r := evalExpr(t, pool, fmt.Sprintf(`(async function() {
		var res = await fetch('%s/products/1');
		var data = await res.json();
		return data.name;
	})()`, upstream.URL))

	if r["result"] != "Widget" {
		t.Errorf("upstream fetch: got %v, want 'Widget'", r["result"])
	}
}

// TestBFFAggregation verifies that BFF can call multiple upstream services and merge results.
// Note: __goFetchRaw dispatches one Go goroutine per fetch; the wazero WASM module backing
// QJS is single-threaded, so concurrent callbacks from multiple goroutines would race.
// We therefore await each fetch sequentially — this matches how real Astro SSR API routes
// should be written when targeting this runtime.
func TestBFFAggregation(t *testing.T) {
	catalog := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"id":1,"name":"Gadget"}`)
	}))
	defer catalog.Close()

	inventory := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"stock":42}`)
	}))
	defer inventory.Close()

	pool := minimalPool(t, 1)

	r := evalExpr(t, pool, fmt.Sprintf(`(async function() {
		var product  = await fetch('%s').then(r => r.json());
		var inv      = await fetch('%s').then(r => r.json());
		return JSON.stringify({ name: product.name, stock: inv.stock });
	})()`, catalog.URL, inventory.URL))

	var agg map[string]any
	if err := json.Unmarshal([]byte(r["result"].(string)), &agg); err != nil {
		t.Fatalf("parse aggregated result: %v", err)
	}
	if agg["name"] != "Gadget" {
		t.Errorf("product name: got %v, want 'Gadget'", agg["name"])
	}
	if agg["stock"] != float64(42) {
		t.Errorf("stock: got %v, want 42", agg["stock"])
	}
}

// TestBFFGracefulDegradation verifies that a failed upstream (HTTP 500) is handled
// without crashing the handler — the BFF returns partial data.
func TestBFFGracefulDegradation(t *testing.T) {
	good := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"name":"Widget"}`)
	}))
	defer good.Close()

	bad := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "service unavailable", http.StatusServiceUnavailable)
	}))
	defer bad.Close()

	pool := minimalPool(t, 1)

	// Fetch both sequentially; check res.ok for degradation (avoid throw inside eval/await).
	r := evalExpr(t, pool, fmt.Sprintf(`(async function() {
		var r1 = await fetch('%s');
		var product = r1.ok ? await r1.json() : null;
		var r2 = await fetch('%s');
		var reviews = r2.ok ? await r2.json() : null;
		return JSON.stringify({ product: product ? product.name : null, reviews: reviews });
	})()`, good.URL, bad.URL))

	var out map[string]any
	if err := json.Unmarshal([]byte(r["result"].(string)), &out); err != nil {
		t.Fatalf("parse: %v", err)
	}
	if out["product"] != "Widget" {
		t.Errorf("good service: got %v, want 'Widget'", out["product"])
	}
	if out["reviews"] != nil {
		t.Errorf("bad service should produce nil reviews, got %v", out["reviews"])
	}
}

// TestBFFSessionMiddleware verifies the HMAC-based session token sign+verify pattern
// used in src/middleware.ts: sign(btoa(userId)) → token → verify → decode userId.
func TestBFFSessionMiddleware(t *testing.T) {
	pool := minimalPool(t, 1)

	r := evalExpr(t, pool, `(async function() {
		var secret = 'test-session-secret';
		var userId = 'user-abc-123';

		var payload = btoa(userId);
		var key = await crypto.subtle.importKey(
			'raw', new TextEncoder().encode(secret),
			{ name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
		);
		var sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
		var sig    = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
		var token  = payload + '.' + sig;

		var [p, s] = token.split('.');
		var ok     = await crypto.subtle.verify(
			'HMAC', key,
			Uint8Array.from(atob(s), c => c.charCodeAt(0)),
			new TextEncoder().encode(p)
		);
		return JSON.stringify({ ok: ok, userId: atob(p) });
	})()`)

	var out map[string]any
	if err := json.Unmarshal([]byte(r["result"].(string)), &out); err != nil {
		t.Fatalf("parse: %v", err)
	}
	if out["ok"] != true {
		t.Errorf("session token verify: expected true, got %v", out["ok"])
	}
	if out["userId"] != "user-abc-123" {
		t.Errorf("session userId: got %v, want 'user-abc-123'", out["userId"])
	}
}

// TestBFFCartCookieRoundTrip verifies the AES-GCM cart cookie pattern from src/pages/api/cart.ts:
// encrypt(items) → base64(iv).base64(ciphertext) → decrypt → same items.
func TestBFFCartCookieRoundTrip(t *testing.T) {
	pool := minimalPool(t, 1)

	r := evalExpr(t, pool, `(async function() {
		var key = await crypto.subtle.generateKey({name:'AES-GCM', length:256}, false, ['encrypt','decrypt']);
		var items = [{id:1, name:'Widget', price:9.99, count:2}];
		var b64 = function(u8) { return btoa(String.fromCharCode(...u8)); };

		var iv  = crypto.getRandomValues(new Uint8Array(12));
		var enc = await crypto.subtle.encrypt(
			{name:'AES-GCM', iv:iv}, key,
			new TextEncoder().encode(JSON.stringify(items))
		);
		var token = b64(iv) + '.' + b64(new Uint8Array(enc));

		var parts = token.split('.');
		var iv2   = Uint8Array.from(atob(parts[0]), c => c.charCodeAt(0));
		var ct    = Uint8Array.from(atob(parts[1]), c => c.charCodeAt(0));
		var dec   = await crypto.subtle.decrypt({name:'AES-GCM', iv:iv2}, key, ct);
		var got   = JSON.parse(new TextDecoder().decode(dec));

		return JSON.stringify({ count: got.length, name: got[0].name, qty: got[0].count });
	})()`)

	var out map[string]any
	if err := json.Unmarshal([]byte(r["result"].(string)), &out); err != nil {
		t.Fatalf("parse: %v", err)
	}
	if out["count"] != float64(1) || out["name"] != "Widget" || out["qty"] != float64(2) {
		t.Errorf("cart cookie round-trip: got %v", out)
	}
}

// TestBFFUpstreamHMACAuth verifies that JS can attach HMAC-signed headers to outgoing requests
// and a real upstream server can validate the signature — the pattern in src/lib/upstream.ts.
func TestBFFUpstreamHMACAuth(t *testing.T) {
	const secret = "upstream-signing-secret"

	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ts  := r.Header.Get("X-Timestamp")
		sig := r.Header.Get("X-Signature")
		if ts == "" || sig == "" {
			http.Error(w, "missing auth", http.StatusUnauthorized)
			return
		}
		mac := hmac.New(sha256.New, []byte(secret))
		mac.Write([]byte(ts))
		expected := base64.StdEncoding.EncodeToString(mac.Sum(nil))
		if sig != expected {
			http.Error(w, "bad signature", http.StatusForbidden)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"ok":true}`)
	}))
	defer upstream.Close()

	pool := minimalPool(t, 1)

	r := evalExpr(t, pool, fmt.Sprintf(`(async function() {
		var secret = '%s';
		var ts = String(Date.now());
		var key = await crypto.subtle.importKey(
			'raw', new TextEncoder().encode(secret),
			{ name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
		);
		var sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(ts));
		var sig = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));

		var res  = await fetch('%s/data', { headers: { 'X-Timestamp': ts, 'X-Signature': sig } });
		var data = await res.json();
		return JSON.stringify({ status: res.status, ok: data.ok });
	})()`, secret, upstream.URL))

	var out map[string]any
	if err := json.Unmarshal([]byte(r["result"].(string)), &out); err != nil {
		t.Fatalf("parse: %v", err)
	}
	if out["status"] != float64(200) || out["ok"] != true {
		t.Errorf("HMAC auth request: got %v", out)
	}
}

// TestTextEncoderInto verifies encodeInto with partial buffer and correct read/written values.
func TestTextEncoderInto(t *testing.T) {
	pool := minimalPool(t, 1)

	// Full fit: result.written === encoded length, result.read === str.length
	r := evalExpr(t, pool, `(function() {
		var enc = new TextEncoder();
		var dest = new Uint8Array(20);
		var res = enc.encodeInto('hello', dest);
		return res.written === 5 && res.read === 5;
	})()`)
	if r["result"] != true {
		t.Errorf("encodeInto full fit: %v", r["result"])
	}

	// Partial: 3-byte UTF-8 char '中' won't fit in a 2-byte dest
	r = evalExpr(t, pool, `(function() {
		var enc = new TextEncoder();
		var dest = new Uint8Array(2);
		var res = enc.encodeInto('中', dest);
		return res.written === 0 && res.read === 0;
	})()`)
	if r["result"] != true {
		t.Errorf("encodeInto partial multi-byte: %v", r["result"])
	}

	// Partial: 'ABC中' (3 ASCII + 3 UTF-8 bytes) into 5-byte dest — only 'ABC' fits
	r = evalExpr(t, pool, `(function() {
		var enc = new TextEncoder();
		var dest = new Uint8Array(5);
		var res = enc.encodeInto('ABC中', dest);
		return res.written === 3 && res.read === 3;
	})()`)
	if r["result"] != true {
		t.Errorf("encodeInto ASCII+multibyte partial: %v", r["result"])
	}
}
