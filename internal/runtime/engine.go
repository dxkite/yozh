package jsruntime

import "context"

// GoFunc is the host-function signature for both sync and async bridging.
type GoFunc func(ctx context.Context, args ...any) (any, error)

// EvalMode controls JS evaluation semantics.
type EvalMode uint8

const (
	EvalScript EvalMode = iota // plain global script
	EvalModule                  // ES module (static imports, export namespace)
	EvalAsync                   // script with top-level await (async IIFE)
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
)

// NewEngineForKind, ValidateEngineKind are defined in dispatch_stub.go.
