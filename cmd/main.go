package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

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
	// Dispatch to subcommand when the first argument is a known command name.
	// Fall through to serve for backward compatibility (flags starting with "-").
	if len(os.Args) >= 2 {
		switch os.Args[1] {
		case "bundle-ssr":
			cmdBundleSSR(os.Args[2:])
			return
		case "bundle-ssr-bin":
			cmdBundleSSRBin(os.Args[2:])
			return
		case "serve":
			cmdServe(os.Args[2:])
			return
		case "help", "-h", "--help":
			printUsage()
			return
		}
	}
	// Default: serve (backward compatible with the original single-command binary).
	cmdServe(os.Args[1:])
}

func printUsage() {
	fmt.Fprintf(os.Stderr, "Usage: %s <command> [flags]\n\nCommands:\n", os.Args[0])
	fmt.Fprintf(os.Stderr, "  serve           Start the Netlify SSR mock server (default)\n")
	fmt.Fprintf(os.Stderr, "  bundle-ssr      Pre-bundle an Astro SSR entry.mjs into a self-contained bundle.mjs\n")
	fmt.Fprintf(os.Stderr, "  bundle-ssr-bin  Bundle + compile to QuickJS bytecode (.jsbc); fastest cold start\n")
}

// cmdBundleSSRBin bundles an Astro SSR entry to JS (via esbuild) then compiles the result
// to a QuickJS bytecode set (.jsbc). The output file can be passed to serve --bytecodes,
// which skips both esbuild and JS parsing for the fastest possible cold start.
func cmdBundleSSRBin(args []string) {
	fs := flag.NewFlagSet("bundle-ssr-bin", flag.ExitOnError)
	entry := fs.String("entry", "", "path to SSR entry .mjs (requires node_modules; mutually exclusive with --bundle)")
	bundle := fs.String("bundle", "", "path to pre-bundled .mjs (skips esbuild; mutually exclusive with --entry)")
	out := fs.String("out", ".netlify/build/bundle.jsbc", "path to write the compiled bytecode set")
	if err := fs.Parse(args); err != nil {
		log.Fatal(err)
	}

	if *entry == "" && *bundle == "" {
		defaultBundle := ".netlify/build/bundle.mjs"
		defaultEntry := ".netlify/build/entry.mjs"
		if _, err := os.Stat(defaultBundle); err == nil {
			*bundle = defaultBundle
		} else {
			*entry = defaultEntry
		}
	}
	if *entry != "" && *bundle != "" {
		log.Fatal("--entry and --bundle are mutually exclusive")
	}

	absOut, err := filepath.Abs(*out)
	if err != nil {
		log.Fatalf("resolve --out: %v", err)
	}

	start := time.Now()
	var jsCode []byte

	if *bundle != "" {
		absBundle, err := filepath.Abs(*bundle)
		if err != nil {
			log.Fatalf("resolve --bundle: %v", err)
		}
		if _, err := os.Stat(absBundle); os.IsNotExist(err) {
			log.Fatalf("bundle not found: %s", absBundle)
		}
		log.Printf("[bundle-ssr-bin] bundle: %s", absBundle)
		jsCode, err = os.ReadFile(absBundle)
		if err != nil {
			log.Fatalf("[bundle-ssr-bin] read bundle: %v", err)
		}
	} else {
		absEntry, err := filepath.Abs(*entry)
		if err != nil {
			log.Fatalf("resolve --entry: %v", err)
		}
		if _, err := os.Stat(absEntry); os.IsNotExist(err) {
			log.Fatalf("entry not found: %s\n(run `astro build` first)", absEntry)
		}
		log.Printf("[bundle-ssr-bin] entry: %s", absEntry)
		jsCode, err = astroruntime.BundleSSR(absEntry)
		if err != nil {
			log.Fatalf("[bundle-ssr-bin] esbuild: %v", err)
		}
		log.Printf("[bundle-ssr-bin] JS bundle: %d KB", len(jsCode)/1024)
	}

	log.Printf("[bundle-ssr-bin] out:   %s", absOut)
	log.Printf("[bundle-ssr-bin] compiling to QuickJS bytecode ...")

	if err := os.MkdirAll(filepath.Dir(absOut), 0o755); err != nil {
		log.Fatalf("[bundle-ssr-bin] mkdir: %v", err)
	}
	if err := astroruntime.CompileBytecodeSet(jsCode, absOut); err != nil {
		log.Fatalf("[bundle-ssr-bin] compile: %v", err)
	}

	info, err := os.Stat(absOut)
	if err != nil {
		log.Fatalf("[bundle-ssr-bin] stat output: %v", err)
	}
	log.Printf("[bundle-ssr-bin] done in %dms — %d KB → %s", time.Since(start).Milliseconds(), info.Size()/1024, absOut)
}

