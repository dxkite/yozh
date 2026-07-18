package jsruntime

import (
	"context"
	"fmt"
)

// GoFunc is the host-function signature for both sync and async bridging.
type GoFunc func(ctx context.Context, args ...any) (any, error)

// EvalMode controls JS evaluation semantics.
type EvalMode uint8

const (
	EvalScript EvalMode = iota // plain global script
	EvalModule                  // ES module (static imports, export namespace)
	EvalAsync                   // script with top-level await (goja: async IIFE)
)

// JSContext is the engine-agnostic JS execution surface.
type JSContext interface {
	context.Context
	SetContext(ctx context.Context)
	Eval(filename, src string, mode EvalMode) error
	SetGoFunc(name string, fn GoFunc)
	SetGoAsyncFunc(name string, fn GoFunc)
}

// JSRuntime is an isolated JS heap / execution context pair.
type JSRuntime interface {
	Ctx() JSContext
	Close()
}

// JSEngine is the factory that creates isolated JS runtimes.
type JSEngine interface {
	New() (JSRuntime, error)
}

// EngineKind is a convenience constant for engine selection.
type EngineKind string

const (
	// EngineGoja selects the pure-Go sobek (grafana/sobek) JS engine.
	EngineGoja EngineKind = "goja"

	defaultEngineKind = EngineGoja
)

// NewEngineForKind returns the JSEngine for the given kind. goja is the only
// supported engine; any kind value resolves to it.
func NewEngineForKind(kind EngineKind) JSEngine {
	return &gojaEngine{}
}

// DefaultEngineKind returns the engine kind selected when no explicit kind is requested.
func DefaultEngineKind() EngineKind { return defaultEngineKind }

// ValidateEngineKind checks that the requested engine kind is available in this build.
func ValidateEngineKind(kind EngineKind) error {
	if kind == "" || kind == EngineGoja {
		return nil
	}
	return fmt.Errorf("unknown engine %q; valid: goja", kind)
}
