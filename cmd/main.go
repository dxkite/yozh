package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"runtime"

	astroruntime "github.com/dxkite/astro-runtime"
)

func main() {
	port    := flag.Int("port", 8888, "port to listen on")
	ssrPath := flag.String("ssr", ".netlify/v1/functions/ssr/ssr.mjs", "path to built SSR entry .mjs")
	distDir := flag.String("dist", "dist", "path to Astro's built static output directory")
	flag.Parse()

	absSSR, err := filepath.Abs(*ssrPath)
	if err != nil {
		log.Fatalf("resolve --ssr path: %v", err)
	}
	absDist, err := filepath.Abs(*distDir)
	if err != nil {
		log.Fatalf("resolve --dist path: %v", err)
	}

	if _, err := os.Stat(absSSR); os.IsNotExist(err) {
		log.Fatalf("SSR entry not found: %s\n(run `astro build` first)", absSSR)
	}

	log.Printf("Bundling %s ...", absSSR)
	bundleCode, err := astroruntime.BundleSSR(absSSR)
	if err != nil {
		log.Fatalf("bundle: %v", err)
	}
	log.Printf("Bundle ready (%d KB)", len(bundleCode)/1024)

	poolSize := runtime.NumCPU()
	if poolSize < 2 {
		poolSize = 2
	}
	if poolSize > 8 {
		poolSize = 8
	}

	log.Printf("Initializing QJS pool (%d runtimes) ...", poolSize)
	pool, err := astroruntime.NewPool(bundleCode, envMap(), poolSize)
	if err != nil {
		log.Fatalf("pool init: %v", err)
	}
	defer pool.Close()
	log.Printf("QJS pool ready")

	addr := fmt.Sprintf(":%d", *port)
	log.Printf("Netlify SSR mock running at http://localhost%s", addr)
	log.Printf("  dist: %s", absDist)
	log.Printf("  ssr:  %s", absSSR)

	if err := astroruntime.StartServer(pool, absDist, addr); err != nil {
		log.Fatal(err)
	}
}

func envMap() map[string]string {
	m := make(map[string]string)
	for _, e := range os.Environ() {
		for i := 0; i < len(e); i++ {
			if e[i] == '=' {
				m[e[:i]] = e[i+1:]
				break
			}
		}
	}
	return m
}
