package sobek

import (
	"testing"
)

// ── Fix 4: strArg — safe type extraction ──────────────────────────────────────

func TestStrArgInBounds(t *testing.T) {
	args := []any{"hello", "world"}
	if got := strArg(args, 0); got != "hello" {
		t.Errorf("strArg(0) = %q, want %q", got, "hello")
	}
	if got := strArg(args, 1); got != "world" {
		t.Errorf("strArg(1) = %q, want %q", got, "world")
	}
}

func TestStrArgOutOfRange(t *testing.T) {
	args := []any{"only"}
	if got := strArg(args, 1); got != "" {
		t.Errorf("strArg(1) out of range = %q, want \"\"", got)
	}
	if got := strArg(nil, 0); got != "" {
		t.Errorf("strArg(nil, 0) = %q, want \"\"", got)
	}
}

func TestStrArgWrongType(t *testing.T) {
	args := []any{int64(42), true, 3.14, nil}
	for i := range args {
		if got := strArg(args, i); got != "" {
			t.Errorf("strArg(%d) non-string = %q, want \"\"", i, got)
		}
	}
}

// ── Fix 4: crypto host funcs return ERROR: on wrong-typed args, no panic ──────

// newBareCtx creates a runtime with only crypto host functions injected.
// No polyfills: tests call __go_cryptoSubtle* host functions directly from JS.
func newBareCtx(t *testing.T) (JSContext, map[string]*cryptoKey) {
	t.Helper()
	eng := NewEngineForKind(EngineGoja)
	rt, err := eng.New()
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(rt.Close)
	keyReg := make(map[string]*cryptoKey)
	injectCryptoSubtle(rt.Ctx(), keyReg)
	return rt.Ctx(), keyReg
}

// newFullCtx creates a runtime with all polyfills (btoa, crypto.subtle, etc.).
func newFullCtx(t *testing.T) JSContext {
	t.Helper()
	eng := NewEngineForKind(EngineGoja)
	rt, err := eng.New()
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(rt.Close)
	if err := SetupRuntime(rt.Ctx(), SetupOptions{}); err != nil {
		t.Fatal("SetupRuntime:", err)
	}
	return rt.Ctx()
}

// TestCryptoDigestWrongArgType verifies that passing a non-string algo (int64 42)
// to __go_cryptoSubtleDigest returns ERROR: rather than panicking.
// strArg(args, 0) returns "" → unsupported algorithm error.
func TestCryptoDigestWrongArgType(t *testing.T) {
	ctx, _ := newBareCtx(t)
	err := ctx.Eval("test.js", `
		var result = __go_cryptoSubtleDigest(42, "");
		if (!result.startsWith("ERROR:")) throw new Error("expected ERROR:, got: " + result);
	`, EvalScript)
	if err != nil {
		t.Fatal(err)
	}
}

// TestCryptoImportKeyWrongArgType verifies that a non-string algo JSON arg
// (number 999) to __go_cryptoSubtleImportKey returns ERROR: rather than panicking.
func TestCryptoImportKeyWrongArgType(t *testing.T) {
	ctx, _ := newBareCtx(t)
	err := ctx.Eval("test.js", `
		// args[2] is a number — strArg returns "" → JSON unmarshal error
		var result = __go_cryptoSubtleImportKey("raw", "AAEC", 999, "true", "[]");
		if (!result.startsWith("ERROR:")) throw new Error("expected ERROR:, got: " + result);
	`, EvalScript)
	if err != nil {
		t.Fatal(err)
	}
}

// TestCryptoGenerateKeyWrongArgType verifies that a null algo arg to
// __go_cryptoSubtleGenerateKey returns ERROR: rather than panicking.
func TestCryptoGenerateKeyWrongArgType(t *testing.T) {
	ctx, _ := newBareCtx(t)
	err := ctx.Eval("test.js", `
		var result = __go_cryptoSubtleGenerateKey(null, "true", "[]");
		if (!result.startsWith("ERROR:")) throw new Error("expected ERROR:, got: " + result);
	`, EvalScript)
	if err != nil {
		t.Fatal(err)
	}
}

