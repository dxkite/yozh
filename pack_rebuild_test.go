//go:build qjs

package astroruntime

import (
	"os"
	"testing"
)

// TestRebuildPackQJS rebuilds example.pack as a QJS pack from bundle.mjs.
// Run with UPDATE_TESTDATA=1 whenever bundle.mjs or QJS bytecodes need updating.
func TestRebuildPackQJS(t *testing.T) {
	if os.Getenv("UPDATE_TESTDATA") == "" {
		t.Skip("set UPDATE_TESTDATA=1 to rebuild testdata")
	}
	bundleSrc, err := os.ReadFile("integration/testdata/example/bundle.mjs")
	if err != nil {
		t.Skip("bundle.mjs not found")
	}

	outPath := "integration/testdata/example/example.pack"
	if err := BuildPack(outPath, bundleSrc, "", EngineQJS); err != nil {
		t.Fatalf("BuildPack: %v", err)
	}

	fi, _ := os.Stat(outPath)
	t.Logf("rebuilt QJS pack: %d bytes", fi.Size())

	packData, _ := os.ReadFile(outPath)
	pc, err := openPackContentsInMemory(packData)
	if err != nil {
		t.Fatal("open pack:", err)
	}
	t.Logf("bundleBC: %d bytes", len(pc.bundleBC))

	pool, err := NewPool(nil, WithPrecompiledBundle(pc.bundleBC), WithEngineKind(EngineQJS), WithSize(1))
	if err != nil {
		t.Fatalf("QJS pool: %v", err)
	}
	pool.Close()
	t.Log("QJS pool OK")
}
