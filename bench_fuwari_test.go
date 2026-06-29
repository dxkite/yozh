package astroruntime

import (
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"runtime"
	"testing"
)

const (
	fuwariGojaPackPath = "../clomery/templates/fuwari.pack"
	fuwariAPIBaseURL   = "http://localhost:8080"
)

// BenchmarkFuwari_Goja_Homepage benchmarks the fuwari homepage SSR using the goja engine.
// Requires: clomery Docker stack running at localhost:8080 (provides the API backend).
// Pack: ../clomery/templates/fuwari.pack (goja format, built with `build --pack`).
func BenchmarkFuwari_Goja_Homepage(b *testing.B) {
	benchFuwariHomepage(b, fuwariGojaPackPath)
}

func benchFuwariHomepage(b *testing.B, packPath string) {
	b.Helper()
	// suppress JSON log lines from polluting benchmark output
	prev := rtlog
	SetLogger(NewLogger(slog.DiscardHandler))
	b.Cleanup(func() { SetLogger(prev) })

	packData, err := os.ReadFile(packPath)
	if err != nil {
		b.Skipf("pack not found (%s): %v — run `make pack` first", packPath, err)
	}

	pc, err := openPackContentsInMemory(packData)
	if err != nil {
		b.Fatalf("open pack: %v", err)
	}

	if len(pc.gojaCode) == 0 {
		b.Fatal("pack missing bundle.mjs")
	}
	var poolOpts []PoolOption
	poolOpts = append(poolOpts, WithGojaBundle(pc.gojaCode))
	poolOpts = append(poolOpts,
		WithEnv(map[string]string{"API_BASE_URL": fuwariAPIBaseURL}),
		WithSize(runtime.NumCPU()),
	)

	pool, err := NewPool(nil, poolOpts...)
	if err != nil {
		b.Fatalf("NewPool: %v", err)
	}
	defer pool.Close()

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		rc, err := pool.RequestContext(w, r)
		if err != nil {
			http.Error(w, "pool exhausted", http.StatusServiceUnavailable)
			return
		}
		HandleRequest(rc)
	}))
	defer srv.Close()

	client := &http.Client{Transport: &http.Transport{MaxIdleConnsPerHost: 128}}

	// warmup: let the engine JIT settle before timing
	for range 5 {
		resp, _ := client.Get(srv.URL + "/")
		if resp != nil {
			io.Copy(io.Discard, resp.Body)
			resp.Body.Close()
		}
	}

	b.ResetTimer()
	b.ReportAllocs()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			resp, err := client.Get(srv.URL + "/")
			if err != nil {
				b.Errorf("GET /: %v", err)
				continue
			}
			io.Copy(io.Discard, resp.Body)
			resp.Body.Close()
		}
	})
}