// TestCryptoEncryptWrongArgType verifies that a non-string algo arg to
// __go_cryptoSubtleEncrypt returns ERROR: rather than panicking.
func TestCryptoEncryptWrongArgType(t *testing.T) {
	ctx, _ := newBareCtx(t)
	err := ctx.Eval("test.js", `
		var result = __go_cryptoSubtleEncrypt(false, "keyid", "AAAA");
		if (!result.startsWith("ERROR:")) throw new Error("expected ERROR:, got: " + result);
	`, EvalScript)
	if err != nil {
		t.Fatal(err)
	}
}

// TestCryptoDecryptWrongArgType verifies that a non-string algo arg to
// __go_cryptoSubtleDecrypt returns ERROR: rather than panicking.
func TestCryptoDecryptWrongArgType(t *testing.T) {
	ctx, _ := newBareCtx(t)
	err := ctx.Eval("test.js", `
		var result = __go_cryptoSubtleDecrypt(99, "keyid", "AAAA");
		if (!result.startsWith("ERROR:")) throw new Error("expected ERROR:, got: " + result);
	`, EvalScript)
	if err != nil {
		t.Fatal(err)
	}
}

// ── Fix 5: keyReg bounded growth (cap 256) ────────────────────────────────────

// TestAddCryptoKeyBounded verifies that addCryptoKey never lets keyReg grow
// beyond 256 entries, clearing all entries on overflow.
func TestAddCryptoKeyBounded(t *testing.T) {
	keyReg := make(map[string]*cryptoKey)
	for i := 0; i < 300; i++ {
		id, err := newKeyID()
		if err != nil {
			t.Fatal(err)
		}
		addCryptoKey(keyReg, &cryptoKey{ID: id, Type: "secret"})
	}
	if len(keyReg) >= 256 {
		t.Errorf("keyReg len = %d, expected < 256 after eviction", len(keyReg))
	}
	t.Logf("keyReg len after 300 inserts = %d", len(keyReg))
}

// TestAddCryptoKeyNoPanic verifies that addCryptoKey is safe to call in a tight
// loop (1000 inserts, multiple evictions) without panicking.
func TestAddCryptoKeyNoPanic(t *testing.T) {
	keyReg := make(map[string]*cryptoKey)
	for i := 0; i < 1000; i++ {
		id, err := newKeyID()
		if err != nil {
			t.Fatal(err)
		}
		addCryptoKey(keyReg, &cryptoKey{ID: id, Type: "secret"})
	}
}

// TestCryptoKeyRegBoundedViaJS verifies that 300 importKey calls from JS
// (which go through __go_cryptoSubtleImportKey → addCryptoKey) do not panic.
// Uses SetupRuntime to get btoa, which the crypto polyfill uses internally.
func TestCryptoKeyRegBoundedViaJS(t *testing.T) {
	ctx := newFullCtx(t)
	// Call the underlying host function directly 300 times.
	// algoJSON is a valid AES-GCM descriptor; keyB64 is 32 zero bytes in base64.
	// btoa(String.fromCharCode(...new Uint8Array(32))) == 43 'A's + '='
	err := ctx.Eval("test.js", `
		var algoJSON = JSON.stringify({name:"AES-GCM",length:256});
		var keyB64 = btoa(String.fromCharCode.apply(null, new Uint8Array(32)));
		for (var i = 0; i < 300; i++) {
			var id = __go_cryptoSubtleImportKey("raw", keyB64, algoJSON, "true", '["encrypt"]');
			if (id.startsWith("ERROR:")) throw new Error("importKey failed at i=" + i + ": " + id);
		}
	`, EvalScript)
	if err != nil {
		t.Fatal(err)
	}
}

// ── Regression: crypto.subtle happy paths ─────────────────────────────────────

// TestCryptoSubtleDigestSHA256 verifies SHA-256 via the JS polyfill.
func TestCryptoSubtleDigestSHA256(t *testing.T) {
	ctx := newFullCtx(t)
	err := ctx.Eval("test.js", `
		const buf = new TextEncoder().encode("hello world");
		const hash = await crypto.subtle.digest("SHA-256", buf);
		if (!(hash instanceof ArrayBuffer) || hash.byteLength !== 32)
			throw new Error("unexpected hash length: " + hash.byteLength);
	`, EvalAsync)
	if err != nil {
		t.Fatal(err)
	}
}

