package astroruntime

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

// StartServer starts the HTTP server.
// Routing priority matches Netlify's preferStatic: true behaviour:
//  1. Exact static file in distDir → serve directly
//  2. distDir/<path>/index.html exists → serve it
//  3. Fallback → SSR handler (QJS)
func StartServer(pool *Pool, distDir, addr string) error {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		urlPath := filepath.Clean(r.URL.Path)
		if served := tryStatic(w, r, distDir, urlPath); served {
			return
		}
		HandleSSR(pool, w, r)
	})
	return http.ListenAndServe(addr, mux)
}

// tryStatic attempts to serve a static file from distDir.
// Returns true if a file was found and served.
func tryStatic(w http.ResponseWriter, r *http.Request, distDir, urlPath string) bool {
	// Direct file match
	candidate := filepath.Join(distDir, filepath.FromSlash(urlPath))
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
