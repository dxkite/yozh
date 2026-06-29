//go:build qjs

package jsruntime

import "fmt"

// CompileBundleBytecode compiles bundleSrc to raw QuickJS module bytecode.
// The output is the JS_WriteObject result — the same format written to bundle.bc.
// Polyfills and glue are NOT included.
func CompileBundleBytecode(bundleSrc []byte) ([]byte, error) {
	eng := &qjsEngine{}
	rt, err := eng.New()
	if err != nil {
		return nil, fmt.Errorf("qjs runtime: %w", err)
	}
	defer rt.Close()
	bc, err := rt.Ctx().Compile("entry.mjs", string(bundleSrc), EvalModule)
	if err != nil {
		return nil, fmt.Errorf("compile bundle: %w", err)
	}
	return bc, nil
}

// CompileBytecodes compiles polyfills and the ESM bundle to QuickJS bytecode.
// If precompiledBundle is non-nil it is used as-is, skipping bundle compilation.
func CompileBytecodes(ctx JSContext, bundleSrc []byte, precompiledBundle []byte) (*BytecodeSet, error) {
	bcs := &BytecodeSet{}
	var err error

	srcs := polyfillSources()
	bcs.Polyfills = make([]PolyfillEntry, 0, len(srcs))
	for _, p := range srcs {
		bc, err := ctx.Compile(p.name, p.src, EvalScript)
		if err != nil {
			return nil, fmt.Errorf("compile polyfill %s: %w", p.name, err)
		}
		bcs.Polyfills = append(bcs.Polyfills, PolyfillEntry{p.name, bc})
	}

	if precompiledBundle != nil {
		bcs.Bundle = precompiledBundle
	} else {
		bcs.Bundle, err = ctx.Compile("entry.mjs", string(bundleSrc), EvalModule)
		if err != nil {
			return nil, fmt.Errorf("compile bundle: %w", err)
		}
	}

	return bcs, nil
}
