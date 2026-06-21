package astroruntime

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"net/url"

	"github.com/dxkite/qjs"
)

// injectBinaryOps registers host functions for binary data transfer between Go and QJS.
// Enables efficient UTF-8 encoding/decoding and base64 conversion via Go stdlib.
func injectBinaryOps(ctx *qjs.Context) {
	// __go_textEncodeUTF8(str) → ArrayBuffer — Go string is already UTF-8
	ctx.SetGoFunc("__go_textEncodeUTF8", func(_ context.Context, args ...any) (any, error) {
		if len(args) == 0 {
			return []byte{}, nil
		}
		s, _ := args[0].(string)
		return []byte(s), nil
	})

	// __go_textDecodeUTF8(b64) → string — decodes base64 bytes as UTF-8 string
	ctx.SetGoFunc("__go_textDecodeUTF8", func(_ context.Context, args ...any) (any, error) {
		if len(args) == 0 {
			return "", nil
		}
		s, _ := args[0].(string)
		b, err := base64.StdEncoding.DecodeString(s)
		if err != nil {
			return "", nil
		}
		return string(b), nil
	})

	// __go_bufToB64(jsonNumArray) → base64 string — JS passes byte array as JSON [1,2,3,...]
	ctx.SetGoFunc("__go_bufToB64", func(_ context.Context, args ...any) (any, error) {
		if len(args) == 0 {
			return "", nil
		}
		s, _ := args[0].(string)
		var nums []int
		if err := json.Unmarshal([]byte(s), &nums); err != nil {
			return "", nil
		}
		buf := make([]byte, len(nums))
		for i, n := range nums {
			buf[i] = byte(n)
		}
		return base64.StdEncoding.EncodeToString(buf), nil
	})

	// __go_b64ToBuf(b64) → ArrayBuffer — decodes base64 to binary ArrayBuffer
	ctx.SetGoFunc("__go_b64ToBuf", func(_ context.Context, args ...any) (any, error) {
		if len(args) == 0 {
			return []byte{}, nil
		}
		s, _ := args[0].(string)
		b, err := base64.StdEncoding.DecodeString(s)
		if err != nil {
			return []byte{}, nil
		}
		return b, nil
	})

	// __go_arrayBufToStr(arrayBuffer) → string — zero-copy UTF-8 decode.
	// JS passes an ArrayBuffer (Uint8Array.buffer); qjs marshals it to []byte.
	// This avoids JSON.stringify([N numbers]) + base64 round-trip entirely.
	// PERF: the original Response.text() pushed each byte into a JS array and called
	// JSON.stringify([222K numbers]), which cost ~4s for a 222KB page. This host
	// function reduced body collection from ~4s to ~127ms.
	ctx.SetGoFunc("__go_arrayBufToStr", func(_ context.Context, args ...any) (any, error) {
		if len(args) == 0 {
			return "", nil
		}
		b, ok := args[0].([]byte)
		if !ok {
			s, _ := args[0].(string)
			return s, nil
		}
		return string(b), nil
	})

	// __go_arrayBufToB64(arrayBuffer) → base64 string — zero-copy base64 encode.
	// JS passes an ArrayBuffer directly; qjs marshals it to []byte, avoiding the
	// JSON.stringify([N numbers]) round-trip used by __go_bufToB64.
	ctx.SetGoFunc("__go_arrayBufToB64", func(_ context.Context, args ...any) (any, error) {
		if len(args) == 0 {
			return "", nil
		}
		b, ok := args[0].([]byte)
		if !ok {
			s, _ := args[0].(string)
			return s, nil
		}
		return base64.StdEncoding.EncodeToString(b), nil
	})
}

// injectURLParser registers __go_urlParse for WHATWG-compliant URL parsing via net/url.
func injectURLParser(ctx *qjs.Context) {
	ctx.SetGoFunc("__go_urlParse", func(_ context.Context, args ...any) (any, error) {
		errResult := func(msg string) (any, error) {
			r, _ := json.Marshal(map[string]string{"error": msg})
			return string(r), nil
		}

		if len(args) == 0 {
			return errResult("missing input")
		}
		input, _ := args[0].(string)
		baseStr := ""
		if len(args) > 1 {
			baseStr, _ = args[1].(string)
		}

		var u *url.URL
		var parseErr error
		if baseStr != "" {
			base, berr := url.Parse(baseStr)
			if berr != nil {
				return errResult(berr.Error())
			}
			ref, rerr := url.Parse(input)
			if rerr != nil {
				return errResult(rerr.Error())
			}
			u = base.ResolveReference(ref)
		} else {
			u, parseErr = url.Parse(input)
			if parseErr != nil {
				return errResult(parseErr.Error())
			}
		}

		searchStr := ""
		if u.RawQuery != "" {
			searchStr = "?" + u.RawQuery
		}
		hashStr := ""
		if u.Fragment != "" {
			hashStr = "#" + u.Fragment
		}
		originStr := ""
		if u.Scheme != "" && u.Host != "" {
			originStr = u.Scheme + "://" + u.Host
		}
		username := ""
		password := ""
		if u.User != nil {
			username = u.User.Username()
			password, _ = u.User.Password()
		}

		result, _ := json.Marshal(map[string]string{
			"protocol": u.Scheme + ":",
			"host":     u.Host,
			"hostname": u.Hostname(),
			"port":     u.Port(),
			"pathname": u.Path,
			"search":   searchStr,
			"hash":     hashStr,
			"origin":   originStr,
			"href":     u.String(),
			"username": username,
			"password": password,
		})
		return string(result), nil
	})
}
