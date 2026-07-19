package node

import (
	"embed"
	"fmt"
	"os"
	"strings"

	"github.com/evanw/esbuild/pkg/api"
)

//go:embed js/shims
var shimsFS embed.FS

// shimSpecToFile maps Node.js built-in module specifiers to their shim file basenames.
// Only Node.js built-ins are shimmed; third-party packages are resolved normally from node_modules.
var shimSpecToFile = map[string]string{
	"node:process":    "node-process.js",
	"process":         "node-process.js",
	"node:crypto":     "node-crypto.js",
	"crypto":          "node-crypto.js",
	"node:buffer":     "node-buffer.js",
	"buffer":          "node-buffer.js",
	"node:path":       "node-path.js",
	"path":            "node-path.js",
	"node:path/posix": "node-path.js",
	"path/posix":      "node-path.js",
	"node:url":        "node-url.js",
	"url":             "node-url.js",
	"node:stream":     "node-stream.js",
	"stream":          "node-stream.js",
	"node:stream/web": "node-stream-web.js",
	"stream/web":      "node-stream-web.js",
	"node:events":     "node-events.js",
	"events":          "node-events.js",
	"node:async_hooks": "node-async-hooks.js",
	"async_hooks":      "node-async-hooks.js",
	"node:util":       "node-util.js",
	"util":            "node-util.js",
	"node:net":        "node-net.js",
	"net":             "node-net.js",
	"node:fs":         "node-fs.js",
	"fs":              "node-fs.js",
	"node:fs/promises": "node-fs.js",
	"node:http2":      "node-http2.js",
	"http2":           "node-http2.js",
	"node:tty":        "node-tty.js",
	"tty":             "node-tty.js",
	"node:module":     "node-module.js",
	"module":          "node-module.js",
}

// nodeShims maps each intercepted specifier to its pre-loaded stub code.
var nodeShims map[string]string

func init() {
	fileCache := make(map[string]string)
	nodeShims = make(map[string]string, len(shimSpecToFile))
	for spec, file := range shimSpecToFile {
		if _, ok := fileCache[file]; !ok {
			data, err := shimsFS.ReadFile("js/shims/" + file)
			if err != nil {
				panic(fmt.Sprintf("shim file not found: js/shims/%s: %v", file, err))
			}
			fileCache[file] = string(data)
		}
		nodeShims[spec] = fileCache[file]
	}
}

// ReadShimFile reads a shim file from the embedded js/shims/ directory.
func ReadShimFile(name string) ([]byte, error) {
	return shimsFS.ReadFile("js/shims/" + name)
}

func nodeShimCode(path string) string {
	if code, ok := nodeShims[path]; ok {
		return code
	}
	return `export default {};`
}

// BundleSSR bundles the Netlify SSR .mjs entry to a self-contained ESM bundle.
func BundleSSR(entryPath string) ([]byte, error) {
	return bundleSSR(entryPath, api.FormatESModule, "")
}

// BundleSSRGoja bundles the Netlify SSR .mjs entry to a goja-compatible ESM bundle.
func BundleSSRGoja(entryPath string) ([]byte, error) {
	esmCode, err := bundleSSR(entryPath, api.FormatESModule, "")
	if err != nil {
		return nil, fmt.Errorf("bundle esm: %w", err)
	}
	return ConvertBundleForGoja(esmCode)
}

// BundleSSRReact bundles a JSX/TSX SSR entry for React into a goja-compatible ESM module.
func BundleSSRReact(entryPath string) ([]byte, error) {
	esmCode, err := bundleSSRReact(entryPath)
	if err != nil {
		return nil, err
	}
	return ConvertBundleForGoja(esmCode)
}

