//go:build !qjs

package jsruntime

import "fmt"

const (
	// EngineQJS is defined for API compatibility; selecting it without the qjs build tag returns an error.
	EngineQJS EngineKind = "qjs"

	defaultEngineKind = EngineGoja
)

// NewEngineForKind returns the JSEngine for the given kind.
// Without the qjs build tag only EngineGoja is available.
// QJS-specific parameters (memoryLimit etc.) are silently ignored.
func NewEngineForKind(kind EngineKind, _, _, _, _ int) JSEngine {
	switch kind {
	case EngineGoja:
		return &gojaEngine{}
	default:
		return &gojaEngine{}
	}
}

// DefaultEngineKind returns the engine kind selected when no explicit kind is requested.
func DefaultEngineKind() EngineKind { return defaultEngineKind }

// ValidateEngineKind checks that the requested engine kind is available in this build.
func ValidateEngineKind(kind EngineKind) error {
	if kind == EngineQJS {
		return fmt.Errorf("QJS engine not compiled; rebuild with: go build -tags qjs")
	}
	if kind == EngineGoja || kind == "" {
		return nil
	}
	return fmt.Errorf("unknown engine %q; valid: goja (qjs requires -tags qjs)", kind)
}
