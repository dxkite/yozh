package astroruntime

import (
	"fmt"

	"github.com/dxkite/qjs"
)

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
