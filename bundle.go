package netlifyruntime

import (
	"fmt"
	"strings"

	"github.com/evanw/esbuild/pkg/api"
)

// BundleSSR bundles the Netlify SSR .mjs entry point to a self-contained CJS bundle.
// The bundle is wrapped in a CJS factory by runtime.go and evaluated by QJS.
// Using FormatCommonJS + PlatformNeutral produces a single file requiring no runtime
// module resolution — one ctx.Eval() call is all QJS needs.
func BundleSSR(entryPath string) ([]byte, error) {
	result := api.Build(api.BuildOptions{
		EntryPoints: []string{entryPath},
		Bundle:      true,
		Write:       false,
		Format:      api.FormatCommonJS,
		Platform:    api.PlatformNeutral,
		Target:      api.ES2020,
		MainFields:  []string{"module", "main"},
		// Node builtins and server-only packages that cannot run in QJS.
		// Our CJS wrapper's require() shim handles node:crypto, node:buffer, node:process.
		// Everything else returns {} (safe for the SSR path we actually execute).
		External: []string{
			// Node built-ins (with and without "node:" prefix, both appear in bundles)
			"node:*",
			"process",
			"fs", "path", "url", "crypto", "buffer", "stream",
			"http", "https", "os", "async_hooks", "worker_threads",
			"perf_hooks", "events", "util", "assert", "net", "tls",
			"zlib", "child_process", "dns", "dgram", "readline",
			// Netlify platform SDK (server-only)
			"@netlify/blobs",
			"@netlify/functions",
			"@netlify/vite-plugin",
			// Build tooling — never needed at runtime
			"vite",
			"esbuild",
			"rollup",
			// Native addons
			"sharp",
		},
		Define: map[string]string{
			// Eliminate dev-only code paths at bundle time
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
