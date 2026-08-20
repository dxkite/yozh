package yozh

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

// packContents holds the extracted contents of a .pack file: a goja-format ESM
// bundle (bundle.mjs) plus the static-asset dist/ directory.
type packContents struct {
	gojaCode []byte // goja-format ESM (bundle.mjs)
	distFS   fs.FS
}

// openPackContentsInMemory opens pack bytes and returns the contents.
func openPackContentsInMemory(data []byte) (*packContents, error) {
	r, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return nil, fmt.Errorf("open zip: %w", err)
	}

	gojaCode, _ := readZipEntry(r, "bundle.mjs")

	if len(gojaCode) == 0 {
		return nil, fmt.Errorf("pack: missing bundle.mjs")
	}

	sub, err := fs.Sub(r, "dist")
	if err != nil {
		return nil, fmt.Errorf("dist sub-fs: %w", err)
	}
	return &packContents{gojaCode: gojaCode, distFS: sub}, nil
}

// openPackFile reads a .pack from disk. With a non-empty cacheDir it extracts to
// cacheDir/<sha256(data)>/ once and reuses the directory on subsequent calls.
// Without cacheDir it falls back to openPackContentsInMemory.
// maxSize controls how many extracted caches are retained (0 = unlimited).
func openPackFile(path, cacheDir string, maxSize int) (*packContents, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read pack %s: %w", path, err)
	}
	if cacheDir == "" {
		return openPackContentsInMemory(data)
	}
	return extractPackToCache(data, cacheDir, maxSize)
}

// packCacheMetaMu guards reads and writes to metadata.json within a process.
var packCacheMetaMu sync.Mutex

// packCacheMeta is the in-memory representation of cacheDir/metadata.json.
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

// extractPackToCache extracts a pack to cacheDir/<sha256>/ and returns a packContents
// backed by the extracted directory. Cache hit (detected by presence of a bundle file)
// skips extraction and updates metadata.json for LRU tracking.
// maxSize limits how many extracted cache directories are kept (0 = unlimited).
func extractPackToCache(data []byte, cacheDir string, maxSize int) (*packContents, error) {
	sum := sha256.Sum256(data)
	key := hex.EncodeToString(sum[:])
	dir := filepath.Join(cacheDir, key)

	// Cache hit: either bundle file is present.
	mjsPresent := fileExists(filepath.Join(dir, "bundle.mjs"))
	bcPresent := fileExists(filepath.Join(dir, "bundle.bc"))
	if mjsPresent || bcPresent {
		rtlog.Info("pack cache hit", "dir", dir)
		packCacheMetaMu.Lock()
		meta := readPackCacheMeta(cacheDir)
		meta.Entries[key] = time.Now().UnixNano()
		writePackCacheMeta(cacheDir, meta)
		packCacheMetaMu.Unlock()
		return readPackFromDir(dir)
	}

	rtlog.Info("pack cache miss", "dir", dir)
	r, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return nil, fmt.Errorf("open zip: %w", err)
	}
	if err := extractZip(r, dir); err != nil {
		return nil, fmt.Errorf("extract: %w", err)
	}
	evictPackCache(cacheDir, key, maxSize)
	return readPackFromDir(dir)
}

// readPackFromDir reads pack contents from an extracted cache directory.
func readPackFromDir(dir string) (*packContents, error) {
	distPath := filepath.Join(dir, "dist")

	gojaCode, _ := os.ReadFile(filepath.Join(dir, "bundle.mjs"))

	if len(gojaCode) == 0 {
		return nil, fmt.Errorf("pack: missing bundle.mjs in %s", dir)
	}
	return &packContents{gojaCode: gojaCode, distFS: os.DirFS(distPath)}, nil
}

// fileExists reports whether path exists on disk.
func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

// evictPackCache registers currentKey in metadata.json then removes the oldest
// entries until at most maxSize directories remain. maxSize <= 0 is a no-op.
func evictPackCache(cacheDir, currentKey string, maxSize int) {
	packCacheMetaMu.Lock()
	defer packCacheMetaMu.Unlock()

	meta := readPackCacheMeta(cacheDir)
	meta.Entries[currentKey] = time.Now().UnixNano()

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

// BuildPack bundles jsCode into a deployable .pack zip at outPath: bundle.mjs
// (goja-format ESM) + dist/. jsCode must be a self-contained ESM bundle from BundleSSR.
func BuildPack(outPath string, jsCode []byte, distDir string) error {
	gojaCode, err := ConvertBundleForGoja(jsCode)
	if err != nil {
		return fmt.Errorf("convert goja bundle: %w", err)
	}
	return writePack(outPath, gojaCode, distDir)
}

// BuildPackFromGoja creates a .pack zip from an already goja-formatted bundle (the output
// of ConvertBundleForGoja or BundleSSRGoja/BundleSSRReact18). Use this instead of BuildPack
// when you have already done the goja conversion to avoid double-wrapping.
func BuildPackFromGoja(outPath string, gojaCode []byte, distDir string) error {
	return writePack(outPath, gojaCode, distDir)
}

// writePack creates a .pack zip containing bundle.mjs and, if present, dist/.
func writePack(outPath string, gojaCode []byte, distDir string) error {
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

	if len(gojaCode) > 0 {
		if err := zipAddBytes(w, "bundle.mjs", gojaCode); err != nil {
			return err
		}
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
