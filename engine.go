package astroruntime

import jsruntime "github.com/dxkite/astro-runtime/internal/runtime"

// Type aliases — public API unchanged; external callers see astroruntime.JSEngine etc.
type GoFunc     = jsruntime.GoFunc
type EvalMode   = jsruntime.EvalMode
type JSContext  = jsruntime.JSContext
type JSRuntime  = jsruntime.JSRuntime
type JSEngine   = jsruntime.JSEngine
type EngineKind = jsruntime.EngineKind

const (
	EvalScript EvalMode = jsruntime.EvalScript
	EvalModule EvalMode = jsruntime.EvalModule
	EvalAsync  EvalMode = jsruntime.EvalAsync
)

const (
	EngineGoja EngineKind = jsruntime.EngineGoja
)

// ValidateEngineKind checks that the requested engine kind is available in this build.
func ValidateEngineKind(kind EngineKind) error {
	return jsruntime.ValidateEngineKind(kind)
}
