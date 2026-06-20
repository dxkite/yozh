package netlifyruntime

import (
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

	"github.com/fastschema/qjs"
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

func injectCryptoSubtle(ctx *qjs.Context, keyReg map[string]*cryptoKey) {
	errVal := func(msg string) (*qjs.Value, error) {
		return ctx.NewString("ERROR:" + msg), nil
	}

	// __cryptoSubtleDigest(algo, dataB64) → resultB64
	ctx.SetFunc("__cryptoSubtleDigest", func(this *qjs.This) (*qjs.Value, error) {
		args := this.Args()
		if len(args) < 2 {
			return errVal("missing arguments")
		}
		algo := strings.ToUpper(args[0].String())
		data, err := base64.StdEncoding.DecodeString(args[1].String())
		if err != nil {
			return errVal("invalid base64: " + err.Error())
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
			return errVal("unsupported digest algorithm: " + algo)
		}
		return ctx.NewString(base64.StdEncoding.EncodeToString(h)), nil
	})

	// __cryptoSubtleImportKey(format, dataB64orJWK, algoJSON, extractable, usagesJSON) → keyId
	ctx.SetFunc("__cryptoSubtleImportKey", func(this *qjs.This) (*qjs.Value, error) {
		args := this.Args()
		if len(args) < 5 {
			return errVal("missing arguments")
		}
		format := args[0].String()
		rawData := args[1].String()
		var algo algoSpec
		if err := json.Unmarshal([]byte(args[2].String()), &algo); err != nil {
			return errVal("invalid algorithm JSON: " + err.Error())
		}
		extractable := args[3].String() == "true"
		var usages []string
		if err := json.Unmarshal([]byte(args[4].String()), &usages); err != nil {
			return errVal("invalid usages JSON: " + err.Error())
		}

		var keyBytes []byte
		switch format {
		case "raw":
			b, err := base64.StdEncoding.DecodeString(rawData)
			if err != nil {
				return errVal("invalid base64 key data: " + err.Error())
			}
			keyBytes = b
		case "jwk":
			var jwk map[string]interface{}
			if err := json.Unmarshal([]byte(rawData), &jwk); err != nil {
				return errVal("invalid JWK: " + err.Error())
			}
			kStr, _ := jwk["k"].(string)
			if kStr == "" {
				return errVal("JWK missing k field")
			}
			b, err := base64.RawURLEncoding.DecodeString(kStr)
			if err != nil {
				return errVal("invalid JWK k field: " + err.Error())
			}
			keyBytes = b
		default:
			return errVal("unsupported key format: " + format)
		}

		id, err := newKeyID()
		if err != nil {
			return errVal(err.Error())
		}
		keyReg[id] = &cryptoKey{
			ID:          id,
			Type:        "secret",
			Algo:        algo,
			Raw:         keyBytes,
			Extractable: extractable,
			Usages:      usages,
		}
		return ctx.NewString(id), nil
	})

	// __cryptoSubtleGenerateKey(algoJSON, extractable, usagesJSON) → keyId
	ctx.SetFunc("__cryptoSubtleGenerateKey", func(this *qjs.This) (*qjs.Value, error) {
		args := this.Args()
		if len(args) < 3 {
			return errVal("missing arguments")
		}
		var algo algoSpec
		if err := json.Unmarshal([]byte(args[0].String()), &algo); err != nil {
			return errVal("invalid algorithm JSON: " + err.Error())
		}
		extractable := args[1].String() == "true"
		var usages []string
		if err := json.Unmarshal([]byte(args[2].String()), &usages); err != nil {
			return errVal("invalid usages JSON: " + err.Error())
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
				keyLen = 32 // SHA-256
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
				keyLen = 32 // 256-bit
			}
		default:
			return errVal("unsupported generateKey algorithm: " + algo.Name)
		}

		keyBytes := make([]byte, keyLen)
		if _, err := rand.Read(keyBytes); err != nil {
			return errVal("rand: " + err.Error())
		}
		id, err := newKeyID()
		if err != nil {
			return errVal(err.Error())
		}
		keyReg[id] = &cryptoKey{
			ID:          id,
			Type:        "secret",
			Algo:        algo,
			Raw:         keyBytes,
			Extractable: extractable,
			Usages:      usages,
		}
		return ctx.NewString(id), nil
	})

	// __cryptoSubtleExportKey(format, keyId) → base64 or JWK JSON string
	ctx.SetFunc("__cryptoSubtleExportKey", func(this *qjs.This) (*qjs.Value, error) {
		args := this.Args()
		if len(args) < 2 {
			return errVal("missing arguments")
		}
		format := args[0].String()
		keyID := args[1].String()
		ck, ok := keyReg[keyID]
		if !ok {
			return errVal("key not found: " + keyID)
		}
		if !ck.Extractable {
			return errVal("key is not extractable")
		}

		switch format {
		case "raw":
			return ctx.NewString(base64.StdEncoding.EncodeToString(ck.Raw)), nil
		case "jwk":
			jwk := map[string]interface{}{
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
			return ctx.NewString(string(j)), nil
		default:
			return errVal("unsupported export format: " + format)
		}
	})

	// __cryptoSubtleSign(algoJSON, keyId, dataB64) → sigB64
	ctx.SetFunc("__cryptoSubtleSign", func(this *qjs.This) (*qjs.Value, error) {
		args := this.Args()
		if len(args) < 3 {
			return errVal("missing arguments")
		}
		keyID := args[1].String()
		data, err := base64.StdEncoding.DecodeString(args[2].String())
		if err != nil {
			return errVal("invalid data base64: " + err.Error())
		}

		ck, ok := keyReg[keyID]
		if !ok {
			return errVal("key not found: " + keyID)
		}

		switch strings.ToUpper(ck.Algo.Name) {
		case "HMAC":
			hashName := ck.Algo.Hash
			if hashName == "" {
				hashName = "SHA-256"
			}
			newH, err := makeHasher(hashName)
			if err != nil {
				return errVal(err.Error())
			}
			mac := hmac.New(newH, ck.Raw)
			mac.Write(data)
			return ctx.NewString(base64.StdEncoding.EncodeToString(mac.Sum(nil))), nil
		default:
			return errVal("unsupported sign algorithm: " + ck.Algo.Name)
		}
	})

	// __cryptoSubtleVerify(algoJSON, keyId, sigB64, dataB64) → "true"/"false"
	ctx.SetFunc("__cryptoSubtleVerify", func(this *qjs.This) (*qjs.Value, error) {
		args := this.Args()
		if len(args) < 4 {
			return ctx.NewString("false"), nil
		}
		keyID := args[1].String()
		sig, err1 := base64.StdEncoding.DecodeString(args[2].String())
		data, err2 := base64.StdEncoding.DecodeString(args[3].String())
		if err1 != nil || err2 != nil {
			return ctx.NewString("false"), nil
		}

		ck, ok := keyReg[keyID]
		if !ok {
			return ctx.NewString("false"), nil
		}

		switch strings.ToUpper(ck.Algo.Name) {
		case "HMAC":
			hashName := ck.Algo.Hash
			if hashName == "" {
				hashName = "SHA-256"
			}
			newH, err := makeHasher(hashName)
			if err != nil {
				return ctx.NewString("false"), nil
			}
			mac := hmac.New(newH, ck.Raw)
			mac.Write(data)
			if hmac.Equal(sig, mac.Sum(nil)) {
				return ctx.NewString("true"), nil
			}
			return ctx.NewString("false"), nil
		default:
			return ctx.NewString("false"), nil
		}
	})

	// __cryptoSubtleEncrypt(algoJSON, keyId, plaintextB64) → ciphertextB64
	// algoJSON.iv is base64-encoded (converted by _algoToJSON in JS)
	ctx.SetFunc("__cryptoSubtleEncrypt", func(this *qjs.This) (*qjs.Value, error) {
		args := this.Args()
		if len(args) < 3 {
			return errVal("missing arguments")
		}
		var algo algoSpec
		if err := json.Unmarshal([]byte(args[0].String()), &algo); err != nil {
			return errVal("invalid algorithm JSON: " + err.Error())
		}
		keyID := args[1].String()
		plaintext, err := base64.StdEncoding.DecodeString(args[2].String())
		if err != nil {
			return errVal("invalid data base64: " + err.Error())
		}

		ck, ok := keyReg[keyID]
		if !ok {
			return errVal("key not found: " + keyID)
		}

		switch strings.ToUpper(ck.Algo.Name) {
		case "AES-GCM":
			iv, err := base64.StdEncoding.DecodeString(algo.IV)
			if err != nil {
				return errVal("invalid IV base64: " + err.Error())
			}
			block, err := aes.NewCipher(ck.Raw)
			if err != nil {
				return errVal("AES cipher: " + err.Error())
			}
			gcm, err := cipher.NewGCM(block)
			if err != nil {
				return errVal("GCM init: " + err.Error())
			}
			if len(iv) != gcm.NonceSize() {
				return errVal(fmt.Sprintf("AES-GCM: IV must be %d bytes, got %d", gcm.NonceSize(), len(iv)))
			}
			ciphertext := gcm.Seal(nil, iv, plaintext, nil)
			return ctx.NewString(base64.StdEncoding.EncodeToString(ciphertext)), nil
		case "AES-CBC":
			iv, err := base64.StdEncoding.DecodeString(algo.IV)
			if err != nil {
				return errVal("invalid IV base64: " + err.Error())
			}
			if len(iv) != aes.BlockSize {
				return errVal(fmt.Sprintf("AES-CBC: IV must be %d bytes, got %d", aes.BlockSize, len(iv)))
			}
			block, err := aes.NewCipher(ck.Raw)
			if err != nil {
				return errVal("AES cipher: " + err.Error())
			}
			padded := pkcs7Pad(plaintext, aes.BlockSize)
			mode := cipher.NewCBCEncrypter(block, iv)
			ciphertext := make([]byte, len(padded))
			mode.CryptBlocks(ciphertext, padded)
			return ctx.NewString(base64.StdEncoding.EncodeToString(ciphertext)), nil
		default:
			return errVal("unsupported encrypt algorithm: " + ck.Algo.Name)
		}
	})

	// __cryptoSubtleDecrypt(algoJSON, keyId, ciphertextB64) → plaintextB64
	ctx.SetFunc("__cryptoSubtleDecrypt", func(this *qjs.This) (*qjs.Value, error) {
		args := this.Args()
		if len(args) < 3 {
			return errVal("missing arguments")
		}
		var algo algoSpec
		if err := json.Unmarshal([]byte(args[0].String()), &algo); err != nil {
			return errVal("invalid algorithm JSON: " + err.Error())
		}
		keyID := args[1].String()
		ciphertext, err := base64.StdEncoding.DecodeString(args[2].String())
		if err != nil {
			return errVal("invalid data base64: " + err.Error())
		}

		ck, ok := keyReg[keyID]
		if !ok {
			return errVal("key not found: " + keyID)
		}

		switch strings.ToUpper(ck.Algo.Name) {
		case "AES-GCM":
			iv, err := base64.StdEncoding.DecodeString(algo.IV)
			if err != nil {
				return errVal("invalid IV base64: " + err.Error())
			}
			block, err := aes.NewCipher(ck.Raw)
			if err != nil {
				return errVal("AES cipher: " + err.Error())
			}
			gcm, err := cipher.NewGCM(block)
			if err != nil {
				return errVal("GCM init: " + err.Error())
			}
			if len(iv) != gcm.NonceSize() {
				return errVal(fmt.Sprintf("AES-GCM: IV must be %d bytes, got %d", gcm.NonceSize(), len(iv)))
			}
			plaintext, err := gcm.Open(nil, iv, ciphertext, nil)
			if err != nil {
				return errVal("AES-GCM decrypt failed: " + err.Error())
			}
			return ctx.NewString(base64.StdEncoding.EncodeToString(plaintext)), nil
		case "AES-CBC":
			iv, err := base64.StdEncoding.DecodeString(algo.IV)
			if err != nil {
				return errVal("invalid IV base64: " + err.Error())
			}
			if len(iv) != aes.BlockSize {
				return errVal(fmt.Sprintf("AES-CBC: IV must be %d bytes, got %d", aes.BlockSize, len(iv)))
			}
			block, err := aes.NewCipher(ck.Raw)
			if err != nil {
				return errVal("AES cipher: " + err.Error())
			}
			if len(ciphertext)%aes.BlockSize != 0 {
				return errVal("AES-CBC: ciphertext length not multiple of block size")
			}
			plaintext := make([]byte, len(ciphertext))
			cipher.NewCBCDecrypter(block, iv).CryptBlocks(plaintext, ciphertext)
			unpadded, err := pkcs7Unpad(plaintext, aes.BlockSize)
			if err != nil {
				return errVal("AES-CBC unpad: " + err.Error())
			}
			return ctx.NewString(base64.StdEncoding.EncodeToString(unpadded)), nil
		default:
			return errVal("unsupported decrypt algorithm: " + ck.Algo.Name)
		}
	})

	// __cryptoSubtleDeriveBits — P1, not yet implemented
	ctx.SetFunc("__cryptoSubtleDeriveBits", func(this *qjs.This) (*qjs.Value, error) {
		return errVal("deriveBits not yet implemented (P1 feature)")
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
	// Verify all padding bytes in constant time (no early exit).
	var invalid byte
	for i := len(data) - pad; i < len(data); i++ {
		invalid |= data[i] ^ byte(pad)
	}
	if invalid != 0 {
		return nil, fmt.Errorf("invalid padding")
	}
	return data[:len(data)-pad], nil
}
