package astroruntime

import (
	"os"
	"testing"
)

// TestRebuildTestdata rebuilds integration/testdata/example/bundle.mjs and
// integration/testdata/example/example.pack from the built Astro example.
// Run this after `pnpm build` in examples/example.
func TestRebuildTestdata(t *testing.T) {
	if os.Getenv("UPDATE_TESTDATA") == "" {
		t.Skip("set UPDATE_TESTDATA=1 to rebuild testdata from examples/example")
	}
	entryPath := "examples/example/.netlify/build/entry.mjs"
	if _, err := os.Stat(entryPath); err != nil {
		t.Skipf("entry.mjs not found (run pnpm build in examples/example first): %v", err)
	}

	bundleOut := "integration/testdata/example/bundle.mjs"
	packOut := "integration/testdata/example/example.pack"
	distDir := "examples/example/dist"

	t.Log("Bundling SSR entry...")
	bundleCode, err := BundleSSR(entryPath)
	if err != nil {
		t.Fatalf("BundleSSR: %v", err)
	}
	if err := os.WriteFile(bundleOut, bundleCode, 0o644); err != nil {
		t.Fatalf("write bundle.mjs: %v", err)
	}
	t.Logf("bundle.mjs: %d bytes", len(bundleCode))

	t.Log("Building goja pack...")
	if err := BuildPack(packOut, bundleCode, distDir); err != nil {
		t.Fatalf("BuildPack: %v", err)
	}
	fi, _ := os.Stat(packOut)
	t.Logf("example.pack: %d bytes", fi.Size())

	t.Log("Verifying goja pool...")
	packData, err := os.ReadFile(packOut)
	if err != nil {
		t.Fatalf("read pack: %v", err)
	}
	pc, err := openPackContentsInMemory(packData)
	if err != nil {
		t.Fatalf("open pack contents: %v", err)
	}
	t.Logf("gojaCode: %d bytes", len(pc.gojaCode))

	gojaPool, err := NewPool(nil, WithGojaBundle(pc.gojaCode), WithSize(1))
	if err != nil {
		t.Fatalf("goja pool: %v", err)
	}
	gojaPool.Close()
	t.Log("goja pool OK")
}
