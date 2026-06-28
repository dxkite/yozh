package astroruntime

import (
	"archive/zip"
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"
)

// loadPackData reads pack bytes from an io.Reader (reads everything into memory).
func loadPackData(r io.Reader) ([]byte, error) {
	return io.ReadAll(r)
}

// openPackInMemory opens pack bytes and returns bundleBC + an in-memory distFS.
// The zip reader holds a reference to data, so data must stay alive as long as distFS is used.
func openPackInMemory(data []byte) (bundleBC []byte, distFS fs.FS, err error) {
	r, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return nil, nil, fmt.Errorf("open zip: %w", err)
	}
	bundleBC, err = readZipEntry(r, "bundle.bc")
	if err != nil {
		return nil, nil, fmt.Errorf("bundle.bc: %w", err)
	}
	sub, err := fs.Sub(r, "dist")
	if err != nil {
		return nil, nil, fmt.Errorf("dist sub-fs: %w", err)
	}
	return bundleBC, sub, nil
}

// openPackFile reads a .pack from disk. With a non-empty cacheDir it extracts to
// cacheDir/<sha256(data)>/ once and reuses the directory on subsequent calls.
// Without cacheDir it falls back to openPackInMemory. maxSize controls how many
// extracted caches are retained (0 or negative = unlimited).
func openPackFile(path, cacheDir string, maxSize int) (bundleBC []byte, distFS fs.FS, err error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, nil, fmt.Errorf("read pack %s: %w", path, err)
	}
	if cacheDir == "" {
		return openPackInMemory(data)
	}
	return extractPackToCache(data, cacheDir, maxSize)
}

// packCacheMetaMu guards reads and writes to metadata.json within a process.
var packCacheMetaMu sync.Mutex

// packCacheMeta is the in-memory representation of cacheDir/metadata.json.
// Entries maps each cache key to its last-access time (Unix nanoseconds).
type packCacheMeta struct {
	Entries map[string]int64 `json:"entries"`
}

func readPackCacheMeta(cacheDir string) packCacheMeta {
	meta := packCacheMeta{Entries: make(map[string]int64)}
	data, err := os.ReadFile(filepath.Join(cacheDir, "metadata.json"))
	if err != nil {
		return meta
	}
	if err := json.Unmarshal(data, &meta); err != nil || meta.Entries == nil {
		meta.Entries = make(map[string]int64)
	}
	return meta
}

func writePackCacheMeta(cacheDir string, meta packCacheMeta) {
	data, err := json.Marshal(meta)
	if err != nil {
		return
	}
	_ = os.WriteFile(filepath.Join(cacheDir, "metadata.json"), data, 0644)
}

// extractPackToCache extracts a pack to cacheDir/<sha256>/ and returns bundleBC
// and a distFS backed by the extracted directory. Cache hit skips extraction and
// updates metadata.json for LRU tracking. maxSize limits how many extracted cache
// directories are kept; oldest by recorded access time are removed when the limit
// is exceeded. maxSize <= 0 means unlimited.
func extractPackToCache(data []byte, cacheDir string, maxSize int) (bundleBC []byte, distFS fs.FS, err error) {
	sum := sha256.Sum256(data)
	key := hex.EncodeToString(sum[:])
	dir := filepath.Join(cacheDir, key)
	bcPath := filepath.Join(dir, "bundle.bc")
	distPath := filepath.Join(dir, "dist")

	if _, err := os.Stat(bcPath); err == nil {
		rtlog.Info("pack cache hit", "dir", dir)
		packCacheMetaMu.Lock()
		meta := readPackCacheMeta(cacheDir)
		meta.Entries[key] = time.Now().UnixNano()
		writePackCacheMeta(cacheDir, meta)
		packCacheMetaMu.Unlock()
		bc, err := os.ReadFile(bcPath)
		if err != nil {
			return nil, nil, err
		}
		return bc, os.DirFS(distPath), nil
	}

	rtlog.Info("pack cache miss", "dir", dir)
	r, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return nil, nil, fmt.Errorf("open zip: %w", err)
	}
	if err := extractZip(r, dir); err != nil {
		return nil, nil, fmt.Errorf("extract: %w", err)
	}
	bc, err := os.ReadFile(bcPath)
	if err != nil {
		return nil, nil, err
	}
	evictPackCache(cacheDir, key, maxSize)
	return bc, os.DirFS(distPath), nil
}

