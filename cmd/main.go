package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	astroruntime "github.com/dxkite/astro-runtime"
	"github.com/dxkite/astro-runtime/trace"
	"github.com/spf13/cobra"
)

func main() {
	root := &cobra.Command{
		Use:          "astro-runtime",
		Short:        "Astro SSR runtime server",
		SilenceUsage: true,
	}
	root.AddCommand(buildCmd(), serveCmd())
	if err := root.Execute(); err != nil {
		os.Exit(1)
	}
}

// ── build ─────────────────────────────────────────────────────────────────────

func buildCmd() *cobra.Command {
	var entry, out, distDir string
	var plain, bytecode, pack bool

	cmd := &cobra.Command{
		Use:   "build",
		Short: "Bundle Astro SSR output (--plain / --bytecode / --pack)",
		RunE: func(cmd *cobra.Command, args []string) error {
			absEntry, err := filepath.Abs(entry)
			if err != nil {
				return fmt.Errorf("resolve --entry: %w", err)
			}
			if _, err := os.Stat(absEntry); os.IsNotExist(err) {
				return fmt.Errorf("entry not found: %s\n(run `astro build` first)", absEntry)
			}

			start := time.Now()
			log.Printf("[build] entry: %s", absEntry)
			jsCode, err := astroruntime.BundleSSR(absEntry)
			if err != nil {
				return fmt.Errorf("esbuild: %w", err)
			}
			log.Printf("[build] JS bundle: %d KB", len(jsCode)/1024)

			switch {
			case plain:
				outPath := resolveOut(out, ".netlify/build/bundle.mjs")
				if err := writeOut(outPath, jsCode); err != nil {
					return err
				}
				logDone(start, len(jsCode)/1024, outPath)

			case bytecode:
				outPath := resolveOut(out, ".netlify/build/bundle.bc")
				log.Printf("[build] compiling to QuickJS bytecode ...")
				bc, err := astroruntime.CompileBundleBytecode(jsCode)
				if err != nil {
					return fmt.Errorf("compile: %w", err)
				}
				if err := writeOut(outPath, bc); err != nil {
					return err
				}
				logDone(start, len(bc)/1024, outPath)

			case pack:
				outPath := resolveOut(out, ".netlify/build/bundle.pack")
				absDist, _ := filepath.Abs(distDir)
				log.Printf("[build] compiling and packing ...")
				if err := astroruntime.BuildPack(outPath, jsCode, absDist); err != nil {
					return fmt.Errorf("pack: %w", err)
				}
				fi, _ := os.Stat(outPath)
				logDone(start, int(fi.Size())/1024, outPath)
			}
			return nil
		},
	}

	cmd.Flags().StringVar(&entry, "entry", ".netlify/build/entry.mjs", "path to SSR entry .mjs")
	cmd.Flags().BoolVar(&plain, "plain", false, "output a self-contained JS bundle (.mjs)")
	cmd.Flags().BoolVar(&bytecode, "bytecode", false, "output raw QuickJS bytecode (.bc)")
	cmd.Flags().BoolVar(&pack, "pack", false, "output a deployable pack (.pack) with bundle.mjs + bundle.bc + dist/")
	cmd.Flags().StringVar(&out, "out", "", "output path (default depends on mode)")
	cmd.Flags().StringVar(&distDir, "dist", "dist", "static output directory (included in --pack)")

	cmd.MarkFlagsMutuallyExclusive("plain", "bytecode", "pack")
	cmd.MarkFlagsOneRequired("plain", "bytecode", "pack")

	return cmd
}

// ── serve ─────────────────────────────────────────────────────────────────────

func defaultCacheDir() string {
	d, err := os.UserCacheDir()
	if err != nil {
		return ""
	}
	return filepath.Join(d, "astro-runtime")
}

