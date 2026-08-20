package yozh

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/dxkite/yozh/trace"
)

// spanLog is an internal RequestTrace that accumulates per-request timing for the ssr spans log.
// Fields written by the main goroutine (poolGet, jsEval, response) are safe-before fields written
// by the worker goroutine (jsTail) due to the tailCh channel happens-before guarantee.
type spanLog struct {
	evalStart time.Time
	poolGet   time.Duration
	jsEval    time.Duration // evalStart → GotFirstResponseByte
	response  time.Duration
	jsTail    time.Duration
	rt        *trace.RequestTrace
}

type spanLogEntry struct {
	Name string `json:"name"`
	Ms   int64  `json:"ms"`
}

func newSpanLog() *spanLog {
	sl := &spanLog{}
	sl.rt = &trace.RequestTrace{
		PoolGetDone:          func(start, end time.Time) { sl.poolGet = end.Sub(start) },
		GotFirstResponseByte: func() { sl.jsEval = time.Since(sl.evalStart) },
		ResponseDone:         func(start, end time.Time) { sl.response = end.Sub(start) },
		JSTailDone:           func(start, end time.Time) { sl.jsTail = end.Sub(start) },
	}
	return sl
}

// serverTimingEntry formats one Server-Timing metric as "name;dur=X.XXX".
func serverTimingEntry(name string, d time.Duration) string {
	return fmt.Sprintf("%s;dur=%.3f", name, float64(d.Nanoseconds())/1e6)
}

func (sl *spanLog) log(ctx context.Context) {
	entries := []spanLogEntry{
		{"pool.get", sl.poolGet.Milliseconds()},
		{"js.eval", sl.jsEval.Milliseconds()},
		{"response.write", sl.response.Milliseconds()},
	}
	if sl.jsTail > 0 {
		entries = append(entries, spanLogEntry{"js.tail", sl.jsTail.Milliseconds()})
	}
	rtlog.DebugContext(ctx, "ssr spans", "spans", entries)
}

// responseInfo carries response timing from the main goroutine to the worker goroutine
// after sigDone is received, enabling accurate js.tail measurement.
type responseInfo struct {
	doneAt time.Time
	status int
}

// RequestContext holds per-request state for a single SSR invocation.
// Obtain via Pool.RequestContext; it is automatically released after HandleRequest returns.
type RequestContext struct {
	pool      *Pool
	prt       *pooledRuntime
	goCtx     context.Context
	cancel    context.CancelFunc // non-nil when a per-request timeout was applied
	w         http.ResponseWriter
	r         *http.Request
	tailCh    chan responseInfo // buffer=1; worker blocks here until main confirms response timing
	requestAt time.Time        // when this request entered the handler, for latency calculation
	spanLog   *spanLog         // internal timing collector for ssr spans log
}

func (rc *RequestContext) release() {
	if rc.cancel != nil {
		rc.cancel()
	}
	rc.pool.Put(rc.prt)
}

// RequestContext creates a per-request execution context, checking out a pooled JS runtime.
// The caller MUST pass the returned *RequestContext to HandleRequest, which releases the runtime.
// Returns an error only if the pool is exhausted and cannot create a new runtime.
func (p *Pool) RequestContext(w http.ResponseWriter, r *http.Request) (*RequestContext, error) {
	now := time.Now()
	sl := newSpanLog()
	goCtx := trace.WithRequestTrace(r.Context(), sl.rt)
	goCtx = withRequestAttrs(goCtx,
		slog.String("method", r.Method),
		slog.String("path", r.URL.Path),
		slog.String("client_ip", clientIP(r)),
		slog.String("user_agent", r.Header.Get("User-Agent")),
	)

	// Apply per-request timeout if configured so Await() in the JS event loop
	// respects the deadline and releases the pool slot instead of looping forever.
	var cancel context.CancelFunc
	if p.requestTimeout > 0 {
		goCtx, cancel = context.WithTimeout(goCtx, p.requestTimeout)
	}

	poolGetStart := time.Now()
	prt, err := p.Get(goCtx)
	poolGetEnd := time.Now()
	if rt := trace.ContextRequestTrace(goCtx); rt != nil && rt.PoolGetDone != nil {
		rt.PoolGetDone(poolGetStart, poolGetEnd)
	}
	if err != nil {
		if cancel != nil {
			cancel()
		}
		return nil, err
	}
	return &RequestContext{
		pool:      p,
		prt:       prt,
		goCtx:     goCtx,
		cancel:    cancel,
		w:         w,
		r:         r,
		tailCh:    make(chan responseInfo, 1),
		requestAt: now,
		spanLog:   sl,
	}, nil
}

