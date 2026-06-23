package astroruntime

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"runtime/debug"

	"github.com/dxkite/qjs"
)

// CompileBundleBytecode compiles bundleSrc to raw QuickJS module bytecode.
// The output is the direct JS_WriteObject result — the same format written to bundle.bc.
// Polyfills and glue are NOT included; they are compiled fresh at runtime by the pool.
func CompileBundleBytecode(bundleSrc []byte) ([]byte, error) {
	rt, err := qjs.New(qjs.Option{})
	if err != nil {
		return nil, fmt.Errorf("qjs runtime: %w", err)
	}
	defer rt.Close()
	bc, err := rt.Context().Compile("ssr.mjs", qjs.Code(string(bundleSrc)), qjs.TypeModule())
	if err != nil {
		return nil, fmt.Errorf("compile bundle: %w", err)
	}
	return bc, nil
}

// bundleCacheKey returns the hex-encoded SHA256 of bundleCode mixed with the
// current binary's VCS revision. When the Go binary is rebuilt (e.g. after a
// QJS WASM upgrade), the revision changes and the cached bytecode is invalidated.
func bundleCacheKey(bundleCode []byte) string {
	h := sha256.New()
	h.Write(bundleCode)
	if info, ok := debug.ReadBuildInfo(); ok {
		for _, s := range info.Settings {
			if s.Key == "vcs.revision" {
				h.Write([]byte(s.Value))
				break
			}
		}
	}
	return hex.EncodeToString(h.Sum(nil))
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
// QuickJS bytecode. If precompiledBundle is non-nil it is used as-is, skipping
// the (expensive) bundle compilation step.
func compileBytecodes(ctx *qjs.Context, bundleSrc []byte, precompiledBundle []byte) (*bytecodeSet, error) {
	bcs := &bytecodeSet{}
	var err error

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

	if precompiledBundle != nil {
		bcs.bundle = precompiledBundle
	} else {
		bcs.bundle, err = ctx.Compile("ssr.mjs", qjs.Code(string(bundleSrc)), qjs.TypeModule())
		if err != nil {
			return nil, fmt.Errorf("compile bundle: %w", err)
		}
	}

	bcs.glue, err = ctx.Compile("glue.js", qjs.Code(glueJS))
	if err != nil {
		return nil, fmt.Errorf("compile glue: %w", err)
	}

	return bcs, nil
}