func bundleSSRReact(entryPath string) ([]byte, error) {
	result := api.Build(api.BuildOptions{
		EntryPoints: []string{entryPath},
		Bundle:      true,
		Write:       false,
		Format:      api.FormatESModule,
		Platform:    api.PlatformNeutral,
		Target:      api.ES2023,
		Conditions:  []string{"browser", "import", "default"},
		MainFields:  []string{"browser", "module", "main"},
		Loader: map[string]api.Loader{
			".jsx": api.LoaderJSX,
			".tsx": api.LoaderTSX,
		},
		JSX:             api.JSXAutomatic,
		JSXImportSource: "react",
		Plugins:         []api.Plugin{tanstackStartStubPlugin(), viteUrlPlugin(), tanstackServerFnFixPlugin(), nodeShimPlugin()},
		Define: map[string]string{
			"process.env.NODE_ENV": `"production"`,
			"window":               "globalThis",
		},
		LogLevel:  api.LogLevelSilent,
		Sourcemap: api.SourceMapNone,
	})
	if len(result.Errors) > 0 {
		msgs := api.FormatMessages(result.Errors, api.FormatMessagesOptions{Kind: api.ErrorMessage})
		return nil, fmt.Errorf("esbuild react errors:\n%s", strings.Join(msgs, "\n"))
	}
	if len(result.OutputFiles) == 0 {
		return nil, fmt.Errorf("esbuild react: no output")
	}
	return result.OutputFiles[0].Contents, nil
}

// ConvertBundleForGoja re-emits an already-bundled ESM source as a goja-compatible ESM
// module that sets globalThis.__ssrEntry as a side effect.
func ConvertBundleForGoja(esmSrc []byte) ([]byte, error) {
	result := api.Build(api.BuildOptions{
		EntryPoints: []string{"goja:wrapper"},
		Bundle:      true,
		Write:       false,
		Format:      api.FormatESModule,
		Target:      api.ES2017,
		Charset:     api.CharsetUTF8,
		LogLevel:    api.LogLevelSilent,
		Sourcemap:   api.SourceMapNone,
		Plugins:     []api.Plugin{gojaWrapperPlugin(esmSrc)},
	})
	if len(result.Errors) > 0 {
		msgs := api.FormatMessages(result.Errors, api.FormatMessagesOptions{Kind: api.ErrorMessage})
		return nil, fmt.Errorf("esbuild goja convert:\n%s", strings.Join(msgs, "\n"))
	}
	if len(result.OutputFiles) == 0 {
		return nil, fmt.Errorf("esbuild goja convert: no output")
	}
	return result.OutputFiles[0].Contents, nil
}

func gojaWrapperPlugin(src []byte) api.Plugin {
	return api.Plugin{
		Name: "goja-wrapper",
		Setup: func(build api.PluginBuild) {
			build.OnResolve(api.OnResolveOptions{Filter: `^goja:wrapper$`}, func(args api.OnResolveArgs) (api.OnResolveResult, error) {
				return api.OnResolveResult{Path: "goja:wrapper", Namespace: "goja-wrapper"}, nil
			})
			build.OnLoad(api.OnLoadOptions{Filter: `.*`, Namespace: "goja-wrapper"}, func(args api.OnLoadArgs) (api.OnLoadResult, error) {
				code := `import * as __entry from "goja:bundle";` + "\n" +
					`globalThis.__ssrEntry = __entry;`
				return api.OnLoadResult{Contents: &code, Loader: api.LoaderJS}, nil
			})
			build.OnResolve(api.OnResolveOptions{Filter: `^goja:bundle$`}, func(args api.OnResolveArgs) (api.OnResolveResult, error) {
				return api.OnResolveResult{Path: "goja:bundle", Namespace: "goja-bundle"}, nil
			})
			build.OnLoad(api.OnLoadOptions{Filter: `.*`, Namespace: "goja-bundle"}, func(args api.OnLoadArgs) (api.OnLoadResult, error) {
				content := string(src)
				return api.OnLoadResult{Contents: &content, Loader: api.LoaderJS}, nil
			})
		},
	}
}

func bundleSSR(entryPath string, format api.Format, globalName string) ([]byte, error) {
	result := api.Build(api.BuildOptions{
		EntryPoints: []string{entryPath},
		Bundle:      true,
		Write:       false,
		Format:      format,
		GlobalName:  globalName,
		Platform:    api.PlatformNeutral,
		Target:      api.ES2023,
		Conditions:  []string{"require", "node", "import", "default"},
		MainFields:  []string{"main", "module", "browser"},
		Plugins:     []api.Plugin{nodeShimPlugin()},
		Define: map[string]string{
			"process.env.NODE_ENV": `"production"`,
		},
		LogLevel:  api.LogLevelSilent,
		Sourcemap: api.SourceMapNone,
	})
	if len(result.Errors) > 0 {
		msgs := api.FormatMessages(result.Errors, api.FormatMessagesOptions{Kind: api.ErrorMessage})
		return nil, fmt.Errorf("esbuild errors:\n%s", strings.Join(msgs, "\n"))
	}
	if len(result.OutputFiles) == 0 {
		return nil, fmt.Errorf("esbuild produced no output files")
	}
	return result.OutputFiles[0].Contents, nil
}

