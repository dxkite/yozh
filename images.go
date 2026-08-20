package yozh

import (
	"errors"
	"image"
	"image/gif"
	"image/jpeg"
	"image/png"
	"io"
	"io/fs"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"golang.org/x/image/draw"
	"golang.org/x/image/webp"
)

var errUnsupportedFormat = errors.New("unsupported image format")

var fetchClient = &http.Client{Timeout: 30 * time.Second}

// HandleImageCDN implements the /.netlify/images image transformation endpoint.
// Parameters: url (source path or absolute URL), fm (format), w, h (dimensions), q (quality 1-100), fit (cover/contain/fill).
func HandleImageCDN(distFS fs.FS, w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	rawURL := q.Get("url")
	format := strings.ToLower(q.Get("fm"))
	width, _ := strconv.Atoi(q.Get("w"))
	height, _ := strconv.Atoi(q.Get("h"))
	quality, _ := strconv.Atoi(q.Get("q"))
	fit := q.Get("fit")

	if rawURL == "" {
		http.Error(w, "url parameter required", http.StatusBadRequest)
		return
	}
	if quality <= 0 || quality > 100 {
		quality = 75
	}

	// Locate source: relative paths resolve inside distFS, absolute URLs are fetched.
	name, rc, err := openSource(distFS, rawURL)
	if err != nil {
		http.Error(w, "image not found", http.StatusNotFound)
		return
	}
	defer rc.Close()

	// For relative paths, name carries the extension. For absolute URLs, name is
	// empty — fall back to the extension from rawURL's path segment.
	extSrc := name
	if extSrc == "" {
		extSrc = rawURL
	}
	ext := strings.ToLower(strings.TrimPrefix(filepath.Ext(strings.SplitN(extSrc, "?", 2)[0]), "."))
	img, err := decodeImage(rc, ext)
	if err != nil {
		// Unsupported decode (e.g. AVIF) → serve original file as-is.
		rc.Close()
		if name != "" {
			rtlog.WarnContext(r.Context(), "image-cdn cannot decode, serving original", "ext", ext, "err", err)
			// Re-open and serve raw bytes (rc was unread for unknown formats).
			if f, err2 := distFS.Open(name); err2 == nil {
				defer f.Close()
				fi, _ := f.Stat()
				if rs, ok := f.(io.ReadSeeker); ok {
					http.ServeContent(w, r, fi.Name(), fi.ModTime(), rs)
				} else {
					data, _ := io.ReadAll(f)
					http.ServeContent(w, r, fi.Name(), fi.ModTime(),
						strings.NewReader(string(data)))
				}
			} else {
				http.Error(w, "unsupported image format", http.StatusUnsupportedMediaType)
			}
		} else {
			http.Error(w, "unsupported image format", http.StatusUnsupportedMediaType)
		}
		return
	}

	if width > 0 || height > 0 {
		img = resizeImage(img, width, height, fit)
	}

	encodeResponse(w, img, format, quality)
}

// openSource opens the image source. For relative URLs it opens a file inside distFS;
// for absolute URLs it fetches via HTTP. Returns the path within distFS (empty for HTTP),
// a ReadCloser, and any error.
func openSource(distFS fs.FS, rawURL string) (name string, rc io.ReadCloser, err error) {
	if strings.HasPrefix(rawURL, "http://") || strings.HasPrefix(rawURL, "https://") {
		resp, ferr := fetchClient.Get(rawURL)
		if ferr != nil {
			return "", nil, ferr
		}
		if resp.StatusCode != http.StatusOK {
			resp.Body.Close()
			return "", nil, errors.New("upstream returned " + resp.Status)
		}
		return "", resp.Body, nil
	}

	// Relative path: strip leading slash; fs.FS paths must not start with '/'.
	clean := strings.TrimPrefix(rawURL, "/")
	clean = filepath.ToSlash(clean) // normalize separators
	f, ferr := distFS.Open(clean)
	if ferr != nil {
		return "", nil, ferr
	}
	return clean, f, nil
}