// NetlifyContext is the per-request context object passed to the JS SSR handler.
// Fields left zero-valued fall back to mock defaults in bootstrap.mjs.
type NetlifyContext struct {
	IP        string          `json:"ip,omitempty"`
	RequestID string          `json:"requestId,omitempty"`
	Geo       *NetlifyGeo     `json:"geo,omitempty"`
	Site      *NetlifySite    `json:"site,omitempty"`
	Deploy    *NetlifyDeploy  `json:"deploy,omitempty"`
	Account   *NetlifyAccount `json:"account,omitempty"`
	Server    *NetlifyServer  `json:"server,omitempty"`
}

// NetlifyGeo holds geographic metadata for the client request.
type NetlifyGeo struct {
	City        string            `json:"city,omitempty"`
	Country     *NetlifyGeoRegion `json:"country,omitempty"`
	Subdivision *NetlifyGeoRegion `json:"subdivision,omitempty"`
	Timezone    string            `json:"timezone,omitempty"`
	Longitude   float64           `json:"longitude,omitempty"`
	Latitude    float64           `json:"latitude,omitempty"`
}

// NetlifyGeoRegion holds a region code + human-readable name pair.
type NetlifyGeoRegion struct {
	Code string `json:"code"`
	Name string `json:"name"`
}

// NetlifySite holds site-level metadata available in the Netlify context.
type NetlifySite struct {
	ID   string `json:"id,omitempty"`
	Name string `json:"name,omitempty"`
	URL  string `json:"url,omitempty"`
}

// NetlifyDeploy holds deploy-level metadata available in the Netlify context.
type NetlifyDeploy struct {
	ID string `json:"id,omitempty"`
}

// NetlifyAccount holds account-level metadata available in the Netlify context.
type NetlifyAccount struct {
	ID string `json:"id,omitempty"`
}

// NetlifyServer holds server-level metadata available in the Netlify context.
type NetlifyServer struct {
	Region string `json:"region,omitempty"`
}

// requestPayload is the JSON shape passed to the JS __handleRequest function.
type requestPayload struct {
	Method  string          `json:"method"`
	URL     string          `json:"url"`
	Headers [][2]string     `json:"headers"`
	Body    *string         `json:"body"`
	Context *NetlifyContext `json:"context,omitempty"`
}

// clientIP extracts the real client IP from the request, preferring proxy headers.
func clientIP(r *http.Request) string {
	if v := r.Header.Get("X-Forwarded-For"); v != "" {
		return strings.SplitN(v, ",", 2)[0]
	}
	if v := r.Header.Get("X-Real-Ip"); v != "" {
		return v
	}
	host, _, _ := net.SplitHostPort(r.RemoteAddr)
	if host == "" {
		return r.RemoteAddr
	}
	return host
}

