package astroruntime

import (
	"os"
	"testing"
)

// TestRebuildPackGoja rebuilds example.pack as a goja pack from bundle.mjs.
// Run with UPDATE_TESTDATA=1 whenever bundle.mjs needs updating.
func TestRebuildPackGoja(t *testing.T) {
	if os.Getenv("UPDATE_TESTDATA") == "" {
		t.Skip("set UPDATE_TESTDATA=1 to rebuild testdata")
	}
	bundleSrc, err := os.ReadFile("integration/testdata/example/bundle.mjs")
	if err != nil {
		t.Skip("bundle.mjs not found")
	}

	outPath := "integration/testdata/example/example.pack"
	if err := BuildPack(outPath, bundleSrc, ""); err != nil {
		t.Fatalf("BuildPack: %v", err)
	}

	fi, _ := os.Stat(outPath)
	t.Logf("rebuilt goja pack: %d bytes", fi.Size())

	packData, _ := os.ReadFile(outPath)
	pc, err := openPackContentsInMemory(packData)
	if err != nil {
		t.Fatal("open pack:", err)
	}
	t.Logf("gojaCode: %d bytes", len(pc.gojaCode))

	pool, err := NewPool(nil, WithGojaBundle(pc.gojaCode), WithSize(1))
	if err != nil {
		t.Fatalf("goja pool: %v", err)
	}
	pool.Close()
	t.Log("goja pool OK")
}
