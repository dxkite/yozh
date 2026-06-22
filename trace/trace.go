package trace

import (
	"context"
	"fmt"
	"os"
	"sync"
	"time"
)

var enabled bool

// Enable turns on per-request span timing. Must be called before serving requests.
func Enable() { enabled = true }

type ctxKey struct{}

type span struct {
	name  string
	start time.Time
	end   time.Time
}

// JSCheckpoint is a named span recorded from JS, with explicit start and end times.
type JSCheckpoint struct {
	Name  string
	Start time.Time
	End   time.Time
}

type requestTrace struct {
	mu             sync.Mutex
	spans          []*span
	jsCheckpoints  []JSCheckpoint
}

// Span is the handle returned by Start. Call Stop to record the end time.
type Span struct {
	s *span
}

// Stop records the end time of the span. Safe to call on a no-op Span.
func (v *Span) Stop() {
	if v.s != nil {
		v.s.end = time.Now()
	}
}

// StopAt records a pre-captured end time. Use when the logical end of the span
// occurs in a different goroutine from the one calling trace.Print.
func (v *Span) StopAt(t time.Time) {
	if v.s != nil {
		v.s.end = t
	}
}

// NewContext injects a new RequestTrace into ctx when tracing is enabled.
// When disabled, returns ctx unchanged with no allocation.
func NewContext(ctx context.Context) context.Context {
	if !enabled {
		return ctx
	}
	return context.WithValue(ctx, ctxKey{}, &requestTrace{})
}

// Start begins a named span associated with the trace in ctx.
// Returns a no-op Span when ctx carries no trace (tracing disabled or NewContext not called).
func Start(ctx context.Context, name string) *Span {
	t, _ := ctx.Value(ctxKey{}).(*requestTrace)
	if t == nil {
		return &Span{}
	}
	s := &span{name: name, start: time.Now()}
	t.mu.Lock()
	t.spans = append(t.spans, s)
	t.mu.Unlock()
	return &Span{s: s}
}

// SetJSCheckpoints stores JS-side timestamps into the trace carried by ctx.
// They are printed as sub-entries under the js.eval span.
// Does nothing when ctx carries no trace.
func SetJSCheckpoints(ctx context.Context, points []JSCheckpoint) {
	t, _ := ctx.Value(ctxKey{}).(*requestTrace)
	if t == nil {
		return
	}
	t.mu.Lock()
	t.jsCheckpoints = points
	t.mu.Unlock()
}

// Print writes a timing summary for all spans in ctx to stderr.
// JS checkpoints (set via SetJSCheckpoints) are printed as sub-entries of js.eval.
// Does nothing when ctx carries no trace.
func Print(ctx context.Context, method, path string, status int) {
	t, _ := ctx.Value(ctxKey{}).(*requestTrace)
	if t == nil {
		return
	}
	t.mu.Lock()
	spans := t.spans
	jsCPs := t.jsCheckpoints
	t.mu.Unlock()
	if len(spans) == 0 {
		return
	}
	var total time.Duration
	first := spans[0].start
	last := spans[len(spans)-1].end
	if !last.IsZero() {
		total = last.Sub(first)
	}
	fmt.Fprintf(os.Stderr, "[%dms] %s %s %d\n", total.Milliseconds(), method, path, status)
	for _, s := range spans {
		var d time.Duration
		if !s.end.IsZero() {
			d = s.end.Sub(s.start)
		}
		fmt.Fprintf(os.Stderr, "  %-20s %dms\n", s.name, d.Milliseconds())
		if s.name == "js.eval" && len(jsCPs) > 0 {
			for _, cp := range jsCPs {
				fmt.Fprintf(os.Stderr, "    %-18s %dms\n", cp.Name, cp.End.Sub(cp.Start).Milliseconds())
			}
		}
	}
}