// HandleRequest processes one HTTP request through the SSR runtime held in rc.
//
// Eval runs in a worker goroutine. HandleRequest writes HTTP headers as soon as JS
// calls __go_sendHeaders, then streams body chunks to the client via __go_sendChunk
// as the Astro renderer emits them. After the stream ends the worker captures js.tail
// (time the JS runtime is held after the response body was fully sent), prints the
// complete trace, and returns rc to the pool.
func HandleRequest(rc *RequestContext) {
	r := rc.r
	w := rc.w
	goCtx := rc.goCtx

	// Read request body (bounded to 10 MB)
	var bodyPtr *string
	if r.Body != nil && r.Method != http.MethodGet && r.Method != http.MethodHead {
		b, err := io.ReadAll(io.LimitReader(r.Body, 10<<20))
		if err == nil {
			s := string(b)
			bodyPtr = &s
		}
	}

	// Collect headers as [[k, v]] pairs; count total values for exact capacity.
	nvals := 0
	for _, vals := range r.Header {
		nvals += len(vals)
	}
	headers := make([][2]string, 0, nvals)
	for name, vals := range r.Header {
		for _, v := range vals {
			headers = append(headers, [2]string{name, v})
		}
	}

	var netlifyCtx *NetlifyContext
	if rc.pool.contextProvider != nil {
		netlifyCtx = rc.pool.contextProvider(r)
	} else {
		netlifyCtx = &NetlifyContext{
			IP:        clientIP(r),
			RequestID: r.Header.Get("X-Request-Id"),
		}
	}

	payload := requestPayload{
		Method:  r.Method,
		URL:     fullURL(r),
		Headers: headers,
		Body:    bodyPtr,
		Context: netlifyCtx,
	}

	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		http.Error(w, "internal error: serialize request", http.StatusInternalServerError)
		rc.release()
		return
	}

	prt := rc.prt
	ctx := prt.rt.Ctx()
	code := "await __handleRequest(" + string(payloadJSON) + ")"

	// Allocate a fresh streaming channel for this request.
	// Buffer=8 allows JS to run a few chunks ahead without blocking on slow clients.
	prt.streamCh = make(chan ResponseSignal, 8)
	// Inject the per-request context into the JS context so host function callbacks
	// can access per-request log attrs and cancellation signals via ctx.Value / ctx.Done.
	ctx.SetContext(goCtx)
	ch := prt.streamCh // capture local reference

	rc.spanLog.evalStart = time.Now()

	// Dispatch Eval to the worker pool. The worker owns the runtime exclusively until
	// rc.release() is called. Falls back to a temporary goroutine if all workers are busy.
	rc.pool.submit(goCtx, func() {
		evalStart := rc.spanLog.evalStart
		evalErr := ctx.Eval("handle-request.js", code, EvalAsync)
		evalEnd := time.Now()
		if rt := trace.ContextRequestTrace(rc.goCtx); rt != nil && rt.GoCallDone != nil {
			rt.GoCallDone(evalStart, evalEnd, evalErr)
		}

		// If __go_sendHeaders was never called (JS error before response), signal error
		// so the handler is not blocked forever.
		if evalErr != nil {
			select {
			case ch <- ResponseSignal{Kind: sigError, Err: evalErr}:
			default:
			}
		}

		runtimeDoneAt := time.Now()
		close(ch)            // unblock main's drain loops before blocking on tailCh
		info := <-rc.tailCh // wait for main to deliver response timing

		if !info.doneAt.IsZero() && runtimeDoneAt.After(info.doneAt) {
			if rt := trace.ContextRequestTrace(rc.goCtx); rt != nil && rt.JSTailDone != nil {
				rt.JSTailDone(info.doneAt, runtimeDoneAt)
			}
		}

		latency := runtimeDoneAt.Sub(rc.requestAt).Seconds()
		if !info.doneAt.IsZero() {
			latency = info.doneAt.Sub(rc.requestAt).Seconds()
		}
		sl := rc.spanLog
		rtlog.InfoContext(rc.goCtx, "ssr request",
			"status", info.status,
			"latency", latency,
			slog.Group("runtime",
				"pool_get_ms", sl.poolGet.Milliseconds(),
				"js_eval_ms", sl.jsEval.Milliseconds(),
				"response_write_ms", sl.response.Milliseconds(),
				"js_tail_ms", sl.jsTail.Milliseconds(),
			),
		)
		sl.log(rc.goCtx)
		rc.release()
	})

	// Wait for the header signal (JS has response status and headers ready).
	sig, ok := <-ch
	if !ok || sig.Kind == sigError || sig.Err != nil {
		err := sig.Err
		if !ok {
			err = fmt.Errorf("JS handler closed stream without sending headers")
		}
		http.Error(w, fmt.Sprintf("JS handler error: %v", err), http.StatusInternalServerError)
		for range ch {}
		rc.tailCh <- responseInfo{}
		return
	}

	var respHeaders [][2]string
	if sig.Meta.HeadersJSON != "" {
		if err := json.Unmarshal([]byte(sig.Meta.HeadersJSON), &respHeaders); err != nil {
			rtlog.WarnContext(goCtx, "response headers JSON invalid — headers dropped", "err", err)
		}
	}
	for _, kv := range respHeaders {
		w.Header().Add(kv[0], kv[1])
	}
	savedStatus := sig.Meta.Status
	// Fire GotFirstResponseByte before WriteHeader so sl.jsEval is set when we build Server-Timing.
	if rt := trace.ContextRequestTrace(goCtx); rt != nil && rt.GotFirstResponseByte != nil {
		rt.GotFirstResponseByte()
	}
	sl := rc.spanLog
	w.Header().Add("Server-Timing", strings.Join([]string{
		serverTimingEntry("pool", sl.poolGet),
		serverTimingEntry("js", sl.jsEval),
	}, ", "))
	w.WriteHeader(savedStatus)
	flusher, canFlush := w.(http.Flusher)

	responseStart := time.Now()
