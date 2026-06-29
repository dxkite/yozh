package astroruntime

import (
	"context"
	"log/slog"

	jsruntime "github.com/dxkite/astro-runtime/internal/runtime"
)

// rtlog is the package-level logger for use within the root package.
// Updated in sync with the internal/runtime logger via SetLogger.
var rtlog = jsruntime.Log()

// withRequestAttrs stores per-request slog attributes in ctx for use by ctxHandler.
func withRequestAttrs(ctx context.Context, attrs ...slog.Attr) context.Context {
	return jsruntime.WithRequestAttrs(ctx, attrs...)
}

// NewLogger wraps h with the runtime's per-request context handler.
func NewLogger(h slog.Handler) *slog.Logger {
	return jsruntime.NewLogger(h)
}

// SetLogger replaces the runtime's structured logger. Call before serving requests.
func SetLogger(l *slog.Logger) {
	jsruntime.SetLogger(l)
	rtlog = l
}
