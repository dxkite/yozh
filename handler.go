package astroruntime

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/dxkite/astro-runtime/trace"
	"github.com/dxkite/qjs"
)


// requestPayload is the JSON shape passed to the JS __handleRequest function.
type requestPayload struct {
	Method  string      `json:"method"`
	URL     string      `json:"url"`
	Headers [][2]string `json:"headers"`
	Body    *string     `json:"body"`
	Context any         `json:"context,omitempty"`
}

// HandleSSR processes one HTTP request through the QJS SSR runtime.
//
// Eval runs in a worker goroutine. HandleSSR writes HTTP headers as soon as JS
// calls __go_sendHeaders (~0.7s), then streams body chunks to the client via
// __go_sendChunk as the Astro renderer emits them. The goroutine continues
// draining the QJS microtask queue (~2.9s) after the stream ends and returns
// the runtime to the pool when done.
func HandleSSR(pool *Pool, w http.ResponseWriter, r *http.Request) {
	goCtx := trace.NewContext(r.Context())

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

	payload := requestPayload{
		Method:  r.Method,
		URL:     fullURL(r),
		Headers: headers,
		Body:    bodyPtr,
	}

	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		http.Error(w, "internal error: serialize request", http.StatusInternalServerError)
		return
	}

	sp := trace.Start(goCtx, "pool.get")
	prt, err := pool.Get()
	sp.Stop()
	if err != nil {
		http.Error(w, "runtime pool exhausted", http.StatusServiceUnavailable)
		return
	}

	ctx := prt.rt.Context()
	code := "await __handleRequest(" + string(payloadJSON) + ")"

	sp = trace.Start(goCtx, "js.eval")

	// Allocate a fresh streaming channel for this request.
	// Buffer=8 allows JS to run a few chunks ahead without blocking on slow clients.
	prt.streamCh = make(chan ResponseSignal, 8)
	ch := prt.streamCh // capture local reference; safe after pool.Put may reuse prt

	urlPath := r.URL.Path

	// Dispatch Eval to the worker pool. The worker owns the runtime exclusively until
	// pool.Put is called. Falls back to a temporary goroutine if all workers are busy.
	pool.submit(func() {
		resultVal, evalErr := ctx.Eval("handle-request.js", qjs.Code(code), qjs.FlagAsync())

		if resultVal != nil {
			resultVal.Free()
		}

		// If __go_sendHeaders was never called (JS error before response), signal error
		// so HandleSSR is not blocked forever.
		if evalErr != nil {
			select {
			case ch <- ResponseSignal{Kind: sigError, Err: evalErr}:
			default:
			}
		}

		runtimeDoneAt := time.Now()
		if ns := prt.responseDoneNs.Swap(0); ns != 0 {
			gap := runtimeDoneAt.Sub(time.Unix(0, ns))
			log.Printf("[timing] %s runtime.done - response.done = %v", urlPath, gap)
		}

		// Always close channel so the handler's range loop exits even on mid-stream errors.
		close(ch)
		pool.Put(prt)
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
		// Drain any remaining signals so the worker goroutine is unblocked.
		for range ch {
		}
		return
	}

	var respHeaders [][2]string
	if sig.Meta.HeadersJSON != "" {
		json.Unmarshal([]byte(sig.Meta.HeadersJSON), &respHeaders)
	}
	for _, kv := range respHeaders {
		w.Header().Add(kv[0], kv[1])
	}
	w.WriteHeader(sig.Meta.Status)
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
			trace.Print(goCtx, r.Method, r.URL.Path, sig.Meta.Status)
			prt.responseDoneNs.Store(time.Now().UnixNano())
			// Drain any remaining signals after sigDone (channel close follows).
			for range ch {
			}
			return
		case sigError:
			log.Printf("mid-stream JS error: %v", sig.Err)
			sp2.Stop()
			for range ch {
			}
			return
		}
	}
	// Channel closed without sigDone (e.g., JS threw mid-stream without endStream).
	sp2.Stop()
	trace.Print(goCtx, r.Method, r.URL.Path, sig.Meta.Status)
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
