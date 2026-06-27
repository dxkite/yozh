package trace

import (
	"context"
	"reflect"
	"time"
)

// JSCheckpoint is a named timing span recorded from JS, with explicit start and end times.
type JSCheckpoint struct {
	Name  string
	Start time.Time
	End   time.Time
}

// RequestTrace holds optional hooks called at key nodes during SSR request processing.
// All fields are optional; nil hooks are silently skipped.
// The design mirrors net/http/httptrace.ClientTrace: attach to a context via
// WithRequestTrace and retrieve via ContextRequestTrace.
//
// All timing hooks receive absolute start and end times so callers can construct
// waterfall charts. Compute duration as end.Sub(start).
type RequestTrace struct {
	// PoolWaiting is called when Pool.Get finds no idle runtime and is about to block.
	// Not called when a runtime is immediately available.
	PoolWaiting func()

	// PoolGetDone is called when a JS runtime has been checked out from the pool.
	PoolGetDone func(start, end time.Time)

	// WorkerFallback is called when the eval worker pool is saturated and the request
	// falls back to a temporary goroutine.
	WorkerFallback func()

	// GoCallDone is called when a Go→JS eval completes.
	// Called from the worker goroutine.
	GoCallDone func(start, end time.Time, err error)

	// JSCallDone is called when JS completes a call to a Go host function.
	// name is the registered JS function name (e.g. "__go_sendHeaders", "__go_fetchRaw").
	// May be called concurrently from multiple goroutines.
	JSCallDone func(name string, start, end time.Time, err error)

	// GotFirstResponseByte is called after HTTP status and headers have been written to the client.
	GotFirstResponseByte func()

	// ResponseDone is called when the full response body has been streamed to the client.
	ResponseDone func(start, end time.Time)

	// JSTailDone is called when the JS goroutine finishes after the last response byte.
	// start is when the final response write completed; end is when the runtime became idle.
	// Called from the worker goroutine; may overlap with the ResponseDone caller goroutine.
	JSTailDone func(start, end time.Time)

	// FetchDone is called after each outbound HTTP fetch initiated by JS.
	// status is 0 when err is non-nil.
	// May be called concurrently from multiple goroutines when JS issues parallel fetches.
	FetchDone func(method, path string, status int, start, end time.Time, err error)

	// JSCheckpointsDone is called once per JS-side checkpoint arriving via __go_endStream.
	// Checkpoints include "parse-request", "build-request", "ssr-handler", "collect-headers", "stream-response".
	// start and end are absolute wall-clock times, suitable for waterfall charts.
	// Called from the main goroutine in the sigDone path.
	JSCheckpointsDone func(name string, start, end time.Time)
}

type hookKey struct{}

// WithRequestTrace returns a copy of ctx with rt associated.
// If ctx already carries a RequestTrace the two are composed: both sets of
// hooks fire for each event (existing hooks fire first), mirroring the
// composition semantics of net/http/httptrace.WithClientTrace.
func WithRequestTrace(ctx context.Context, rt *RequestTrace) context.Context {
	rt.compose(ContextRequestTrace(ctx))
	return context.WithValue(ctx, hookKey{}, rt)
}

// ContextRequestTrace returns the RequestTrace associated with ctx, or nil.
func ContextRequestTrace(ctx context.Context) *RequestTrace {
	rt, _ := ctx.Value(hookKey{}).(*RequestTrace)
	return rt
}

// compose merges old into t so that, for any hook set in both, both fire
// (old first, t second). Uses reflect to stay DRY across all fields,
// identical to the approach in net/http/httptrace.
func (t *RequestTrace) compose(old *RequestTrace) {
	if old == nil {
		return
	}
	tv := reflect.ValueOf(t).Elem()
	ov := reflect.ValueOf(old).Elem()
	for i := range tv.NumField() {
		tf := tv.Field(i)
		if tf.Kind() != reflect.Func {
			continue
		}
		of := ov.Field(i)
		if of.IsNil() {
			continue
		}
		if tf.IsNil() {
			tf.Set(of)
			continue
		}
		// Both non-nil: capture underlying function values before overwriting the field.
		newFn := reflect.ValueOf(tf.Interface())
		oldFn := reflect.ValueOf(of.Interface())
		composed := reflect.MakeFunc(tf.Type(), func(args []reflect.Value) []reflect.Value {
			oldFn.Call(args)
			return newFn.Call(args)
		})
		tf.Set(composed)
	}
}