// cmdBundleSSR pre-bundles an Astro SSR entry.mjs → bundle.mjs using esbuild.
// Equivalent to the Node.js scripts/bundle-ssr.mjs helper but runs purely in Go.
func cmdBundleSSR(args []string) {
	fs := flag.NewFlagSet("bundle-ssr", flag.ExitOnError)
	entry := fs.String("entry", ".netlify/build/entry.mjs", "path to SSR entry .mjs")
	out := fs.String("out", ".netlify/build/bundle.mjs", "path to write the self-contained bundle")
	if err := fs.Parse(args); err != nil {
		log.Fatal(err)
	}

	absEntry, err := filepath.Abs(*entry)
	if err != nil {
		log.Fatalf("resolve --entry: %v", err)
	}
	absOut, err := filepath.Abs(*out)
	if err != nil {
		log.Fatalf("resolve --out: %v", err)
	}

	if _, err := os.Stat(absEntry); os.IsNotExist(err) {
		log.Fatalf("entry not found: %s\n(run `astro build` first)", absEntry)
	}

	log.Printf("[bundle-ssr] entry: %s", absEntry)
	log.Printf("[bundle-ssr] out:   %s", absOut)

	start := time.Now()
	code, err := astroruntime.BundleSSR(absEntry)
	if err != nil {
		log.Fatalf("[bundle-ssr] %v", err)
	}

	if err := os.MkdirAll(filepath.Dir(absOut), 0o755); err != nil {
		log.Fatalf("[bundle-ssr] mkdir: %v", err)
	}
	if err := os.WriteFile(absOut, code, 0o644); err != nil {
		log.Fatalf("[bundle-ssr] write: %v", err)
	}

	log.Printf("[bundle-ssr] done in %dms — %d KB → %s", time.Since(start).Milliseconds(), len(code)/1024, absOut)
}

func cmdServe(args []string) {
	fs := flag.NewFlagSet("serve", flag.ExitOnError)
	port := fs.Int("port", 8888, "port to listen on")
	ssrPath := fs.String("ssr", "", "path to SSR entry .mjs (requires node_modules; bundled at startup)")
	bundlePath := fs.String("bundle", "", "path to pre-bundled .mjs (no node_modules needed; skips esbuild)")
	bytecodesPath := fs.String("bytecodes", "", "path to pre-compiled .jsbc (fastest startup; skips esbuild and JS parsing)")
	distDir := fs.String("dist", "dist", "path to Astro's built static output directory")
	traceFlag := fs.Bool("trace", false, "print per-request span timing to stderr")
	cacheDir := fs.String("cache-dir", defaultCacheDir(), "bytecode cache directory (empty string to disable)")
	if err := fs.Parse(args); err != nil {
		log.Fatal(err)
	}

	if *traceFlag {
		trace.Enable()
	}

	absDist, err := filepath.Abs(*distDir)
	if err != nil {
		log.Fatalf("resolve --dist path: %v", err)
	}

	// --bytecodes: load pre-compiled bytecode set, skip JS entirely.
	if *bytecodesPath != "" {
		absBC, err := filepath.Abs(*bytecodesPath)
		if err != nil {
			log.Fatalf("resolve --bytecodes: %v", err)
		}
		if _, err := os.Stat(absBC); os.IsNotExist(err) {
			log.Fatalf("bytecodes file not found: %s\n(run `astro-runtime bundle-ssr-bin` first)", absBC)
		}
		log.Printf("Initializing QJS pool from bytecodes %s ...", absBC)
		poolOpts := []astroruntime.PoolOption{
			astroruntime.WithEnv(envMap()),
			astroruntime.WithPrecompiledBytecodes(absBC),
		}
		pool, err := astroruntime.NewPool(nil, poolOpts...)
		if err != nil {
			log.Fatalf("pool init: %v", err)
		}
		defer pool.Close()
		log.Printf("QJS pool ready")
		addr := fmt.Sprintf(":%d", *port)
		log.Printf("Netlify SSR mock running at http://localhost%s", addr)
		log.Printf("  dist:      %s", absDist)
		log.Printf("  bytecodes: %s", absBC)
		if err := astroruntime.StartServer(pool, absDist, addr); err != nil {
			log.Fatal(err)
		}
		return
	}

	// Auto-detect default inputs when nothing is specified.
	if *ssrPath == "" && *bundlePath == "" {
		defaultEntry := ".netlify/build/entry.mjs"
		defaultBundle := ".netlify/build/bundle.mjs"
		if _, err := os.Stat(defaultBundle); err == nil {
			*bundlePath = defaultBundle
		} else {
			*ssrPath = defaultEntry
		}
	}

	var bundleCode []byte

	if *bundlePath != "" {
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
