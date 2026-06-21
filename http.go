package astroruntime

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// fetchClient is a shared HTTP client used by both the JS fetch() polyfill and
// the image CDN handler. A 30-second timeout prevents goroutine leaks on hung upstreams.
var fetchClient = &http.Client{Timeout: 30 * time.Second}

// goFetch performs a real HTTP request from Go and returns the response as JSON.
// Called by the __go_fetchRaw host function registered in runtime.go.
func goFetch(urlStr, method, headersJSON, body string) (string, error) {
	var bodyReader io.Reader
	if body != "" {
		bodyReader = strings.NewReader(body)
	}

	req, err := http.NewRequest(method, urlStr, bodyReader)
	if err != nil {
		return "", fmt.Errorf("fetch: create request: %w", err)
	}

	var headers map[string]string
	if err := json.Unmarshal([]byte(headersJSON), &headers); err == nil {
		for k, v := range headers {
			req.Header.Set(k, v)
		}
	}

	resp, err := fetchClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("fetch: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(io.LimitReader(resp.Body, 10<<20))
	if err != nil {
		return "", fmt.Errorf("fetch: read body: %w", err)
	}

	respHeaders := make([][2]string, 0, len(resp.Header))
	for k, vals := range resp.Header {
		for _, v := range vals {
			respHeaders = append(respHeaders, [2]string{k, v})
		}
	}

	result, _ := json.Marshal(map[string]any{
		"status":  resp.StatusCode,
		"headers": respHeaders,
		"body":    string(respBody),
	})
	return string(result), nil
}
