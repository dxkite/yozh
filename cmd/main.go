package main

import (
	"context"
	"fmt"
	"log"
	"log/slog"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	astroruntime "github.com/dxkite/astro-runtime"
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
	var entry, out, distDir, engine, kind string
	var pack bool

	cmd := &cobra.Command{
		Use:   "build",
		Short: "Bundle SSR entry into bundle.mjs (goja) or --pack",
		Long: `Bundle the SSR entry into a deployable artifact.

Default (--kind astro): bundles Netlify SSR entry.mjs with node/CJS-first conditions.
With --kind react:    bundles JSX/TSX entry with browser conditions + JSX transform.

Default output: bundle.mjs (goja-format ESM).
With --pack:    engine-specific .pack zip (bundle + dist/).`,
		RunE: func(cmd *cobra.Command, args []string) error {
			absEntry, err := filepath.Abs(entry)
			if err != nil {
				return fmt.Errorf("resolve --entry: %w", err)
			}
			if _, err := os.Stat(absEntry); os.IsNotExist(err) {
				return fmt.Errorf("entry not found: %s", absEntry)
			}

			start := time.Now()
			log.Printf("[build] entry: %s", absEntry)

			if kind == "react" {
				// React 18: JSX + browser conditions → goja-wrapped ESM in one step.
				log.Printf("[build] bundling react ...")
				gojaCode, err := astroruntime.BundleSSRReact(absEntry)
				if err != nil {
					return fmt.Errorf("esbuild react: %w", err)
				}
				log.Printf("[build] react bundle: %d KB", len(gojaCode)/1024)
				if pack {
					outPath := resolveOut(out, ".netlify/build/bundle.pack")
					absDist, _ := filepath.Abs(distDir)
					if err := astroruntime.BuildPackFromGoja(outPath, gojaCode, absDist); err != nil {
						return fmt.Errorf("pack: %w", err)
					}
					fi, _ := os.Stat(outPath)
					logDone(start, int(fi.Size())/1024, outPath)
				} else {
					outPath := resolveOut(out, ".netlify/build/bundle.mjs")
					if err := writeOut(outPath, gojaCode); err != nil {
						return err
					}
					logDone(start, len(gojaCode)/1024, outPath)
				}
				return nil
			}

			// Default: Astro/Netlify SSR path.
			engineKind := astroruntime.EngineGoja
			if engine == "qjs" {
				engineKind = astroruntime.EngineQJS
			}
			if err := astroruntime.ValidateEngineKind(engineKind); err != nil {
				return err
			}

			jsCode, err := astroruntime.BundleSSR(absEntry)
			if err != nil {
				return fmt.Errorf("esbuild: %w", err)
			}
			log.Printf("[build] ESM bundle: %d KB", len(jsCode)/1024)

			if pack {
				outPath := resolveOut(out, ".netlify/build/bundle.pack")
				absDist, _ := filepath.Abs(distDir)
				log.Printf("[build] packing (%s) ...", engine)
				if err := astroruntime.BuildPack(outPath, jsCode, absDist, engineKind); err != nil {
					return fmt.Errorf("pack: %w", err)
				}
				fi, _ := os.Stat(outPath)
				logDone(start, int(fi.Size())/1024, outPath)
			} else {
				outPath := resolveOut(out, ".netlify/build/bundle.mjs")
				log.Printf("[build] converting for goja ...")
				gojaCode, err := astroruntime.ConvertBundleForGoja(jsCode)
				if err != nil {
					return fmt.Errorf("goja convert: %w", err)
				}
				if err := writeOut(outPath, gojaCode); err != nil {
					return err
				}
				logDone(start, len(gojaCode)/1024, outPath)
			}
			return nil
		},
	}

	cmd.Flags().StringVar(&entry, "entry", ".netlify/build/entry.mjs", "path to SSR entry (.mjs for astro, .jsx/.tsx for react)")
	cmd.Flags().StringVar(&kind, "kind", "astro", "entry kind: astro (Netlify SSR) or react (JSX with browser conditions)")
	cmd.Flags().BoolVar(&pack, "pack", false, "output a deployable .pack (bundle + dist/)")
	cmd.Flags().StringVar(&engine, "engine", "goja", "engine for --pack: goja (bundle.mjs) or qjs (bundle.bc, requires -tags qjs)")
	cmd.Flags().StringVar(&out, "out", "", "output path (default: .netlify/build/bundle.mjs, or bundle.pack with --pack)")
	cmd.Flags().StringVar(&distDir, "dist", "dist", "static output directory (only used with --pack)")

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
	var packPath, entry, bundle, distDir, cacheDir, engine, bootstrapFile, polyfillFile string
	var port, packCacheSize int

	cmd := &cobra.Command{
		Use:   "serve",
		Short: "Start the Astro SSR server (--pack / --entry / --bundle)",
		RunE: func(cmd *cobra.Command, args []string) error {
			jsonHandler := slog.NewJSONHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelDebug})
			slog.SetDefault(slog.New(jsonHandler))
			astroruntime.SetLogger(astroruntime.NewLogger(jsonHandler))

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

			ctx := cmd.Context()
			addr := fmt.Sprintf(":%d", port)

			engineKind := astroruntime.EngineGoja
			if engine == "qjs" {
				engineKind = astroruntime.EngineQJS
			}
			if err := astroruntime.ValidateEngineKind(engineKind); err != nil {
				return err
			}

			// --bootstrap overrides default; read file once and pass source.
			var bsSrc string
			if bootstrapFile != "" {
				absBS, err := filepath.Abs(bootstrapFile)
				if err != nil {
					return fmt.Errorf("resolve --bootstrap: %w", err)
				}
				data, err := os.ReadFile(absBS)
				if err != nil {
					return fmt.Errorf("read --bootstrap: %w", err)
				}
				bsSrc = string(data)
			}

			// --polyfill replaces all built-in polyfills; read file once and pass source.
			var polyfillSrc string
			if polyfillFile != "" {
				absPolyfill, err := filepath.Abs(polyfillFile)
				if err != nil {
					return fmt.Errorf("resolve --polyfill: %w", err)
				}
				data, err := os.ReadFile(absPolyfill)
				if err != nil {
					return fmt.Errorf("read --polyfill: %w", err)
				}
				polyfillSrc = string(data)
			}

			if packPath != "" {
				return serveFromPack(ctx, packPath, addr, cacheDir, packCacheSize, port, engineKind, bsSrc, polyfillSrc)
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
				slog.InfoContext(ctx, "loading bundle", "path", absBundle)
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
				slog.InfoContext(ctx, "bundling entry", "path", absEntry, "engine", string(engineKind))
				switch {
				case engineKind == astroruntime.EngineGoja:
					jsCode, err = astroruntime.BundleSSRGoja(absEntry)
				default:
					jsCode, err = astroruntime.BundleSSR(absEntry)
				}
				if err != nil {
					return fmt.Errorf("bundle: %w", err)
				}
			}

			rt, err := astroruntime.NewRuntime(
				astroruntime.WithBundle(jsCode),
				astroruntime.WithDistDir(absDist),
				astroruntime.WithCacheDir(cacheDir),
				astroruntime.WithPoolOptions(
					astroruntime.WithEnv(envMap()),
					astroruntime.WithEngineKind(engineKind),
					astroruntime.WithBootstrap(bsSrc),
					astroruntime.WithPolyfill(polyfillSrc),
					astroruntime.WithSelfURL(fmt.Sprintf("http://127.0.0.1:%d", port)),
				),
			)
			if err != nil {
				return fmt.Errorf("runtime init: %w", err)
			}
			defer rt.Close()

			slog.InfoContext(ctx, "pool ready", "engine", string(engineKind))
			slog.InfoContext(ctx, "server listening", "addr", "http://localhost"+addr, "dist", absDist)
			return serveWithShutdown(ctx, rt, addr)
		},
	}

	cmd.Flags().StringVar(&packPath, "pack", "", "path to .pack file (bundle.bc + dist/)")
	cmd.Flags().StringVar(&entry, "entry", "", "path to SSR entry .mjs (bundled at startup)")
	cmd.Flags().StringVar(&bundle, "bundle", "", "path to pre-bundled .mjs")
	cmd.Flags().IntVar(&port, "port", 8888, "port to listen on")
	cmd.Flags().StringVar(&distDir, "dist", "dist", "static output directory (not used with --pack)")
	cmd.Flags().StringVar(&cacheDir, "cache-dir", defaultCacheDir(), "bundle bytecode cache directory (empty to disable)")
	cmd.Flags().IntVar(&packCacheSize, "pack-cache-size", 0, "max extracted pack caches to keep (0 = default 3, negative = unlimited)")
	cmd.Flags().StringVar(&engine, "engine", "goja", "JS engine: goja (default, pure-Go) or qjs (QuickJS/WASM, requires -tags qjs build)")
	cmd.Flags().StringVar(&bootstrapFile, "bootstrap", "", "path to a custom bootstrap .js file")
	cmd.Flags().StringVar(&polyfillFile, "polyfill", "", "path to a JS file that replaces all built-in polyfills")

	cmd.MarkFlagsMutuallyExclusive("pack", "entry", "bundle")

	return cmd
}

