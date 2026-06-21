package astroruntime

import (
	"embed"
	"fmt"
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
}

// nodeShims maps each intercepted specifier to its pre-loaded stub code.
// Populated once at package init by reading the embedded js/shims/ files.
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

// nodeShimCode returns the ESM stub code for a given Node.js built-in module specifier.
// Specifiers with dedicated implementations are loaded from js/shims/;
// unknown node: builtins get an empty stub.
func nodeShimCode(path string) string {
	if code, ok := nodeShims[path]; ok {
		return code
	}
	return `export default {};`
}

// BundleSSR bundles the Netlify SSR .mjs entry to a self-contained ESM bundle.
//
// Node.js built-in modules are replaced with lightweight ESM stubs via nodeShimPlugin.
// Third-party packages are resolved normally from node_modules. The project must use
// pnpm with node-linker=hoisted (or npm/yarn) so all transitive dependencies are
// available as flat entries in node_modules/.
func BundleSSR(entryPath string) ([]byte, error) {
	result := api.Build(api.BuildOptions{
		EntryPoints: []string{entryPath},
		Bundle:      true,
		Write:       false,
		Format:      api.FormatESModule,
		Platform:    api.PlatformNeutral,
		Target:      api.ES2023,
		// Force "require" export condition first so esbuild picks the CJS distribution
		// of node_modules packages. CJS distributions (dist/index.js) are typically
		// self-contained; ESM distributions (dist/index.mjs) may import from sibling
		// packages. With "require" first, those sibling packages are never visited.
		// "node" and "import" as fallbacks cover ESM-only packages and packages without
		// a require condition.
		Conditions: []string{"require", "node", "import", "default"},
		// PlatformNeutral ignores main/module fields by default. Explicitly set them
		// so packages without an exports map (e.g. type:module packages with only a
		// "main" field) are still resolved. "main" first prefers CJS distributions.
		MainFields: []string{"main", "module", "browser"},
		Plugins:    []api.Plugin{nodeShimPlugin()},
		Define: map[string]string{
			"process.env.NODE_ENV": `"production"`,
		},
		LogLevel:  api.LogLevelSilent,
		Sourcemap: api.SourceMapNone,
	})

	if len(result.Errors) > 0 {
		msgs := api.FormatMessages(result.Errors, api.FormatMessagesOptions{
			Kind: api.ErrorMessage,
		})
		return nil, fmt.Errorf("esbuild errors:\n%s", strings.Join(msgs, "\n"))
	}

	if len(result.OutputFiles) == 0 {
		return nil, fmt.Errorf("esbuild produced no output files")
	}

	return result.OutputFiles[0].Contents, nil
}

// nodeShimPlugin intercepts Node.js built-in module imports and replaces them with
// lightweight ESM stubs. Third-party packages are resolved normally from node_modules.
func nodeShimPlugin() api.Plugin {
	return api.Plugin{
		Name: "node-shim",
		Setup: func(build api.PluginBuild) {
			// Match node: protocol prefix and bare Node.js built-in names only.
			build.OnResolve(api.OnResolveOptions{
				Filter: `^(node:|process$|fs$|fs/|path$|path/|url$|crypto$|buffer$|stream$|http$|https$|http2$|os$|async_hooks$|worker_threads$|perf_hooks$|events$|util$|assert$|net$|tls$|zlib$|child_process$|dns$|dgram$|readline$)`,
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
