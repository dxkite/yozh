package astroruntime

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/dxkite/astro-runtime/trace"
	"github.com/dxkite/qjs"
)

// responseInfo carries response timing from the main goroutine to the worker goroutine
// after sigDone is received, enabling accurate js.tail measurement.
type responseInfo struct {
	doneAt time.Time
	status int
}

// RequestContext holds per-request state for a single SSR invocation.
// Obtain via Pool.RequestContext; it is automatically released after HandleRequest returns.
type RequestContext struct {
	pool   *Pool
	prt    *pooledRuntime
	goCtx  context.Context
	w      http.ResponseWriter
	r      *http.Request
	tailCh chan responseInfo // buffer=1; worker blocks here until main confirms response timing
}

func (rc *RequestContext) release() { rc.pool.Put(rc.prt) }

// RequestContext creates a per-request execution context, checking out a pooled QJS runtime.
// The caller MUST pass the returned *RequestContext to HandleRequest, which releases the runtime.
// Returns an error only if the pool is exhausted and cannot create a new runtime.
func (p *Pool) RequestContext(w http.ResponseWriter, r *http.Request) (*RequestContext, error) {
	goCtx := trace.NewContext(r.Context())
	sp := trace.Start(goCtx, "pool.get")
	prt, err := p.Get()
	sp.Stop()
	if err != nil {
		return nil, err
	}
	return &RequestContext{
		pool:   p,
		prt:    prt,
		goCtx:  goCtx,
		w:      w,
		r:      r,
		tailCh: make(chan responseInfo, 1),
	}, nil
}

// NetlifyContext is the per-request context object passed to the JS SSR handler.
// Fields left zero-valued fall back to mock defaults in glue.js.
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

// HandleRequest processes one HTTP request through the QJS SSR runtime held in rc.
//
// Eval runs in a worker goroutine. HandleRequest writes HTTP headers as soon as JS
// calls __go_sendHeaders, then streams body chunks to the client via __go_sendChunk
// as the Astro renderer emits them. After the stream ends the worker captures js.tail
// (time the QJS runtime is held after the response body was fully sent), prints the
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
	ctx := prt.rt.Context()
	code := "await __handleRequest(" + string(payloadJSON) + ")"

	sp := trace.Start(goCtx, "js.eval")

	// Allocate a fresh streaming channel for this request.
	// Buffer=8 allows JS to run a few chunks ahead without blocking on slow clients.
	prt.streamCh = make(chan ResponseSignal, 8)
	ch := prt.streamCh // capture local reference

	// Dispatch Eval to the worker pool. The worker owns the runtime exclusively until
	// rc.release() is called. Falls back to a temporary goroutine if all workers are busy.
	rc.pool.submit(func() {
		resultVal, evalErr := ctx.Eval("handle-request.js", qjs.Code(code), qjs.FlagAsync())

		if resultVal != nil {
			resultVal.Free()
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

		if !info.doneAt.IsZero() {
			if tail := runtimeDoneAt.Sub(info.doneAt); tail > 0 {
				sp := trace.StartAt(rc.goCtx, "js.tail", info.doneAt)
				sp.StopAt(runtimeDoneAt)
			}
		}
		trace.Print(rc.goCtx, r.Method, r.URL.Path, info.status)
		rc.release()
	})

	// Wait for the header signal (JS has response status and headers ready).
	sig, ok := <-ch
	sp.StopAt(sig.BodyTime)
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
		json.Unmarshal([]byte(sig.Meta.HeadersJSON), &respHeaders)
	}
	for _, kv := range respHeaders {
		w.Header().Add(kv[0], kv[1])
	}
	savedStatus := sig.Meta.Status
	w.WriteHeader(savedStatus)
	flusher, canFlush := w.(http.Flusher)

	sp2 := trace.Start(goCtx, "response.write")
	for sig = range ch {
		switch sig.Kind {
		case sigChunk:
			w.Write(sig.Chunk)
			if canFlush {
				flusher.Flush()
			}
		case sigDone:
			trace.SetJSCheckpoints(goCtx, sig.JSCheckpoints)
			sp2.Stop()
			doneAt := time.Now()
			for range ch {}
			rc.tailCh <- responseInfo{doneAt: doneAt, status: savedStatus}
			return
		case sigError:
			log.Printf("mid-stream JS error: %v", sig.Err)
			sp2.Stop()
			for range ch {}
			rc.tailCh <- responseInfo{}
			return
		}
	}
	// Channel closed without sigDone (e.g., JS threw mid-stream without endStream).
	sp2.Stop()
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
