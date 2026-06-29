package jsruntime

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha1"
	"crypto/sha256"
	"crypto/sha512"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"hash"
	"strings"
)

type algoSpec struct {
	Name       string `json:"name"`
	Hash       string `json:"hash"`
	Length     int    `json:"length"`
	IV         string `json:"iv"`
	TagLength  int    `json:"tagLength"`
	NamedCurve string `json:"namedCurve"`
}

type cryptoKey struct {
	ID          string
	Type        string
	Algo        algoSpec
	Raw         []byte
	Extractable bool
	Usages      []string
}

func newKeyID() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("newKeyID rand.Read: %w", err)
	}
	return fmt.Sprintf("k%x", b), nil
}

func makeHasher(hashName string) (func() hash.Hash, error) {
	switch strings.ToUpper(hashName) {
	case "SHA-1":
		return sha1.New, nil
	case "SHA-256":
		return sha256.New, nil
	case "SHA-384":
		return sha512.New384, nil
	case "SHA-512":
		return sha512.New, nil
	default:
		return nil, fmt.Errorf("unsupported hash: %s", hashName)
	}
}

// cryptoErr formats a crypto error as an "ERROR:..." string returned to JS.
func cryptoErr(msg string) (any, error) {
	return "ERROR:" + msg, nil
}

