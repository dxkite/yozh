package astroruntime

import (
	"bytes"
	"crypto/sha256"
	"encoding/gob"
	"encoding/hex"
	"fmt"
	"os"

	"github.com/dxkite/qjs"
)

const bcFormatVersion uint32 = 1

// serializedPolyfill is the gob-encodable form of polyfillEntry.
type serializedPolyfill struct {
	Name string
	BC   []byte
}

// serializedBytecodeSet is the on-disk representation of bytecodeSet.
type serializedBytecodeSet struct {
	Version   uint32
	Polyfills []serializedPolyfill
	Bundle    []byte
	Glue      []byte
}

// cacheKey returns the SHA256 hex of all bytecode compilation inputs.
// Any change to the bundle, polyfills, or glue produces a new key,
// guaranteeing stale bytecodes are never loaded from cache.
func cacheKey(bundleCode []byte) string {
	h := sha256.New()
	h.Write(bundleCode)
	for _, src := range []string{
		webAPIPolyfill, cryptoPolyfill, filePolyfill,
		envAPIStub, intlStub, structuredCloneGuard, consoleDef, fetchDef,
		glueJS,
	} {
		h.Write([]byte(src))
	}
	return hex.EncodeToString(h.Sum(nil))
}

// saveCachedBytecodes encodes bcs to disk at path using gob encoding.
func saveCachedBytecodes(path string, bcs *bytecodeSet) error {
	sbs := serializedBytecodeSet{
		Version: bcFormatVersion,
		Bundle:  bcs.bundle,
		Glue:    bcs.glue,
	}
	for _, p := range bcs.polyfills {
		sbs.Polyfills = append(sbs.Polyfills, serializedPolyfill{Name: p.name, BC: p.bc})
	}
	var buf bytes.Buffer
	if err := gob.NewEncoder(&buf).Encode(sbs); err != nil {
		return err
	}
	return os.WriteFile(path, buf.Bytes(), 0644)
}

// loadCachedBytecodes reads and decodes a bytecodeSet from path.
// Returns an error if the file is missing, corrupt, or has a version mismatch.
func loadCachedBytecodes(path string) (*bytecodeSet, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var sbs serializedBytecodeSet
	if err := gob.NewDecoder(bytes.NewReader(data)).Decode(&sbs); err != nil {
		return nil, err
	}
	if sbs.Version != bcFormatVersion {
		return nil, fmt.Errorf("bytecode cache version mismatch: got %d, want %d", sbs.Version, bcFormatVersion)
	}
	bcs := &bytecodeSet{bundle: sbs.Bundle, glue: sbs.Glue}
	for _, p := range sbs.Polyfills {
		bcs.polyfills = append(bcs.polyfills, polyfillEntry{name: p.Name, bc: p.BC})
	}
	return bcs, nil
}

type polyfillEntry struct {
	name string
	bc   []byte
}

// bytecodeSet holds pre-compiled QuickJS bytecodes for a pool's lifetime.
// All pool workers share the same bytecodeSet (read-only after creation).
type bytecodeSet struct {
	polyfills []polyfillEntry
	bundle    []byte
	glue      []byte
}

// compileBytecodes compiles polyfills, the ESM bundle, and the glue adapter to
// QuickJS bytecode using the provided context. The returned bytecodes are
// independent copies of WASM memory and safe to use in any other context.
//
// Callers pass the first pool worker's context so no extra WASM runtime is
// created: the compile cost is borne by the same runtime instance that will
// also run the bytecodes, eliminating the overhead of a separate compile runtime.
func compileBytecodes(ctx *qjs.Context, bundleSrc []byte) (*bytecodeSet, error) {
	bcs := &bytecodeSet{}
	var err error

	// Compile polyfills (global scripts, order must match setupRuntime eval order).
	srcs := []struct{ name, src string }{
		{"web-api-polyfill.js", webAPIPolyfill},
		{"crypto-polyfill.js", cryptoPolyfill},
		{"file-polyfill.js", filePolyfill},
		{"env-api-stub.js", envAPIStub},
		{"intl-stub.js", intlStub},
		{"structured-clone.js", structuredCloneGuard},
		{"console.js", consoleDef},
		{"fetch.js", fetchDef},
	}
	bcs.polyfills = make([]polyfillEntry, 0, len(srcs))
	for _, p := range srcs {
		bc, err := ctx.Compile(p.name, qjs.Code(p.src))
		if err != nil {
			return nil, fmt.Errorf("compile polyfill %s: %w", p.name, err)
		}
		bcs.polyfills = append(bcs.polyfills, polyfillEntry{p.name, bc})
	}

	// Compile the ESM bundle (module mode, self-contained — no external imports).
	bcs.bundle, err = ctx.Compile("ssr.mjs", qjs.Code(string(bundleSrc)), qjs.TypeModule())
	if err != nil {
		return nil, fmt.Errorf("compile bundle: %w", err)
	}

	// Compile the glue adapter (global script).
	bcs.glue, err = ctx.Compile("glue.js", qjs.Code(glueJS))
	if err != nil {
		return nil, fmt.Errorf("compile glue: %w", err)
	}

	return bcs, nil
}
