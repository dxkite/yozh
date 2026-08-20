package yozh

import (
	"os"
	"testing"
)

// TestRebuildTestdata rebuilds integration/testdata/example/example.pack from the
// built Astro example. Run this after `pnpm build` in examples/example.
func TestRebuildTestdata(t *testing.T) {
	if os.Getenv("UPDATE_TESTDATA") == "" {
		t.Skip("set UPDATE_TESTDATA=1 to rebuild testdata from examples/example")
	}
	entryPath := "examples/astro/.netlify/build/entry.mjs"
	if _, err := os.Stat(entryPath); err != nil {
		t.Skipf("entry.mjs not found (run pnpm build in examples/astro first): %v", err)
	}

	packOut := "integration/testdata/example/example.pack"
	distDir := "examples/astro/dist"

	t.Log("Bundling SSR entry...")
	bundleCode, err := BundleSSR(entryPath)
	if err != nil {
		t.Fatalf("BundleSSR: %v", err)
	}
	t.Logf("bundle: %d bytes", len(bundleCode))

	t.Log("Building pack...")
	if err := BuildPack(packOut, bundleCode, distDir); err != nil {
		t.Fatalf("BuildPack: %v", err)
	}
	fi, _ := os.Stat(packOut)
	t.Logf("example.pack: %d bytes", fi.Size())

	t.Log("Verifying pool from pack...")
	packData, err := os.ReadFile(packOut)
	if err != nil {
		t.Fatalf("read pack: %v", err)
	}
	pool, err := NewPoolFromPack(packData, WithSize(1))
	if err != nil {
		t.Fatalf("NewPoolFromPack: %v", err)
	}
	pool.Close()
	t.Log("pool OK")
}