func serveCmd() *cobra.Command {
	var packPath, entry, bundle, distDir, cacheDir string
	var port int
	var traceFlag bool

	cmd := &cobra.Command{
		Use:   "serve",
		Short: "Start the Astro SSR server (--pack / --entry / --bundle)",
		RunE: func(cmd *cobra.Command, args []string) error {
			if traceFlag {
				trace.Enable()
			}

			// Auto-detect when nothing is specified.
			if packPath == "" && entry == "" && bundle == "" {
				switch {
				case fileExists(".netlify/build/bundle.pack"):
					packPath = ".netlify/build/bundle.pack"
				case fileExists(".netlify/build/bundle.mjs"):
					bundle = ".netlify/build/bundle.mjs"
				default:
					entry = ".netlify/build/entry.mjs"
				}
			}

			addr := fmt.Sprintf(":%d", port)

			if packPath != "" {
				return serveFromPack(packPath, addr, cacheDir)
			}

			absDist, err := filepath.Abs(distDir)
			if err != nil {
				return fmt.Errorf("resolve --dist: %w", err)
			}

			var jsCode []byte
			if bundle != "" {
				absBundle, err := filepath.Abs(bundle)
				if err != nil {
					return fmt.Errorf("resolve --bundle: %w", err)
				}
				if _, err := os.Stat(absBundle); os.IsNotExist(err) {
					return fmt.Errorf("bundle not found: %s", absBundle)
				}
				log.Printf("Loading bundle %s ...", absBundle)
				jsCode, err = os.ReadFile(absBundle)
				if err != nil {
					return fmt.Errorf("read bundle: %w", err)
				}
			} else {
				absEntry, err := filepath.Abs(entry)
				if err != nil {
					return fmt.Errorf("resolve --entry: %w", err)
				}
				if _, err := os.Stat(absEntry); os.IsNotExist(err) {
					return fmt.Errorf("entry not found: %s\n(run `astro build` first)", absEntry)
				}
				log.Printf("Bundling %s ...", absEntry)
				jsCode, err = astroruntime.BundleSSR(absEntry)
				if err != nil {
					return fmt.Errorf("bundle: %w", err)
				}
			}

			rt, err := astroruntime.NewRuntime(
				astroruntime.WithBundle(jsCode),
				astroruntime.WithDistDir(absDist),
				astroruntime.WithCacheDir(cacheDir),
				astroruntime.WithPoolOptions(astroruntime.WithEnv(envMap())),
			)
			if err != nil {
				return fmt.Errorf("runtime init: %w", err)
			}
			defer rt.Close()

			log.Printf("QJS pool ready")
			log.Printf("Netlify SSR mock running at http://localhost%s", addr)
			log.Printf("  dist: %s", absDist)
			return serveWithShutdown(rt, addr)
		},
	}

	cmd.Flags().StringVar(&packPath, "pack", "", "path to .pack file (bundle.bc + dist/)")
	cmd.Flags().StringVar(&entry, "entry", "", "path to SSR entry .mjs (bundled at startup)")
	cmd.Flags().StringVar(&bundle, "bundle", "", "path to pre-bundled .mjs")
	cmd.Flags().IntVar(&port, "port", 8888, "port to listen on")
	cmd.Flags().StringVar(&distDir, "dist", "dist", "static output directory (not used with --pack)")
	cmd.Flags().BoolVar(&traceFlag, "trace", false, "print per-request span timing to stderr")
	cmd.Flags().StringVar(&cacheDir, "cache-dir", defaultCacheDir(), "bundle bytecode cache directory (empty to disable)")

	cmd.MarkFlagsMutuallyExclusive("pack", "entry", "bundle")

	return cmd
}

// serveFromPack loads a .pack file and starts the server via the Runtime SDK.
func serveFromPack(packPath, addr, cacheDir string) error {
	absPackPath, err := filepath.Abs(packPath)
	if err != nil {
		return fmt.Errorf("resolve --pack: %w", err)
	}
	if _, err := os.Stat(absPackPath); os.IsNotExist(err) {
		return fmt.Errorf("pack not found: %s", absPackPath)
	}

	rt, err := astroruntime.NewRuntime(
		astroruntime.WithPackFile(absPackPath),
		astroruntime.WithCacheDir(cacheDir),
		astroruntime.WithPoolOptions(astroruntime.WithEnv(envMap())),
	)
	if err != nil {
		return fmt.Errorf("runtime init: %w", err)
	}
	defer rt.Close()

	log.Printf("QJS pool ready")
	log.Printf("Netlify SSR mock running at http://localhost%s", addr)
	log.Printf("  pack: %s", absPackPath)
	return serveWithShutdown(rt, addr)
}

// serveWithShutdown runs rt.ListenAndServe and gracefully shuts down on SIGTERM/SIGINT.
func serveWithShutdown(rt *astroruntime.Runtime, addr string) error {
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGTERM, syscall.SIGINT)
	defer signal.Stop(quit)

	go func() {
		<-quit
		log.Printf("shutting down ...")
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		if err := rt.Shutdown(ctx); err != nil {
			log.Printf("shutdown: %v", err)
		}
	}()

	return rt.ListenAndServe(addr)
}

// ── helpers ───────────────────────────────────────────────────────────────────

func resolveOut(out, def string) string {
	if out == "" {
		out = def
	}
	abs, err := filepath.Abs(out)
	if err != nil {
		log.Fatalf("resolve --out: %v", err)
	}
	return abs
}

func writeOut(path string, data []byte) error {
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return err
	}
	return os.WriteFile(path, data, 0644)
}

func logDone(start time.Time, sizeKB int, path string) {
	log.Printf("[build] done in %dms — %d KB → %s", time.Since(start).Milliseconds(), sizeKB, path)
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
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