// TestCryptoSubtleSignVerify verifies HMAC-SHA256 sign/verify round-trip.
func TestCryptoSubtleSignVerify(t *testing.T) {
	ctx := newFullCtx(t)
	err := ctx.Eval("test.js", `
		const rawKey = new Uint8Array(32); // 32 zero bytes
		const key = await crypto.subtle.importKey("raw", rawKey, {name:"HMAC",hash:"SHA-256"}, false, ["sign","verify"]);
		const data = new TextEncoder().encode("test data");
		const sig = await crypto.subtle.sign("HMAC", key, data);
		if (!(sig instanceof ArrayBuffer)) throw new Error("sig not ArrayBuffer");
		const ok = await crypto.subtle.verify("HMAC", key, sig, data);
		if (!ok) throw new Error("verify returned false");
	`, EvalAsync)
	if err != nil {
		t.Fatal(err)
	}
}

// TestCryptoSubtleAESGCMRoundTrip verifies AES-GCM encrypt/decrypt.
func TestCryptoSubtleAESGCMRoundTrip(t *testing.T) {
	ctx := newFullCtx(t)
	err := ctx.Eval("test.js", `
		const key = await crypto.subtle.generateKey({name:"AES-GCM",length:256}, true, ["encrypt","decrypt"]);
		const iv = crypto.getRandomValues(new Uint8Array(12));
		const plain = new TextEncoder().encode("hello AES-GCM");
		const cipher = await crypto.subtle.encrypt({name:"AES-GCM",iv}, key, plain);
		if (!(cipher instanceof ArrayBuffer)) throw new Error("cipher not ArrayBuffer");
		const dec = await crypto.subtle.decrypt({name:"AES-GCM",iv}, key, cipher);
		const got = new TextDecoder().decode(dec);
		if (got !== "hello AES-GCM") throw new Error("round-trip mismatch: " + got);
	`, EvalAsync)
	if err != nil {
		t.Fatal(err)
	}
}

// TestCryptoSubtleAESCBCRoundTrip verifies AES-CBC encrypt/decrypt.
func TestCryptoSubtleAESCBCRoundTrip(t *testing.T) {
	ctx := newFullCtx(t)
	err := ctx.Eval("test.js", `
		const key = await crypto.subtle.generateKey({name:"AES-CBC",length:256}, true, ["encrypt","decrypt"]);
		const iv = crypto.getRandomValues(new Uint8Array(16));
		const plain = new TextEncoder().encode("hello AES-CBC");
		const cipher = await crypto.subtle.encrypt({name:"AES-CBC",iv}, key, plain);
		const dec = await crypto.subtle.decrypt({name:"AES-CBC",iv}, key, cipher);
		const got = new TextDecoder().decode(dec);
		if (got !== "hello AES-CBC") throw new Error("round-trip mismatch: " + got);
	`, EvalAsync)
	if err != nil {
		t.Fatal(err)
	}
}

// TestCryptoSubtleExportImportKey verifies generateKey → exportKey → importKey round-trip.
func TestCryptoSubtleExportImportKey(t *testing.T) {
	ctx := newFullCtx(t)
	err := ctx.Eval("test.js", `
		const key1 = await crypto.subtle.generateKey({name:"AES-GCM",length:256}, true, ["encrypt","decrypt"]);
		const rawBytes = await crypto.subtle.exportKey("raw", key1);
		if (!(rawBytes instanceof ArrayBuffer) || rawBytes.byteLength !== 32)
			throw new Error("export: unexpected length " + rawBytes.byteLength);
		const key2 = await crypto.subtle.importKey("raw", rawBytes, {name:"AES-GCM"}, false, ["encrypt","decrypt"]);
		// Re-encrypt with imported key to verify it works.
		const iv = new Uint8Array(12);
		const plain = new TextEncoder().encode("round-trip");
		const c = await crypto.subtle.encrypt({name:"AES-GCM",iv}, key2, plain);
		if (!(c instanceof ArrayBuffer)) throw new Error("re-encrypt failed");
	`, EvalAsync)
	if err != nil {
		t.Fatal(err)
	}
}