func tanstackStartStubPlugin() api.Plugin {
	virtualModules := map[string]string{
		"#tanstack-router-entry":    `export default {};`,
		"#tanstack-start-entry":     `export default {};`,
		"tanstack-start-manifest:v": `export const tsrStartManifest = undefined;`,
	}
	return api.Plugin{
		Name: "tanstack-start-stub",
		Setup: func(build api.PluginBuild) {
			build.OnResolve(api.OnResolveOptions{
				Filter: `^(#tanstack-router-entry|#tanstack-start-entry|tanstack-start-manifest:)`,
			}, func(args api.OnResolveArgs) (api.OnResolveResult, error) {
				return api.OnResolveResult{Path: args.Path, Namespace: "tanstack-start-stub"}, nil
			})
			build.OnLoad(api.OnLoadOptions{Filter: `.*`, Namespace: "tanstack-start-stub"}, func(args api.OnLoadArgs) (api.OnLoadResult, error) {
				code := virtualModules[args.Path]
				if code == "" {
					code = `export default {};`
				}
				return api.OnLoadResult{Contents: &code, Loader: api.LoaderJS}, nil
			})
		},
	}
}

func viteUrlPlugin() api.Plugin {
	return api.Plugin{
		Name: "vite-url",
		Setup: func(build api.PluginBuild) {
			build.OnResolve(api.OnResolveOptions{Filter: `\?url$`}, func(args api.OnResolveArgs) (api.OnResolveResult, error) {
				return api.OnResolveResult{Path: args.Path, Namespace: "vite-url"}, nil
			})
			build.OnLoad(api.OnLoadOptions{Filter: `.*`, Namespace: "vite-url"}, func(args api.OnLoadArgs) (api.OnLoadResult, error) {
				code := `export default '';`
				return api.OnLoadResult{Contents: &code, Loader: api.LoaderJS}, nil
			})
		},
	}
}

func tanstackServerFnFixPlugin() api.Plugin {
	const oldCode = `return next(await options.extractedFn?.(payload));`
	const newCode = `const __fnResult = await options.extractedFn?.(payload);
const __isCtxResult = __fnResult !== null && __fnResult !== undefined && typeof __fnResult === 'object' && !Array.isArray(__fnResult) && ('result' in __fnResult || 'error' in __fnResult);
return next(__isCtxResult ? __fnResult : { ...ctx, result: __fnResult });`
	return api.Plugin{
		Name: "tanstack-serverfn-fix",
		Setup: func(build api.PluginBuild) {
			build.OnLoad(api.OnLoadOptions{
				Filter: `start-client-core.*createServerFn\.js$`,
			}, func(args api.OnLoadArgs) (api.OnLoadResult, error) {
				data, err := os.ReadFile(args.Path)
				if err != nil {
					return api.OnLoadResult{}, err
				}
				patched := strings.ReplaceAll(string(data), oldCode, newCode)
				return api.OnLoadResult{Contents: &patched, Loader: api.LoaderJS}, nil
			})
		},
	}
}

// nodeShimPlugin intercepts Node.js built-in module imports and replaces them with
// lightweight ESM stubs.
func nodeShimPlugin() api.Plugin {
	return api.Plugin{
		Name: "node-shim",
		Setup: func(build api.PluginBuild) {
			build.OnResolve(api.OnResolveOptions{
				Filter: `^(node:|process$|fs$|fs/|path$|path/|url$|crypto$|buffer$|stream$|http$|https$|http2$|os$|async_hooks$|worker_threads$|perf_hooks$|events$|util$|assert$|net$|tls$|tty$|zlib$|child_process$|dns$|dgram$|readline$|module$)`,
			}, func(args api.OnResolveArgs) (api.OnResolveResult, error) {
				return api.OnResolveResult{Path: args.Path, Namespace: "node-shim"}, nil
			})
			build.OnLoad(api.OnLoadOptions{
				Filter:    `.*`,
				Namespace: "node-shim",
			}, func(args api.OnLoadArgs) (api.OnLoadResult, error) {
				code := nodeShimCode(args.Path)
				return api.OnLoadResult{Contents: &code, Loader: api.LoaderJS}, nil
			})
		},
	}
}