func injectCryptoSubtle(ctx JSContext, keyReg map[string]*cryptoKey) {
	ctx.SetGoFunc("__go_cryptoSubtleDigest", func(_ context.Context, args ...any) (any, error) {
		if len(args) < 2 {
			return cryptoErr("missing arguments")
		}
		algo := strings.ToUpper(args[0].(string))
		data, err := base64.StdEncoding.DecodeString(args[1].(string))
		if err != nil {
			return cryptoErr("invalid base64: " + err.Error())
		}
		var h []byte
		switch algo {
		case "SHA-1":
			s := sha1.Sum(data)
			h = s[:]
		case "SHA-256":
			s := sha256.Sum256(data)
			h = s[:]
		case "SHA-384":
			s := sha512.Sum384(data)
			h = s[:]
		case "SHA-512":
			s := sha512.Sum512(data)
			h = s[:]
		default:
			return cryptoErr("unsupported digest algorithm: " + algo)
		}
		return base64.StdEncoding.EncodeToString(h), nil
	})

	ctx.SetGoFunc("__go_cryptoSubtleImportKey", func(_ context.Context, args ...any) (any, error) {
		if len(args) < 5 {
			return cryptoErr("missing arguments")
		}
		format, _ := args[0].(string)
		rawData, _ := args[1].(string)
		var algo algoSpec
		if err := json.Unmarshal([]byte(args[2].(string)), &algo); err != nil {
			return cryptoErr("invalid algorithm JSON: " + err.Error())
		}
		extractable := args[3].(string) == "true"
		var usages []string
		if err := json.Unmarshal([]byte(args[4].(string)), &usages); err != nil {
			return cryptoErr("invalid usages JSON: " + err.Error())
		}

		var keyBytes []byte
		switch format {
		case "raw":
			b, err := base64.StdEncoding.DecodeString(rawData)
			if err != nil {
				return cryptoErr("invalid base64 key data: " + err.Error())
			}
			keyBytes = b
		case "jwk":
			var jwk map[string]any
			if err := json.Unmarshal([]byte(rawData), &jwk); err != nil {
				return cryptoErr("invalid JWK: " + err.Error())
			}
			kStr, _ := jwk["k"].(string)
			if kStr == "" {
				return cryptoErr("JWK missing k field")
			}
			b, err := base64.RawURLEncoding.DecodeString(kStr)
			if err != nil {
				return cryptoErr("invalid JWK k field: " + err.Error())
			}
			keyBytes = b
		default:
			return cryptoErr("unsupported key format: " + format)
		}

		id, err := newKeyID()
		if err != nil {
			return cryptoErr(err.Error())
		}
		keyReg[id] = &cryptoKey{
			ID:          id,
			Type:        "secret",
			Algo:        algo,
			Raw:         keyBytes,
			Extractable: extractable,
			Usages:      usages,
		}
		return id, nil
	})

	ctx.SetGoFunc("__go_cryptoSubtleGenerateKey", func(_ context.Context, args ...any) (any, error) {
		if len(args) < 3 {
			return cryptoErr("missing arguments")
		}
		var algo algoSpec
		if err := json.Unmarshal([]byte(args[0].(string)), &algo); err != nil {
			return cryptoErr("invalid algorithm JSON: " + err.Error())
		}
		extractable := args[1].(string) == "true"
		var usages []string
		if err := json.Unmarshal([]byte(args[2].(string)), &usages); err != nil {
			return cryptoErr("invalid usages JSON: " + err.Error())
		}

		name := strings.ToUpper(algo.Name)
		var keyLen int
		switch {
		case name == "HMAC":
			switch strings.ToUpper(algo.Hash) {
			case "SHA-384":
				keyLen = 48
			case "SHA-512":
				keyLen = 64
			default:
				keyLen = 32
			}
			if algo.Length > 0 {
				keyLen = algo.Length / 8
			}
		case strings.HasPrefix(name, "AES-"):
			switch algo.Length {
			case 128:
				keyLen = 16
			case 192:
				keyLen = 24
			default:
				keyLen = 32
			}
		default:
			return cryptoErr("unsupported generateKey algorithm: " + algo.Name)
		}

		keyBytes := make([]byte, keyLen)
		if _, err := rand.Read(keyBytes); err != nil {
			return cryptoErr("rand: " + err.Error())
		}
		id, err := newKeyID()
		if err != nil {
			return cryptoErr(err.Error())
		}
		keyReg[id] = &cryptoKey{
			ID:          id,
			Type:        "secret",
			Algo:        algo,
			Raw:         keyBytes,
			Extractable: extractable,
			Usages:      usages,
		}
		return id, nil
	})

	ctx.SetGoFunc("__go_cryptoSubtleExportKey", func(_ context.Context, args ...any) (any, error) {
		if len(args) < 2 {
			return cryptoErr("missing arguments")
		}
		format, _ := args[0].(string)
		keyID, _ := args[1].(string)
		ck, ok := keyReg[keyID]
		if !ok {
			return cryptoErr("key not found: " + keyID)
		}
		if !ck.Extractable {
			return cryptoErr("key is not extractable")
		}

		switch format {
		case "raw":
			return base64.StdEncoding.EncodeToString(ck.Raw), nil
		case "jwk":
			jwk := map[string]any{
				"kty":     "oct",
				"k":       base64.RawURLEncoding.EncodeToString(ck.Raw),
				"key_ops": ck.Usages,
				"ext":     ck.Extractable,
			}
			switch strings.ToUpper(ck.Algo.Name) {
			case "HMAC":
				switch strings.ToUpper(ck.Algo.Hash) {
				case "SHA-256":
					jwk["alg"] = "HS256"
				case "SHA-384":
					jwk["alg"] = "HS384"
				case "SHA-512":
					jwk["alg"] = "HS512"
				}
			case "AES-GCM":
				switch len(ck.Raw) * 8 {
				case 128:
					jwk["alg"] = "A128GCM"
				case 256:
					jwk["alg"] = "A256GCM"
				}
			case "AES-CBC":
				switch len(ck.Raw) * 8 {
				case 128:
					jwk["alg"] = "A128CBC"
				case 256:
					jwk["alg"] = "A256CBC"
				}
			}
			j, _ := json.Marshal(jwk)
			return string(j), nil
		default:
			return cryptoErr("unsupported export format: " + format)
		}
	})

	ctx.SetGoFunc("__go_cryptoSubtleSign", func(_ context.Context, args ...any) (any, error) {
		if len(args) < 3 {
			return cryptoErr("missing arguments")
		}
		keyID, _ := args[1].(string)
		data, err := base64.StdEncoding.DecodeString(args[2].(string))
		if err != nil {
			return cryptoErr("invalid data base64: " + err.Error())
		}

		ck, ok := keyReg[keyID]
		if !ok {
			return cryptoErr("key not found: " + keyID)
		}

		switch strings.ToUpper(ck.Algo.Name) {
		case "HMAC":
			hashName := ck.Algo.Hash
			if hashName == "" {
				hashName = "SHA-256"
			}
			newH, err := makeHasher(hashName)
			if err != nil {
				return cryptoErr(err.Error())
			}
			mac := hmac.New(newH, ck.Raw)
			mac.Write(data)
			return base64.StdEncoding.EncodeToString(mac.Sum(nil)), nil
		default:
			return cryptoErr("unsupported sign algorithm: " + ck.Algo.Name)
		}
	})

	ctx.SetGoFunc("__go_cryptoSubtleVerify", func(_ context.Context, args ...any) (any, error) {
		if len(args) < 4 {
			return "false", nil
		}
		keyID, _ := args[1].(string)
		sig, err1 := base64.StdEncoding.DecodeString(args[2].(string))
		data, err2 := base64.StdEncoding.DecodeString(args[3].(string))
		if err1 != nil || err2 != nil {
			return "false", nil
		}

		ck, ok := keyReg[keyID]
		if !ok {
			return "false", nil
		}

		switch strings.ToUpper(ck.Algo.Name) {
		case "HMAC":
			hashName := ck.Algo.Hash
			if hashName == "" {
				hashName = "SHA-256"
			}
			newH, err := makeHasher(hashName)
			if err != nil {
				return "false", nil
			}
			mac := hmac.New(newH, ck.Raw)
			mac.Write(data)
			if hmac.Equal(sig, mac.Sum(nil)) {
				return "true", nil
			}
			return "false", nil
		default:
			return "false", nil
		}
	})

	ctx.SetGoFunc("__go_cryptoSubtleEncrypt", func(_ context.Context, args ...any) (any, error) {
		if len(args) < 3 {
			return cryptoErr("missing arguments")
		}
		var algo algoSpec
		if err := json.Unmarshal([]byte(args[0].(string)), &algo); err != nil {
			return cryptoErr("invalid algorithm JSON: " + err.Error())
		}
		keyID, _ := args[1].(string)
		plaintext, err := base64.StdEncoding.DecodeString(args[2].(string))
		if err != nil {
			return cryptoErr("invalid data base64: " + err.Error())
		}

		ck, ok := keyReg[keyID]
		if !ok {
			return cryptoErr("key not found: " + keyID)
		}

		switch strings.ToUpper(ck.Algo.Name) {
		case "AES-GCM":
			iv, err := base64.StdEncoding.DecodeString(algo.IV)
			if err != nil {
				return cryptoErr("invalid IV base64: " + err.Error())
			}
			block, err := aes.NewCipher(ck.Raw)
			if err != nil {
				return cryptoErr("AES cipher: " + err.Error())
			}
			gcm, err := cipher.NewGCM(block)
			if err != nil {
				return cryptoErr("GCM init: " + err.Error())
			}
			if len(iv) != gcm.NonceSize() {
				return cryptoErr(fmt.Sprintf("AES-GCM: IV must be %d bytes, got %d", gcm.NonceSize(), len(iv)))
			}
			ciphertext := gcm.Seal(nil, iv, plaintext, nil)
			return base64.StdEncoding.EncodeToString(ciphertext), nil
		case "AES-CBC":
			iv, err := base64.StdEncoding.DecodeString(algo.IV)
			if err != nil {
				return cryptoErr("invalid IV base64: " + err.Error())
			}
			if len(iv) != aes.BlockSize {
				return cryptoErr(fmt.Sprintf("AES-CBC: IV must be %d bytes, got %d", aes.BlockSize, len(iv)))
			}
			block, err := aes.NewCipher(ck.Raw)
			if err != nil {
				return cryptoErr("AES cipher: " + err.Error())
			}
			padded := pkcs7Pad(plaintext, aes.BlockSize)
			mode := cipher.NewCBCEncrypter(block, iv)
			ciphertext := make([]byte, len(padded))
			mode.CryptBlocks(ciphertext, padded)
			return base64.StdEncoding.EncodeToString(ciphertext), nil
		default:
			return cryptoErr("unsupported encrypt algorithm: " + ck.Algo.Name)
		}
	})

	ctx.SetGoFunc("__go_cryptoSubtleDecrypt", func(_ context.Context, args ...any) (any, error) {
		if len(args) < 3 {
			return cryptoErr("missing arguments")
		}
		var algo algoSpec
		if err := json.Unmarshal([]byte(args[0].(string)), &algo); err != nil {
			return cryptoErr("invalid algorithm JSON: " + err.Error())
		}
		keyID, _ := args[1].(string)
		ciphertext, err := base64.StdEncoding.DecodeString(args[2].(string))
		if err != nil {
			return cryptoErr("invalid data base64: " + err.Error())
		}

		ck, ok := keyReg[keyID]
		if !ok {
			return cryptoErr("key not found: " + keyID)
		}

		switch strings.ToUpper(ck.Algo.Name) {
		case "AES-GCM":
			iv, err := base64.StdEncoding.DecodeString(algo.IV)
			if err != nil {
				return cryptoErr("invalid IV base64: " + err.Error())
			}
			block, err := aes.NewCipher(ck.Raw)
			if err != nil {
				return cryptoErr("AES cipher: " + err.Error())
			}
			gcm, err := cipher.NewGCM(block)
			if err != nil {
				return cryptoErr("GCM init: " + err.Error())
			}
			if len(iv) != gcm.NonceSize() {
				return cryptoErr(fmt.Sprintf("AES-GCM: IV must be %d bytes, got %d", gcm.NonceSize(), len(iv)))
			}
			plain, err := gcm.Open(nil, iv, ciphertext, nil)
			if err != nil {
				return cryptoErr("AES-GCM decrypt failed: " + err.Error())
			}
			return base64.StdEncoding.EncodeToString(plain), nil
		case "AES-CBC":
			iv, err := base64.StdEncoding.DecodeString(algo.IV)
			if err != nil {
				return cryptoErr("invalid IV base64: " + err.Error())
			}
			if len(iv) != aes.BlockSize {
				return cryptoErr(fmt.Sprintf("AES-CBC: IV must be %d bytes, got %d", aes.BlockSize, len(iv)))
			}
			block, err := aes.NewCipher(ck.Raw)
			if err != nil {
				return cryptoErr("AES cipher: " + err.Error())
			}
			if len(ciphertext)%aes.BlockSize != 0 {
				return cryptoErr("AES-CBC: ciphertext length not multiple of block size")
			}
			plain := make([]byte, len(ciphertext))
			cipher.NewCBCDecrypter(block, iv).CryptBlocks(plain, ciphertext)
			unpadded, err := pkcs7Unpad(plain, aes.BlockSize)
			if err != nil {
				return cryptoErr("AES-CBC unpad: " + err.Error())
			}
			return base64.StdEncoding.EncodeToString(unpadded), nil
		default:
			return cryptoErr("unsupported decrypt algorithm: " + ck.Algo.Name)
		}
	})

	ctx.SetGoFunc("__go_cryptoSubtleDeriveBits", func(_ context.Context, args ...any) (any, error) {
		return cryptoErr("deriveBits not yet implemented (P1 feature)")
	})
}

func pkcs7Pad(data []byte, blockSize int) []byte {
	pad := blockSize - len(data)%blockSize
	padded := make([]byte, len(data)+pad)
	copy(padded, data)
	for i := len(data); i < len(padded); i++ {
		padded[i] = byte(pad)
	}
	return padded
}

// pkcs7Unpad removes PKCS#7 padding and validates all padding bytes in constant
// time to prevent padding oracle attacks.
func pkcs7Unpad(data []byte, blockSize int) ([]byte, error) {
	if len(data) == 0 || len(data)%blockSize != 0 {
		return nil, fmt.Errorf("invalid data length")
	}
	pad := int(data[len(data)-1])
	if pad == 0 || pad > blockSize {
		return nil, fmt.Errorf("invalid padding byte")
	}
	var invalid byte
	for i := len(data) - pad; i < len(data); i++ {
		invalid |= data[i] ^ byte(pad)
	}
	if invalid != 0 {
		return nil, fmt.Errorf("invalid padding")
	}
	return data[:len(data)-pad], nil
}
