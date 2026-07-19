package sobek

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

var fetchClient = &http.Client{Timeout: 30 * time.Second}

const defaultFetchBodyLimit = 10 << 20 // 10 MiB

// goFetch performs a real HTTP request from Go and returns the response as JSON.
// ctx carries the per-request deadline; fetchClient.Timeout acts as a hard upper bound.
// bodyLimit caps the response body read; 0 means defaultFetchBodyLimit.
func goFetch(ctx context.Context, urlStr, method, headersJSON, body string, bodyLimit int64) (string, int, error) {
	var bodyReader io.Reader
	if body != "" {
		bodyReader = strings.NewReader(body)
	}

	req, err := http.NewRequestWithContext(ctx, method, urlStr, bodyReader)
	if err != nil {
		return "", 0, fmt.Errorf("fetch: create request: %w", err)
	}

	var headers map[string]string
	if err := json.Unmarshal([]byte(headersJSON), &headers); err == nil {
		for k, v := range headers {
			req.Header.Set(k, v)
		}
	}

	resp, err := fetchClient.Do(req)
	if err != nil {
		return "", 0, fmt.Errorf("fetch: %w", err)
	}
	defer resp.Body.Close()

	limit := bodyLimit
	if limit <= 0 {
		limit = defaultFetchBodyLimit
	}
	respBody, err := io.ReadAll(io.LimitReader(resp.Body, limit))
	if err != nil {
		return "", 0, fmt.Errorf("fetch: read body: %w", err)
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
	return string(result), resp.StatusCode, nil
}
