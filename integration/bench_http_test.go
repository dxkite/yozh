package integration_test

import (
	"bufio"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
	"time"

	astroruntime "github.com/dxkite/astro-runtime"
)

// silenceSlog replaces the default slog handler with a discard handler for the duration
// of a benchmark, preventing log lines from corrupting benchmark output.
func silenceSlog(b *testing.B) {
	b.Helper()
	prev := slog.Default()
	noop := slog.New(slog.DiscardHandler)
	slog.SetDefault(noop)
	astroruntime.SetLogger(astroruntime.NewLogger(slog.DiscardHandler))
	b.Cleanup(func() {
		slog.SetDefault(prev)
		astroruntime.SetLogger(astroruntime.NewLogger(prev.Handler()))
	})
}

// ssrHTTPHandler wraps a Pool as an http.Handler for use with httptest.Server.
func ssrHTTPHandler(pool *astroruntime.Pool) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		rc, err := pool.RequestContext(w, r)
		if err != nil {
			http.Error(w, "pool exhausted", http.StatusServiceUnavailable)
			return
		}
		astroruntime.HandleRequest(rc)
	})
}

// hammperHTTP runs concurrent GET requests to base+path and reports via b.
func hammerHTTP(b *testing.B, base, path string) {
	b.Helper()
	target := base + path
	client := &http.Client{Transport: &http.Transport{MaxIdleConnsPerHost: 64}}
	// warmup: let JIT/pool settle before timing
	for range 3 {
		resp, _ := client.Get(target)
		if resp != nil {
			io.Copy(io.Discard, resp.Body)
			resp.Body.Close()
		}
	}
	b.ResetTimer()
	b.ReportAllocs()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			resp, err := client.Get(target)
			if err != nil {
				b.Errorf("GET %s: %v", target, err)
				continue
			}
			io.Copy(io.Discard, resp.Body)
			resp.Body.Close()
		}
	})
}

// startNodeServer launches benchmark/node_server.mjs and waits for the "ready:PORT" signal.
// The process is killed automatically when the benchmark ends.
func startNodeServer(b *testing.B, port string) string {
	b.Helper()
	// Tests run with CWD = integration/ package directory; go up one level to repo root.
	cwd, err := os.Getwd()
	if err != nil {
		b.Fatalf("getwd: %v", err)
	}
	repoRoot := filepath.Dir(cwd)
	serverScript := filepath.Join(repoRoot, "benchmark", "node_server.mjs")
	entryPath := filepath.Join(repoRoot, "examples", "example", ".netlify", "build", "entry.mjs")

	cmd := exec.Command("node", serverScript, "--port", port, "--entry", entryPath)
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		b.Fatalf("stdout pipe: %v", err)
	}
	if err := cmd.Start(); err != nil {
		b.Fatalf("start node: %v", err)
	}
	b.Cleanup(func() { _ = cmd.Process.Kill() })

	ready := make(chan struct{}, 1)
	go func() {
		sc := bufio.NewScanner(stdout)
		for sc.Scan() {
			if strings.HasPrefix(sc.Text(), "ready:") {
				ready <- struct{}{}
				return
			}
		}
	}()
	select {
	case <-ready:
	case <-time.After(15 * time.Second):
		b.Fatal("node server did not become ready within 15s")
	}
	return "http://localhost:" + port
}

// ── astro-runtime (Go + QuickJS) ─────────────────────────────────────────────

func BenchmarkHTTP_AstroRuntime_Home(b *testing.B) {
	silenceSlog(b)
	srv := httptest.NewServer(ssrHTTPHandler(sharedPool))
	b.Cleanup(srv.Close)
	hammerHTTP(b, srv.URL, "/")
}

func BenchmarkHTTP_AstroRuntime_API(b *testing.B) {
	silenceSlog(b)
	srv := httptest.NewServer(ssrHTTPHandler(sharedPool))
	b.Cleanup(srv.Close)
	hammerHTTP(b, srv.URL, "/api/products")
}

func BenchmarkHTTP_AstroRuntime_Dynamic(b *testing.B) {
	silenceSlog(b)
	srv := httptest.NewServer(ssrHTTPHandler(sharedPool))
	b.Cleanup(srv.Close)
	hammerHTTP(b, srv.URL, "/products/1")
}

// ── Node.js (V8) ──────────────────────────────────────────────────────────────

func BenchmarkHTTP_NodeJS_Home(b *testing.B) {
	if _, err := exec.LookPath("node"); err != nil {
		b.Skip("node not in PATH")
	}
	base := startNodeServer(b, "13091")
	hammerHTTP(b, base, "/")
}

func BenchmarkHTTP_NodeJS_API(b *testing.B) {
	if _, err := exec.LookPath("node"); err != nil {
		b.Skip("node not in PATH")
	}
	base := startNodeServer(b, "13092")
	hammerHTTP(b, base, "/api/products")
}

func BenchmarkHTTP_NodeJS_Dynamic(b *testing.B) {
	if _, err := exec.LookPath("node"); err != nil {
		b.Skip("node not in PATH")
	}
	base := startNodeServer(b, "13093")
	hammerHTTP(b, base, "/products/1")
}
