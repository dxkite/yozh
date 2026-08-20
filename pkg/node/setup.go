package node

import (
	"encoding/json"
	"fmt"

	sobek "github.com/dxkite/yozh/pkg/sobek"
)

// SetupNodeGlobals injects the Node.js process global into a JS runtime.
// Must be called after sobek.SetupRuntime (Web Platform APIs) and before bundle eval.
func SetupNodeGlobals(ctx sobek.JSContext, env map[string]string) error {
	envJSON, _ := json.Marshal(env)
	src := fmt.Sprintf(`
globalThis.__processEnv = %s;
globalThis.process = {
  env: __processEnv,
  version: 'v20.0.0', versions: {}, platform: 'linux',
  stdout: { fd: 1, write: function(){} },
  stderr: { fd: 2, write: function(){} },
  nextTick: function(fn) {
    var a = arguments;
    Promise.resolve().then(function() { fn.apply(null, Array.prototype.slice.call(a, 1)); });
  },
  hrtime: function(t) {
    var ms = Date.now(), s = (ms / 1000) | 0, ns = (ms %% 1000) * 1e6;
    if (t) { var ds = s - t[0], dns = ns - t[1]; if (dns < 0) { ds--; dns += 1e9; } return [ds, dns]; }
    return [s, ns];
  }
};
try {
  Object.defineProperty(globalThis.process, Symbol.toStringTag, { value: 'process' });
} catch(e) {}
`, string(envJSON))
	if err := ctx.Eval("process-env.js", src, sobek.EvalScript); err != nil {
		return fmt.Errorf("process.env: %w", err)
	}
	return nil
}
