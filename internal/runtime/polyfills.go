package jsruntime

import _ "embed"

//go:embed js/web-api.js
var webAPIPolyfill string

//go:embed js/crypto.js
var cryptoPolyfill string

//go:embed js/file.js
var filePolyfill string

//go:embed js/env-api.js
var envAPIStub string

//go:embed js/intl.js
var intlStub string

//go:embed js/structured-clone.js
var structuredCloneGuard string

//go:embed js/console.js
var consoleDef string

//go:embed js/fetch.js
var fetchDef string

// polyfillSources returns polyfill source strings in the order they must be evaluated.
func polyfillSources() []struct{ name, src string } {
	return []struct{ name, src string }{
		{"web-api-polyfill.js", webAPIPolyfill},
		{"crypto-polyfill.js", cryptoPolyfill},
		{"file-polyfill.js", filePolyfill},
		{"env-api-stub.js", envAPIStub},
		{"intl-stub.js", intlStub},
		{"structured-clone.js", structuredCloneGuard},
		{"console.js", consoleDef},
		{"fetch.js", fetchDef},
	}
}
