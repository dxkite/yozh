package main

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
