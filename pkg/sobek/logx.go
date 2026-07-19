package sobek

import (
	"context"
	"log/slog"
	"os"
)

type logAttrsKey struct{}

// WithRequestAttrs stores per-request slog attributes in ctx.
func WithRequestAttrs(ctx context.Context, attrs ...slog.Attr) context.Context {
	return context.WithValue(ctx, logAttrsKey{}, attrs)
}

// ctxHandler wraps a slog.Handler and injects per-request attributes from ctx.
type ctxHandler struct{ slog.Handler }

func (h ctxHandler) Handle(ctx context.Context, r slog.Record) error {
	if attrs, ok := ctx.Value(logAttrsKey{}).([]slog.Attr); ok {
		r.AddAttrs(attrs...)
	}
	return h.Handler.Handle(ctx, r)
}

func (h ctxHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	return ctxHandler{h.Handler.WithAttrs(attrs)}
}

func (h ctxHandler) WithGroup(name string) slog.Handler {
	return ctxHandler{h.Handler.WithGroup(name)}
}

// rtlog is the package-level structured logger. Defaults to JSON on stderr.
var rtlog = slog.New(ctxHandler{
	slog.NewJSONHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelInfo}),
})

// NewLogger wraps h with the runtime's per-request context handler.
func NewLogger(h slog.Handler) *slog.Logger {
	return slog.New(ctxHandler{h})
}

// SetLogger replaces the runtime's structured logger.
func SetLogger(l *slog.Logger) { rtlog = l }

// Log returns the current package-level logger for use in root package files.
func Log() *slog.Logger { return rtlog }