// evictPackCache registers currentKey in metadata.json with the current timestamp,
// then removes the oldest entries (by recorded access time) until at most maxSize
// directories remain. currentKey is never removed. maxSize <= 0 is a no-op.
func evictPackCache(cacheDir, currentKey string, maxSize int) {
	packCacheMetaMu.Lock()
	defer packCacheMetaMu.Unlock()

	meta := readPackCacheMeta(cacheDir)
	meta.Entries[currentKey] = time.Now().UnixNano()

	// Drop metadata entries whose directories no longer exist.
	for k := range meta.Entries {
		if _, err := os.Stat(filepath.Join(cacheDir, k)); os.IsNotExist(err) {
			delete(meta.Entries, k)
		}
	}

	if maxSize <= 0 || len(meta.Entries) <= maxSize {
		writePackCacheMeta(cacheDir, meta)
		return
	}

	type entry struct {
		key string
		ts  int64
	}
	entries := make([]entry, 0, len(meta.Entries))
	for k, ts := range meta.Entries {
		entries = append(entries, entry{k, ts})
	}
	sort.Slice(entries, func(i, j int) bool { return entries[i].ts < entries[j].ts })

	toRemove := len(entries) - maxSize
	removed := 0
	for i := 0; removed < toRemove && i < len(entries); i++ {
		if entries[i].key == currentKey {
			continue
		}
		p := filepath.Join(cacheDir, entries[i].key)
		rtlog.Info("evicting pack cache", "dir", p)
		if err := os.RemoveAll(p); err != nil {
			rtlog.Warn("evict pack cache failed", "dir", p, "err", err)
		} else {
			delete(meta.Entries, entries[i].key)
			removed++
		}
	}

	writePackCacheMeta(cacheDir, meta)
}

// extractZip extracts all entries of r into destDir with path-traversal guard.
func extractZip(r *zip.Reader, destDir string) error {
	if err := os.MkdirAll(destDir, 0755); err != nil {
		return err
	}
	for _, f := range r.File {
		dest := filepath.Join(destDir, filepath.FromSlash(f.Name))
		if !strings.HasPrefix(dest, filepath.Clean(destDir)+string(filepath.Separator)) &&
			dest != filepath.Clean(destDir) {
			continue // path traversal guard
		}
		if f.FileInfo().IsDir() {
			os.MkdirAll(dest, 0755) //nolint:errcheck
			continue
		}
		if err := os.MkdirAll(filepath.Dir(dest), 0755); err != nil {
			return err
		}
		rc, err := f.Open()
		if err != nil {
			return err
		}
		out, err := os.Create(dest)
		if err != nil {
			rc.Close()
			return err
		}
		_, copyErr := io.Copy(out, rc)
		rc.Close()
		out.Close()
		if copyErr != nil {
			return copyErr
		}
	}
	return nil
}

// readZipEntry reads a named entry from a zip.Reader into memory.
func readZipEntry(r *zip.Reader, name string) ([]byte, error) {
	for _, f := range r.File {
		if f.Name == name {
			rc, err := f.Open()
			if err != nil {
				return nil, err
			}
			defer rc.Close()
			return io.ReadAll(rc)
		}
	}
	return nil, fmt.Errorf("entry %q not found", name)
}

// ── Pack builder ──────────────────────────────────────────────────────────────

// BuildPack compiles jsCode to QuickJS bytecode and writes a deployable .pack zip
// to outPath. The pack embeds bundle.mjs, bundle.bc, and (optionally) the dist/
// directory from distDir. Pass an empty distDir to omit static assets.
//
// Typical use:
//
//	jsCode, err := astroruntime.BundleSSR(entryPath)
//	err = astroruntime.BuildPack("out.pack", jsCode, "dist")
func BuildPack(outPath string, jsCode []byte, distDir string) error {
	bc, err := CompileBundleBytecode(jsCode)
	if err != nil {
		return fmt.Errorf("compile bytecode: %w", err)
	}
	return writePack(outPath, jsCode, bc, distDir)
}

// writePack creates a .pack zip containing bundle.mjs, bundle.bc, and dist/.
func writePack(outPath string, jsCode, bcBytes []byte, distDir string) error {
	if err := os.MkdirAll(filepath.Dir(outPath), 0755); err != nil {
		return err
	}
	f, err := os.Create(outPath)
	if err != nil {
		return err
	}
	defer f.Close()
	w := zip.NewWriter(f)
	defer w.Close()

	if err := zipAddBytes(w, "bundle.mjs", jsCode); err != nil {
		return err
	}
	if err := zipAddBytes(w, "bundle.bc", bcBytes); err != nil {
		return err
	}
	if fi, err := os.Stat(distDir); err == nil && fi.IsDir() {
		if err := zipAddDir(w, distDir, "dist"); err != nil {
			return err
		}
	}
	return nil
}

func zipAddBytes(w *zip.Writer, name string, data []byte) error {
	fw, err := w.Create(name)
	if err != nil {
		return err
	}
	_, err = fw.Write(data)
	return err
}

func zipAddDir(w *zip.Writer, srcDir, prefix string) error {
	return filepath.WalkDir(srcDir, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		rel, err := filepath.Rel(srcDir, path)
		if err != nil {
			return err
		}
		name := prefix + "/" + filepath.ToSlash(rel)
		fw, err := w.Create(name)
		if err != nil {
			return err
		}
		f, err := os.Open(path)
		if err != nil {
			return err
		}
		defer f.Close()
		_, err = io.Copy(fw, f)
		return err
	})
}
