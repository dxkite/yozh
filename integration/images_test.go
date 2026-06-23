package integration_test

import (
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io/fs"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	astroruntime "github.com/dxkite/astro-runtime"
)

// distFS points to examples/example/dist — built by `pnpm astro build` in examples/example.
// Contains: _astro/test.DavWCkvn.png (via <Image> import) and images/test.png (public/).
var distFS fs.FS

func init() {
	distFS = os.DirFS("../examples/example/dist")
}

func imageReq(t *testing.T, query string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest("GET", "/.netlify/images?"+query, nil)
	w := httptest.NewRecorder()
	astroruntime.HandleImageCDN(distFS, w, req)
	return w
}

// ── Parameter validation ──────────────────────────────────────────────────────

func TestImageCDNMissingURL(t *testing.T) {
	w := imageReq(t, "w=32")
	if w.Code != http.StatusBadRequest {
		t.Errorf("status %d, want 400", w.Code)
	}
}

func TestImageCDNNotFound(t *testing.T) {
	w := imageReq(t, "url=/images/nonexistent.png")
	if w.Code != http.StatusNotFound {
		t.Errorf("status %d, want 404", w.Code)
	}
}

// ── Public image (/images/test.png from public/) ──────────────────────────────

func TestImageCDNPublicServe(t *testing.T) {
	w := imageReq(t, "url=/images/test.png")
	if w.Code != http.StatusOK {
		t.Fatalf("status %d, want 200; body: %.100s", w.Code, w.Body.String())
	}
	ct := w.Header().Get("Content-Type")
	if !strings.HasPrefix(ct, "image/") {
		t.Errorf("Content-Type %q, want image/*", ct)
	}
}

func TestImageCDNPublicResizeWidth(t *testing.T) {
	w := imageReq(t, "url=/images/test.png&w=16")
	if w.Code != http.StatusOK {
		t.Fatalf("status %d; body: %.100s", w.Code, w.Body.String())
	}
	img, _, err := image.Decode(w.Body)
	if err != nil {
		t.Fatalf("decode response image: %v", err)
	}
	if img.Bounds().Dx() != 16 {
		t.Errorf("width %d, want 16", img.Bounds().Dx())
	}
}

func TestImageCDNPublicResizeBoth(t *testing.T) {
	w := imageReq(t, "url=/images/test.png&w=20&h=10&fit=fill")
	if w.Code != http.StatusOK {
		t.Fatalf("status %d", w.Code)
	}
	img, _, err := image.Decode(w.Body)
	if err != nil {
		t.Fatalf("decode: %v", err)
	}
	if img.Bounds().Dx() != 20 || img.Bounds().Dy() != 10 {
		t.Errorf("size %dx%d, want 20x10", img.Bounds().Dx(), img.Bounds().Dy())
	}
}

func TestImageCDNPublicFormatPNG(t *testing.T) {
	w := imageReq(t, "url=/images/test.png&fm=png")
	if w.Code != http.StatusOK {
		t.Fatalf("status %d", w.Code)
	}
	if ct := w.Header().Get("Content-Type"); ct != "image/png" {
		t.Errorf("Content-Type %q, want image/png", ct)
	}
}

func TestImageCDNPublicFormatJPEG(t *testing.T) {
	w := imageReq(t, "url=/images/test.png&fm=jpg")
	if w.Code != http.StatusOK {
		t.Fatalf("status %d", w.Code)
	}
	if ct := w.Header().Get("Content-Type"); ct != "image/jpeg" {
		t.Errorf("Content-Type %q, want image/jpeg", ct)
	}
}

// ── Astro-processed image (_astro/ via <Image> component) ─────────────────────

func TestImageCDNAstroAsset(t *testing.T) {
	// Find the hashed image Astro emitted from src/assets/test.png.
	entries, err := fs.ReadDir(distFS, "_astro")
	if err != nil {
		t.Fatalf("read _astro/: %v", err)
	}
	var assetPath string
	for _, e := range entries {
		if strings.HasPrefix(e.Name(), "test.") && strings.HasSuffix(e.Name(), ".png") {
			assetPath = "/_astro/" + e.Name()
			break
		}
	}
	if assetPath == "" {
		t.Fatal("_astro/test.*.png not found in dist — rebuild examples/example first")
	}

	w := imageReq(t, "url="+assetPath)
	if w.Code != http.StatusOK {
		t.Fatalf("status %d; body: %.100s", w.Code, w.Body.String())
	}
	img, _, err := image.Decode(w.Body)
	if err != nil {
		t.Fatalf("decode: %v", err)
	}
	// Source image is 32×32; served without resize params → original dimensions.
	if img.Bounds().Dx() == 0 {
		t.Errorf("decoded image has zero width")
	}
}

func TestImageCDNAstroAssetResize(t *testing.T) {
	entries, err := fs.ReadDir(distFS, "_astro")
	if err != nil {
		t.Fatalf("read _astro/: %v", err)
	}
	var assetPath string
	for _, e := range entries {
		if strings.HasPrefix(e.Name(), "test.") && strings.HasSuffix(e.Name(), ".png") {
			assetPath = "/_astro/" + e.Name()
			break
		}
	}
	if assetPath == "" {
		t.Fatal("_astro/test.*.png not found")
	}

	w := imageReq(t, "url="+assetPath+"&w=16&h=16&fit=cover")
	if w.Code != http.StatusOK {
		t.Fatalf("status %d", w.Code)
	}
	img, _, err := image.Decode(w.Body)
	if err != nil {
		t.Fatalf("decode: %v", err)
	}
	if img.Bounds().Dx() != 16 || img.Bounds().Dy() != 16 {
		t.Errorf("size %dx%d, want 16x16", img.Bounds().Dx(), img.Bounds().Dy())
	}
}

// ── Pack-embedded distFS ──────────────────────────────────────────────────────

func TestImageCDNFromPack(t *testing.T) {
	if packRT == nil {
		t.Skip("packRT not initialized")
	}
	req := httptest.NewRequest("GET", "/.netlify/images?url=/images/test.png&w=8&fm=png", nil)
	w := httptest.NewRecorder()
	astroruntime.HandleImageCDN(packRT.DistFS(), w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("status %d; body: %.100s", w.Code, w.Body.String())
	}
	if ct := w.Header().Get("Content-Type"); ct != "image/png" {
		t.Errorf("Content-Type %q, want image/png", ct)
	}
}

// ── Absolute URL (upstream HTTP fetch) ────────────────────────────────────────

func TestImageCDNAbsoluteURL(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Serve the local test PNG as an "upstream" source.
		data, err := fs.ReadFile(distFS, "images/test.png")
		if err != nil {
			http.Error(w, "not found", 404)
			return
		}
		w.Header().Set("Content-Type", "image/png")
		w.Write(data) //nolint:errcheck
	}))
	defer upstream.Close()

	w := imageReq(t, "url="+upstream.URL+"/test.png&w=8&h=8&fit=contain&fm=png")
	if w.Code != http.StatusOK {
		t.Fatalf("status %d; body: %.100s", w.Code, w.Body.String())
	}
	img, _, err := image.Decode(w.Body)
	if err != nil {
		t.Fatalf("decode: %v", err)
	}
	if img.Bounds().Dx() != 8 || img.Bounds().Dy() != 8 {
		t.Errorf("size %dx%d, want 8x8", img.Bounds().Dx(), img.Bounds().Dy())
	}
}
