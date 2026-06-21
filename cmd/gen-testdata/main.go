// gen-testdata bundles a .netlify/build/entry.mjs into a self-contained ESM file
// suitable for use as integration test data.
//
// Usage:
//
//	go run ./cmd/gen-testdata -entry <path-to-entry.mjs> -out <output-path>
package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	astroruntime "github.com/dxkite/astro-runtime"
)

func main() {
	entry := flag.String("entry", "", "path to .netlify/build/entry.mjs")
	out := flag.String("out", "", "output path for the bundled .mjs file")
	flag.Parse()

	if *entry == "" || *out == "" {
		flag.Usage()
		os.Exit(1)
	}

	log.Printf("Bundling %s ...", *entry)
	code, err := astroruntime.BundleSSR(*entry)
	if err != nil {
		log.Fatalf("BundleSSR: %v", err)
	}
	log.Printf("Bundle size: %d bytes (%d KB)", len(code), len(code)/1024)

	if err := os.WriteFile(*out, code, 0644); err != nil {
		log.Fatalf("write output: %v", err)
	}
	log.Printf("Written to %s", *out)
	fmt.Printf("OK: %s (%d KB)\n", *out, len(code)/1024)
}
