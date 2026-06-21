package astroruntime

import (
	"embed"
	"fmt"
	"strings"

	"github.com/evanw/esbuild/pkg/api"
)

//go:embed js/shims
var shimsFS embed.FS

// shimSpecToFile maps every intercepted module specifier to its shim file basename.
// Multiple specifiers may share the same file (e.g. "node:path" and "path" → node-path.js).
var shimSpecToFile = map[string]string{
	"node:process":                     "node-process.js",
	"process":                          "node-process.js",
	"node:crypto":                      "node-crypto.js",
	"crypto":                           "node-crypto.js",
	"node:buffer":                      "node-buffer.js",
	"buffer":                           "node-buffer.js",
	"node:path":                        "node-path.js",
	"path":                             "node-path.js",
	"node:path/posix":                  "node-path.js",
	"path/posix":                       "node-path.js",
	"node:url":                         "node-url.js",
	"url":                              "node-url.js",
	"node:stream":                      "node-stream.js",
	"stream":                           "node-stream.js",
	"node:events":                      "node-events.js",
	"events":                           "node-events.js",
	"node:async_hooks":                 "node-async-hooks.js",
	"async_hooks":                      "node-async-hooks.js",
	"node:util":                        "node-util.js",
	"util":                             "node-util.js",
	"node:net":                         "node-net.js",
	"net":                              "node-net.js",
	"node:fs":                          "node-fs.js",
	"fs":                               "node-fs.js",
	"node:fs/promises":                 "node-fs.js",
	"node:http2":                       "node-http2.js",
	"http2":                            "node-http2.js",
	"cookie":                           "cookie.js",
	"html-escaper":                     "html-escaper.js",
	"cssesc":                           "cssesc.js",
	"@astrojs/internal-helpers/path":   "astrojs-internal-helpers-path.js",
	"@astrojs/internal-helpers/remote": "astrojs-internal-helpers-remote.js",
	"@oslojs/encoding":                 "oslojs-encoding.js",
	"devalue":                          "devalue.js",
	"reading-time":                     "reading-time.js",
	"sanitize-html":                    "sanitize-html.js",
	"fast-xml-parser":                  "fast-xml-parser.js",
	"piccolore":                        "piccolore.js",
	"deterministic-object-hash":        "deterministic-object-hash.js",
	"es-module-lexer":                  "es-module-lexer.js",
	"unstorage":                        "unstorage.js",
	"client-only":                      "client-only.js",
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

// nodeShimCode returns the ESM stub code for a given module specifier.
// Specifiers with dedicated implementations are loaded from js/shims/; everything
// else (node: builtins without real impls, client-only libs, etc.) returns an empty stub.
func nodeShimCode(path string) string {
	if code, ok := nodeShims[path]; ok {
		return code
	}
	return `export default {};`
}

// BundleSSR bundles the Netlify SSR .mjs entry to a self-contained ESM bundle.
//
// Strategy: bundle all relative (pre-built .netlify/build/) chunks normally; intercept
// every bare specifier (node: builtins and third-party packages) with a plugin that
// provides inline stubs. This avoids trying to follow pnpm directory junctions for
// packages that are either client-side-only or can be replaced with thin shims, while
// still allowing top-level await via ESM format + ES2023 target.
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
		// self-contained; ESM distributions (dist/index.mjs) import from sibling
		// packages that pnpm stores under .pnpm/ and are not reachable from root
		// node_modules/ (e.g. @radix-ui/react-dialog/.mjs imports @radix-ui/primitive
		// which is not hoisted). With "require" first, those sibling packages are never
		// visited. "node" and "import" as fallbacks cover ESM-only packages (nanostores)
		// and packages without a require condition.
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

// nodeShimPlugin provides inline ESM stubs for every bare specifier.
//
// Two-level approach:
//  1. Specific handlers (registered first) — node: builtins and known packages with
//     real implementations so SSR rendering works correctly.
//  2. Catch-all (registered last) — any other bare specifier that doesn't start with
//     '.' or '/' gets an empty stub. This covers client-side-only packages
//     (@radix-ui/*, @floating-ui/*, react-remove-scroll, …) that pnpm stores under
//     .pnpm/ junction trees that esbuild can't reliably traverse on Windows.
func nodeShimPlugin() api.Plugin {
	return api.Plugin{
		Name: "node-shim",
		Setup: func(build api.PluginBuild) {
			// ── Level 1: Node builtins and known packages ────────────────────────
			build.OnResolve(api.OnResolveOptions{
				Filter: `^(node:|process$|fs$|fs/|path$|path/|url$|crypto$|buffer$|stream$|http$|https$|http2$|os$|async_hooks$|worker_threads$|perf_hooks$|events$|util$|assert$|net$|tls$|zlib$|child_process$|dns$|dgram$|readline$|cookie$|html-escaper$|cssesc$|reading-time$|sanitize-html$|@astrojs/internal-helpers/|@oslojs/encoding$|devalue$|unstorage$|piccolore$|es-module-lexer$|deterministic-object-hash$|client-only$|fast-xml-parser$)`,
			}, func(args api.OnResolveArgs) (api.OnResolveResult, error) {
				return api.OnResolveResult{Path: args.Path, Namespace: "node-shim"}, nil
			})

			// No catch-all: let esbuild resolve unmatched packages normally through
			// node_modules. With Conditions:["require",...] most packages use their
			// self-contained CJS distributions, so pnpm-isolated transitive deps are
			// never visited. Only the packages listed in Level 1 need explicit stubs.

			// ── Load handler: return stub ESM code ───────────────────────────────
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
