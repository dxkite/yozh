package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"

	astroruntime "github.com/dxkite/astro-runtime"
	"github.com/dxkite/astro-runtime/trace"
)

func defaultCacheDir() string {
	d, err := os.UserCacheDir()
	if err != nil {
		return ""
	}
	return filepath.Join(d, "astro-runtime")
}

func main() {
	port       := flag.Int("port", 8888, "port to listen on")
	ssrPath    := flag.String("ssr", "", "path to SSR entry .mjs (requires node_modules; bundled at startup)")
	bundlePath := flag.String("bundle", "", "path to pre-bundled .mjs (no node_modules needed; skips esbuild)")
	distDir    := flag.String("dist", "dist", "path to Astro's built static output directory")
	traceFlag  := flag.Bool("trace", false, "print per-request span timing to stderr")
	cacheDir   := flag.String("cache-dir", defaultCacheDir(), "bytecode cache directory (empty string to disable)")
	flag.Parse()

	if *ssrPath == "" && *bundlePath == "" {
		// Default: look for a pre-bundle next to a conventional entry path.
		defaultEntry := ".netlify/build/entry.mjs"
		defaultBundle := ".netlify/build/bundle.mjs"
		if _, err := os.Stat(defaultBundle); err == nil {
			*bundlePath = defaultBundle
		} else {
			*ssrPath = defaultEntry
		}
	}

	if *traceFlag {
		trace.Enable()
	}

	absDist, err := filepath.Abs(*distDir)
	if err != nil {
		log.Fatalf("resolve --dist path: %v", err)
	}

	var bundleCode []byte

	if *bundlePath != "" {
		// Pre-bundled mode: read the file directly, no esbuild needed.
		absBundlePath, err := filepath.Abs(*bundlePath)
		if err != nil {
			log.Fatalf("resolve --bundle path: %v", err)
		}
		if _, err := os.Stat(absBundlePath); os.IsNotExist(err) {
			log.Fatalf("bundle file not found: %s\n(run `pnpm build:prod` first)", absBundlePath)
		}
		log.Printf("Loading pre-bundled %s ...", absBundlePath)
		bundleCode, err = os.ReadFile(absBundlePath)
		if err != nil {
			log.Fatalf("read bundle: %v", err)
		}
		log.Printf("Bundle ready (%d bytes / %d KB)", len(bundleCode), len(bundleCode)/1024)
	} else {
		// Entry mode: bundle entry.mjs + node_modules with esbuild at startup.
		absSSR, err := filepath.Abs(*ssrPath)
		if err != nil {
			log.Fatalf("resolve --ssr path: %v", err)
		}
		if _, err := os.Stat(absSSR); os.IsNotExist(err) {
			log.Fatalf("SSR entry not found: %s\n(run `astro build` first)", absSSR)
		}
		log.Printf("Bundling %s ...", absSSR)
		bundleCode, err = astroruntime.BundleSSR(absSSR)
		if err != nil {
			log.Fatalf("bundle: %v", err)
		}
		log.Printf("Bundle ready (%d bytes / %d KB)", len(bundleCode), len(bundleCode)/1024)
	}
	if len(bundleCode) < 10000 {
		log.Printf("Bundle content (small, dumping): %s", string(bundleCode))
	}

	log.Printf("Initializing QJS pool ...")
	poolOpts := []astroruntime.PoolOption{astroruntime.WithEnv(envMap())}
	if *cacheDir != "" {
		poolOpts = append(poolOpts, astroruntime.WithBytecodeCache(*cacheDir))
	}
	pool, err := astroruntime.NewPool(bundleCode, poolOpts...)
	if err != nil {
		log.Fatalf("pool init: %v", err)
	}
	defer pool.Close()
	log.Printf("QJS pool ready")

	addr := fmt.Sprintf(":%d", *port)
	log.Printf("Netlify SSR mock running at http://localhost%s", addr)
	log.Printf("  dist:   %s", absDist)
	if *bundlePath != "" {
		log.Printf("  bundle: %s", *bundlePath)
	} else {
		log.Printf("  ssr:    %s", *ssrPath)
	}

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
