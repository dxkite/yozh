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

	"github.com/dxkite/yozh"
	"github.com/spf13/cobra"
)

func main() {
	root := &cobra.Command{
		Use:          "yozh",
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
	var entry, out, distDir, kind string
	var pack bool

	cmd := &cobra.Command{
		Use:   "build",
		Short: "Bundle SSR entry into bundle.mjs (goja) or --pack",
		Long: `Bundle the SSR entry into a deployable artifact.

Default (--kind astro): bundles Netlify SSR entry.mjs with node/CJS-first conditions.
With --kind react:    bundles JSX/TSX entry with browser conditions + JSX transform.

Default output: bundle.mjs (goja-format ESM).
With --pack:    .pack zip (bundle.mjs + dist/).`,
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
				gojaCode, err := yozh.BundleSSRReact(absEntry)
				if err != nil {
					return fmt.Errorf("esbuild react: %w", err)
				}
				log.Printf("[build] react bundle: %d KB", len(gojaCode)/1024)
				if pack {
					outPath := resolveOut(out, ".netlify/build/bundle.pack")
					absDist, _ := filepath.Abs(distDir)
					if err := yozh.BuildPackFromGoja(outPath, gojaCode, absDist); err != nil {
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
			jsCode, err := yozh.BundleSSR(absEntry)
			if err != nil {
				return fmt.Errorf("esbuild: %w", err)
			}
			log.Printf("[build] ESM bundle: %d KB", len(jsCode)/1024)

			if pack {
				outPath := resolveOut(out, ".netlify/build/bundle.pack")
				absDist, _ := filepath.Abs(distDir)
				log.Printf("[build] packing ...")
				if err := yozh.BuildPack(outPath, jsCode, absDist); err != nil {
					return fmt.Errorf("pack: %w", err)
				}
				fi, _ := os.Stat(outPath)
				logDone(start, int(fi.Size())/1024, outPath)
			} else {
				outPath := resolveOut(out, ".netlify/build/bundle.mjs")
				log.Printf("[build] converting for goja ...")
				gojaCode, err := yozh.ConvertBundleForGoja(jsCode)
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
	return filepath.Join(d, "yozh")
}

func serveCmd() *cobra.Command {
	var packPath, entry, bundle, distDir, cacheDir, bootstrapFile, polyfillFile string
	var port, packCacheSize int

	cmd := &cobra.Command{
		Use:   "serve",
		Short: "Start the Astro SSR server (--pack / --entry / --bundle)",
		RunE: func(cmd *cobra.Command, args []string) error {
			jsonHandler := slog.NewJSONHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelDebug})
			slog.SetDefault(slog.New(jsonHandler))
			yozh.SetLogger(yozh.NewLogger(jsonHandler))

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
				return serveFromPack(ctx, packPath, addr, cacheDir, packCacheSize, port, bsSrc, polyfillSrc)
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
				slog.InfoContext(ctx, "bundling entry", "path", absEntry)
				jsCode, err = yozh.BundleSSRGoja(absEntry)
				if err != nil {
					return fmt.Errorf("bundle: %w", err)
				}
			}

			rt, err := yozh.NewRuntime(
				yozh.WithBundle(jsCode),
				yozh.WithDistDir(absDist),
				yozh.WithCacheDir(cacheDir),
				yozh.WithPoolOptions(
					yozh.WithEnv(envMap()),
					yozh.WithBootstrap(bsSrc),
					yozh.WithPolyfill(polyfillSrc),
					yozh.WithSelfURL(fmt.Sprintf("http://127.0.0.1:%d", port)),
				),
			)
			if err != nil {
				return fmt.Errorf("runtime init: %w", err)
			}
			defer rt.Close()

			slog.InfoContext(ctx, "pool ready")
			slog.InfoContext(ctx, "server listening", "addr", "http://localhost"+addr, "dist", absDist)
			return serveWithShutdown(ctx, rt, addr)
		},
	}

	cmd.Flags().StringVar(&packPath, "pack", "", "path to .pack file (bundle.mjs + dist/)")
	cmd.Flags().StringVar(&entry, "entry", "", "path to SSR entry .mjs (bundled at startup)")
	cmd.Flags().StringVar(&bundle, "bundle", "", "path to pre-bundled .mjs")
	cmd.Flags().IntVar(&port, "port", 8888, "port to listen on")
	cmd.Flags().StringVar(&distDir, "dist", "dist", "static output directory (not used with --pack)")
	cmd.Flags().StringVar(&cacheDir, "cache-dir", defaultCacheDir(), "pack extraction cache directory (empty to disable)")
	cmd.Flags().IntVar(&packCacheSize, "pack-cache-size", 0, "max extracted pack caches to keep (0 = default 3, negative = unlimited)")
	cmd.Flags().StringVar(&bootstrapFile, "bootstrap", "", "path to a custom bootstrap .js file")
	cmd.Flags().StringVar(&polyfillFile, "polyfill", "", "path to a JS file that replaces all built-in polyfills")

	cmd.MarkFlagsMutuallyExclusive("pack", "entry", "bundle")

	return cmd
}

// serveFromPack loads a .pack file and starts the server via the Runtime SDK.
func serveFromPack(ctx context.Context, packPath, addr, cacheDir string, packCacheSize, port int, bsSrc, polyfillSrc string) error {
	absPackPath, err := filepath.Abs(packPath)
	if err != nil {
		return fmt.Errorf("resolve --pack: %w", err)
	}
	if _, err := os.Stat(absPackPath); os.IsNotExist(err) {
		return fmt.Errorf("pack not found: %s", absPackPath)
	}

	rt, err := yozh.NewRuntime(
		yozh.WithPackFile(absPackPath),
		yozh.WithCacheDir(cacheDir),
		yozh.WithPackCacheSize(packCacheSize),
		yozh.WithPoolOptions(
			yozh.WithEnv(envMap()),
			yozh.WithBootstrap(bsSrc),
			yozh.WithPolyfill(polyfillSrc),
			yozh.WithSelfURL(fmt.Sprintf("http://127.0.0.1:%d", port)),
		),
	)
	if err != nil {
		return fmt.Errorf("runtime init: %w", err)
	}
	defer rt.Close()

	slog.InfoContext(ctx, "pool ready")
	slog.InfoContext(ctx, "server listening", "addr", "http://localhost"+addr, "pack", absPackPath)
	return serveWithShutdown(ctx, rt, addr)
}

// serveWithShutdown runs rt.ListenAndServe and gracefully shuts down on SIGTERM/SIGINT.
func serveWithShutdown(ctx context.Context, rt *yozh.Runtime, addr string) error {
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
