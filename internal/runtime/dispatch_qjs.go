//go:build qjs

package jsruntime

import "fmt"

const (
	// EngineQJS selects the QuickJS/WASM engine (requires -tags qjs at build time).
	EngineQJS EngineKind = "qjs"

	defaultEngineKind = EngineQJS
)

// NewEngineForKind returns the JSEngine for the given kind.
// memoryLimit, maxStackSize, maxExecutionTime, gcThreshold are QJS-specific options.
func NewEngineForKind(kind EngineKind, memoryLimit, maxStackSize, maxExecutionTime, gcThreshold int) JSEngine {
	opt := qjsEngineOpt{
		MemoryLimit:      memoryLimit,
		MaxStackSize:     maxStackSize,
		MaxExecutionTime: maxExecutionTime,
		GCThreshold:      gcThreshold,
	}
	switch kind {
	case EngineGoja:
		return &gojaEngine{}
	default:
		return &qjsEngine{opt: opt}
	}
}

// DefaultEngineKind returns the engine kind selected when no explicit kind is requested.
func DefaultEngineKind() EngineKind { return defaultEngineKind }

// ValidateEngineKind checks that the requested engine kind is available in this build.
func ValidateEngineKind(kind EngineKind) error {
	switch kind {
	case EngineGoja, EngineQJS:
		return nil
	default:
		return fmt.Errorf("unknown engine %q; valid: goja, qjs", kind)
	}
}
