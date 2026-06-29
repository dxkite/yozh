//go:build qjs

package astroruntime

import "testing"

const fuwariQJSPackPath = "/tmp/fuwari-qjs.pack"

// BenchmarkFuwari_QJS_Homepage benchmarks the fuwari homepage SSR using the QJS engine.
// Requires: clomery Docker stack running at localhost:8080 (provides the API backend).
// Pack: /tmp/fuwari-qjs.pack (QJS format, built with `build --pack --engine qjs -tags qjs`).
func BenchmarkFuwari_QJS_Homepage(b *testing.B) {
	benchFuwariHomepage(b, fuwariQJSPackPath)
}
