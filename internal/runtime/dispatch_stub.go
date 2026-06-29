package jsruntime

import "fmt"

const defaultEngineKind = EngineGoja

// NewEngineForKind returns the JSEngine for the given kind.
func NewEngineForKind(kind EngineKind, _, _, _, _ int) JSEngine {
	return &gojaEngine{}
}

// DefaultEngineKind returns the engine kind selected when no explicit kind is requested.
func DefaultEngineKind() EngineKind { return defaultEngineKind }

// ValidateEngineKind checks that the requested engine kind is available in this build.
func ValidateEngineKind(kind EngineKind) error {
	if kind == EngineGoja || kind == "" {
		return nil
	}
	return fmt.Errorf("unknown engine %q; valid: goja", kind)
}
