package jsruntime

import (
	"crypto/sha256"
	"encoding/hex"
	"runtime/debug"
)

// PolyfillEntry holds one compiled polyfill bytecode.
type PolyfillEntry struct {
	Name string
	BC   []byte
}

// BytecodeSet holds pre-compiled QuickJS bytecodes for a pool's lifetime.
// All pool workers share the same BytecodeSet (read-only after creation).
type BytecodeSet struct {
	Polyfills []PolyfillEntry
	Bundle    []byte
}

// BundleCacheKey returns the hex-encoded SHA256 of bundleCode mixed with the
// current binary's VCS revision. Invalidates cached bytecode when the binary is rebuilt.
func BundleCacheKey(bundleCode []byte) string {
	h := sha256.New()
	h.Write(bundleCode)
	if info, ok := debug.ReadBuildInfo(); ok {
		for _, s := range info.Settings {
			if s.Key == "vcs.revision" {
				h.Write([]byte(s.Value))
				break
			}
		}
	}
	return hex.EncodeToString(h.Sum(nil))
}
