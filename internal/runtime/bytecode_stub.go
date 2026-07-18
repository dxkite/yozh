//go:build !qjs

package jsruntime

import "fmt"

// CompileBundleBytecode is not available without the qjs build tag.
func CompileBundleBytecode(_ []byte) ([]byte, error) {
	return nil, fmt.Errorf("QJS not compiled; rebuild with: go build -tags qjs")
}

// CompileBytecodes is not available without the qjs build tag.
func CompileBytecodes(_ JSContext, _ []byte, _ []byte) (*BytecodeSet, error) {
	return nil, fmt.Errorf("QJS not compiled; rebuild with: go build -tags qjs")
}
