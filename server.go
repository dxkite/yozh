package astroruntime

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"runtime/debug"
	"strings"
)

// StartServer starts the HTTP server.
// Routing priority matches Netlify's preferStatic: true behaviour:
//  1. Exact static file in distDir → serve directly
//  2. distDir/<path>/index.html exists → serve it
//  3. Fallback → SSR handler (QJS)
func StartServer(pool *Pool, distDir, addr string) error {
	mux := http.NewServeMux()
	mux.HandleFunc("/.netlify/images", func(w http.ResponseWriter, r *http.Request) {
		HandleImageCDN(distDir, w, r)
	})
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if v := recover(); v != nil {
				log.Printf("panic: %v\n%s", v, debug.Stack())
				http.Error(w, fmt.Sprintf("internal server error: %v", v), http.StatusInternalServerError)
			}
		}()
		// path.Clean keeps forward slashes (safe on all OS); strip leading slash
		// so filepath.Join treats it as relative and never overrides distDir.
		urlPath := path.Clean(r.URL.Path)
		rel := strings.TrimLeft(urlPath, "/")
		if served := tryStatic(w, r, distDir, rel, urlPath); served {
			return
		}
		HandleSSR(pool, w, r)
	})
	return http.ListenAndServe(addr, mux)
}

// tryStatic attempts to serve a static file from distDir.
// rel is the URL path with leading slash stripped (so filepath.Join stays inside distDir).
// urlPath is the original /‑prefixed URL path (used for Cache-Control decisions).
// Returns true if a file was found and served.
func tryStatic(w http.ResponseWriter, r *http.Request, distDir, rel, urlPath string) bool {
	candidate := filepath.Join(distDir, filepath.FromSlash(rel))

	// Direct file match
	if fi, err := os.Stat(candidate); err == nil && !fi.IsDir() {
		serveStatic(w, r, candidate, urlPath)
		return true
	}

	// Directory → index.html
	index := filepath.Join(candidate, "index.html")
	if fi, err := os.Stat(index); err == nil && !fi.IsDir() {
		serveStatic(w, r, index, urlPath)
		return true
	}

	return false
}

func serveStatic(w http.ResponseWriter, r *http.Request, fsPath, urlPath string) {
	// Astro content-hashed assets under /_astro/ are safe to cache immutably
	if strings.HasPrefix(urlPath, "/_astro/") {
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	}
	http.ServeFile(w, r, fsPath)
}
