package yozh

import sobek "github.com/dxkite/yozh/pkg/sobek"

// Type aliases — public API unchanged; external callers see yozh.JSEngine etc.
type GoFunc        = sobek.GoFunc
type EvalMode      = sobek.EvalMode
type JSContext     = sobek.JSContext
type JSRuntime     = sobek.JSRuntime
type JSEngine      = sobek.JSEngine
type EngineKind    = sobek.EngineKind
const (
	EvalScript EvalMode = sobek.EvalScript
	EvalModule EvalMode = sobek.EvalModule
	EvalAsync  EvalMode = sobek.EvalAsync
)

const (
	EngineGoja EngineKind = sobek.EngineGoja
)

// ValidateEngineKind checks that the requested engine kind is available in this build.
func ValidateEngineKind(kind EngineKind) error {
	return sobek.ValidateEngineKind(kind)
}
