package astroruntime

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

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

// responsePayload is the JSON shape returned by the JS __handleRequest function.
type responsePayload struct {
	Status  int         `json:"status"`
	Headers [][2]string `json:"headers"`
	Body    string      `json:"body"`
}

// HandleSSR processes one HTTP request through the QJS SSR runtime.
func HandleSSR(pool *Pool, w http.ResponseWriter, r *http.Request) {
	// Only cache safe, idempotent GET/HEAD requests with no body.
	cacheKey := ""
	if r.Method == http.MethodGet || r.Method == http.MethodHead {
		cacheKey = r.URL.RequestURI()
		if hit := cacheGet(cacheKey); hit != nil {
			for _, kv := range hit.headers {
				w.Header().Add(kv[0], kv[1])
			}
			w.Header().Set("X-Cache", "HIT")
			w.WriteHeader(hit.status)
			if r.Method != http.MethodHead && hit.body != "" {
				fmt.Fprint(w, hit.body)
			}
			return
		}
	}

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

	// Check out a QJS runtime from the pool
	rt, err := pool.Get()
	if err != nil {
		http.Error(w, "runtime pool exhausted", http.StatusServiceUnavailable)
		return
	}
	defer pool.Put(rt)

	ctx := rt.Context()

	// Call __handleRequest(requestJSON) with top-level await.
	// __handleRequest is an async function; FlagAsync makes Eval block until resolved.
	code := fmt.Sprintf("await __handleRequest(%s)", string(jsLiteral))
	resultVal, err := ctx.Eval("handle-request.js", qjs.Code(code), qjs.FlagAsync())
	if err != nil {
		http.Error(w, fmt.Sprintf("JS handler error: %v", err), http.StatusInternalServerError)
		return
	}
	defer resultVal.Free()

	// Parse the JSON response from JS
	var resp responsePayload
	if err := json.Unmarshal([]byte(resultVal.String()), &resp); err != nil {
		http.Error(w, fmt.Sprintf("invalid JS response: %v", err), http.StatusInternalServerError)
		return
	}

	// Store in cache for GET/HEAD 2xx responses
	if cacheKey != "" && resp.Status >= 200 && resp.Status < 300 {
		cachePut(cacheKey, &cachedResponse{
			status:  resp.Status,
			headers: resp.Headers,
			body:    resp.Body,
			at:      time.Now(),
		})
	}

	// Write response headers
	for _, kv := range resp.Headers {
		w.Header().Add(kv[0], kv[1])
	}
	w.WriteHeader(resp.Status)

	// Write response body
	if resp.Body != "" {
		fmt.Fprint(w, resp.Body)
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