// serveFromPack loads a .pack file and starts the server via the Runtime SDK.
func serveFromPack(ctx context.Context, packPath, addr, cacheDir string, packCacheSize, port int, engineKind astroruntime.EngineKind, bsSrc, polyfillSrc string) error {
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
		astroruntime.WithPackCacheSize(packCacheSize),
		astroruntime.WithPoolOptions(
			astroruntime.WithEnv(envMap()),
			astroruntime.WithEngineKind(engineKind),
			astroruntime.WithBootstrap(bsSrc),
			astroruntime.WithPolyfill(polyfillSrc),
			astroruntime.WithSelfURL(fmt.Sprintf("http://127.0.0.1:%d", port)),
		),
	)
	if err != nil {
		return fmt.Errorf("runtime init: %w", err)
	}
	defer rt.Close()

	slog.InfoContext(ctx, "pool ready", "engine", string(engineKind))
	slog.InfoContext(ctx, "server listening", "addr", "http://localhost"+addr, "pack", absPackPath)
	return serveWithShutdown(ctx, rt, addr)
}

// serveWithShutdown runs rt.ListenAndServe and gracefully shuts down on SIGTERM/SIGINT.
func serveWithShutdown(ctx context.Context, rt *astroruntime.Runtime, addr string) error {
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGTERM, syscall.SIGINT)
	defer signal.Stop(quit)

	go func() {
		<-quit
		slog.InfoContext(ctx, "shutting down")
		shutCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
		defer cancel()
		if err := rt.Shutdown(shutCtx); err != nil {
			slog.ErrorContext(shutCtx, "shutdown error", "err", err)
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
