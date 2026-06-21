package astroruntime

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

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
func HandleSSR(pool *Pool, w http.ResponseWriter, r *http.Request) {
	// Read request body (bounded to 10 MB)
	var bodyPtr *string
	if r.Body != nil && r.Method != http.MethodGet && r.Method != http.MethodHead {
		b, err := io.ReadAll(io.LimitReader(r.Body, 10<<20))
		if err == nil {
			s := string(b)
			bodyPtr = &s
		}
	}

	// Collect headers as [[k, v]] pairs
	headers := make([][2]string, 0, len(r.Header))
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

	// Double-encode: json.Marshal on a string produces a valid JS string literal
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		http.Error(w, "internal error: serialize request", http.StatusInternalServerError)
		return
	}
	jsLiteral, err := json.Marshal(string(payloadJSON))
	if err != nil {
		http.Error(w, "internal error: encode request", http.StatusInternalServerError)
		return
	}

	// Check out a QJS runtime from the pool.
	// defer order is LIFO: Put runs last (after meta is deleted) so no runtime
	// is returned to the pool with a stale responseMeta entry.
	rt, err := pool.Get()
	if err != nil {
		http.Error(w, "runtime pool exhausted", http.StatusServiceUnavailable)
		return
	}
	defer pool.Put(rt)
	defer loadAndDeleteResponseMeta(rt)

	ctx := rt.Context()

	// Call __handleRequest(requestJSON) with top-level await.
	// __handleRequest is an async function; FlagAsync makes Eval block until resolved.
	// The function stores status+headers via __go_storeResponseMeta and returns body directly.
	code := fmt.Sprintf("await __handleRequest(%s)", string(jsLiteral))
	resultVal, err := ctx.Eval("handle-request.js", qjs.Code(code), qjs.FlagAsync())
	if err != nil {
		http.Error(w, fmt.Sprintf("JS handler error: %v", err), http.StatusInternalServerError)
		return
	}
	defer resultVal.Free()

	// Retrieve status and headers stored by __go_storeResponseMeta.
	meta := loadAndDeleteResponseMeta(rt)
	var respHeaders [][2]string
	if meta.HeadersJSON != "" {
		json.Unmarshal([]byte(meta.HeadersJSON), &respHeaders)
	}

	// Write response headers
	for _, kv := range respHeaders {
		w.Header().Add(kv[0], kv[1])
	}
	w.WriteHeader(meta.Status)

	// Write response body (returned directly by __handleRequest, no JSON wrapper)
	if body := resultVal.String(); body != "" {
		fmt.Fprint(w, body)
	}
}

// fullURL reconstructs the full request URL from the http.Request.
// r.RequestURI is set by the HTTP server but empty for manually-created requests
// (e.g. in tests), so fall back to r.URL.RequestURI().
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