readLoop:
	for {
		select {
		case <-goCtx.Done():
			// Request timed out or client disconnected before stream finished.
			rtlog.WarnContext(goCtx, "chunked response interrupted", "cause", context.Cause(goCtx))
			for range ch {}
			rc.tailCh <- responseInfo{}
			return
		case sig, ok = <-ch:
			if !ok {
				break readLoop
			}
		}
		switch sig.Kind {
		case sigChunk:
			if _, werr := w.Write(sig.Chunk); werr != nil {
				rtlog.ErrorContext(goCtx, "chunked write failed", "err", werr)
				for range ch {}
				rc.tailCh <- responseInfo{}
				return
			}
			if canFlush {
				flusher.Flush()
			}
		case sigDone:
			doneAt := time.Now()
			if rt := trace.ContextRequestTrace(goCtx); rt != nil {
				if rt.ResponseDone != nil {
					rt.ResponseDone(responseStart, doneAt)
				}
				if rt.JSCheckpointsDone != nil {
					for _, cp := range sig.JSCheckpoints {
						rt.JSCheckpointsDone(cp.Name, cp.Start, cp.End)
					}
				}
			}
			// Trailer: JS checkpoints (stream mode only; buffer mode injects them in initial headers).
			// Only ssr and resp are exposed; other spans are tracked internally but not sent.
			var trailerParts []string
			for _, cp := range sig.JSCheckpoints {
				if cp.Name == "ssr" || cp.Name == "resp" {
					trailerParts = append(trailerParts, serverTimingEntry(cp.Name, cp.End.Sub(cp.Start)))
				}
			}
			if len(trailerParts) > 0 {
				w.Header().Set(http.TrailerPrefix+"Server-Timing", strings.Join(trailerParts, ", "))
			}
			for range ch {}
			rc.tailCh <- responseInfo{doneAt: doneAt, status: savedStatus}
			return
		case sigError:
			rtlog.ErrorContext(goCtx, "mid-stream JS error", "err", sig.Err)
			for range ch {}
			rc.tailCh <- responseInfo{}
			return
		}
	}
	// Channel closed without sigDone — JS threw mid-stream without calling endStream.
	rtlog.WarnContext(goCtx, "response channel closed without sigDone")
	rc.tailCh <- responseInfo{}
}

// fullURL reconstructs the full request URL from the http.Request.
func fullURL(r *http.Request) string {
	scheme := "http"
	if r.TLS != nil || r.Header.Get("x-forwarded-proto") == "https" {
		scheme = "https"
	}
	host := r.Host
	if host == "" {
		host = "localhost"
	}
	uri := r.RequestURI
	if uri == "" {
		uri = r.URL.RequestURI()
	}
	return fmt.Sprintf("%s://%s%s", scheme, host, uri)
}