// decodeImage decodes an image from r using the file extension as a hint.
// Returns errUnsupportedFormat for formats we cannot decode (e.g. AVIF).
func decodeImage(r io.Reader, ext string) (image.Image, error) {
	switch ext {
	case "jpg", "jpeg":
		return jpeg.Decode(r)
	case "png":
		return png.Decode(r)
	case "gif":
		g, err := gif.Decode(r)
		if err != nil {
			return nil, err
		}
		return g, nil
	case "webp":
		return webp.Decode(r)
	default:
		return nil, errUnsupportedFormat
	}
}

// resizeImage transforms img to the requested width/height using the given fit mode.
//
//	cover:   scale up/down so the image fills w×h, then crop to center
//	contain: scale to fit within w×h preserving aspect ratio (no crop)
//	fill:    stretch to exactly w×h
func resizeImage(src image.Image, w, h int, fit string) image.Image {
	bounds := src.Bounds()
	srcW := bounds.Dx()
	srcH := bounds.Dy()

	// Fill in missing dimension proportionally.
	if w == 0 && h > 0 {
		w = srcW * h / srcH
	} else if h == 0 && w > 0 {
		h = srcH * w / srcW
	}
	if w <= 0 || h <= 0 {
		return src
	}

	switch fit {
	case "cover":
		return resizeCover(src, w, h, srcW, srcH)
	case "fill":
		dst := image.NewRGBA(image.Rect(0, 0, w, h))
		draw.BiLinear.Scale(dst, dst.Bounds(), src, src.Bounds(), draw.Over, nil)
		return dst
	default: // contain
		return resizeContain(src, w, h, srcW, srcH)
	}
}

func resizeCover(src image.Image, w, h, srcW, srcH int) image.Image {
	scaleW := float64(w) / float64(srcW)
	scaleH := float64(h) / float64(srcH)
	scale := scaleW
	if scaleH > scaleW {
		scale = scaleH
	}
	scaledW := int(float64(srcW) * scale)
	scaledH := int(float64(srcH) * scale)

	scaled := image.NewRGBA(image.Rect(0, 0, scaledW, scaledH))
	draw.BiLinear.Scale(scaled, scaled.Bounds(), src, src.Bounds(), draw.Over, nil)

	// Crop center
	offsetX := (scaledW - w) / 2
	offsetY := (scaledH - h) / 2
	cropped := image.NewRGBA(image.Rect(0, 0, w, h))
	draw.Copy(cropped, image.Point{0, 0}, scaled, image.Rect(offsetX, offsetY, offsetX+w, offsetY+h), draw.Over, nil)
	return cropped
}

func resizeContain(src image.Image, w, h, srcW, srcH int) image.Image {
	scaleW := float64(w) / float64(srcW)
	scaleH := float64(h) / float64(srcH)
	scale := scaleW
	if scaleH < scaleW {
		scale = scaleH
	}
	scaledW := int(float64(srcW) * scale)
	scaledH := int(float64(srcH) * scale)

	dst := image.NewRGBA(image.Rect(0, 0, scaledW, scaledH))
	draw.BiLinear.Scale(dst, dst.Bounds(), src, src.Bounds(), draw.Over, nil)
	return dst
}

// encodeResponse encodes img into the response writer.
// WebP and AVIF output fall back to JPEG since Go has no built-in encoders for those formats.
func encodeResponse(w http.ResponseWriter, img image.Image, format string, quality int) {
	switch format {
	case "png":
		w.Header().Set("Content-Type", "image/png")
		w.WriteHeader(http.StatusOK)
		png.Encode(w, img) //nolint:errcheck
	case "webp", "avif":
		// No pure-Go encoder available; serve as JPEG (acceptable in dev).
		w.Header().Set("Content-Type", "image/jpeg")
		w.WriteHeader(http.StatusOK)
		jpeg.Encode(w, img, &jpeg.Options{Quality: quality}) //nolint:errcheck
	default: // jpg / jpeg / unknown
		w.Header().Set("Content-Type", "image/jpeg")
		w.WriteHeader(http.StatusOK)
		jpeg.Encode(w, img, &jpeg.Options{Quality: quality}) //nolint:errcheck
	}
}
