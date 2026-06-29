package jsruntime

import "fmt"

// CompileBundleBytecode is not supported by this build.
func CompileBundleBytecode(_ []byte) ([]byte, error) {
	return nil, fmt.Errorf("bytecode compilation not supported")
}

// CompileBytecodes is not supported by this build.
func CompileBytecodes(_ JSContext, _ []byte, _ []byte) (*BytecodeSet, error) {
	return nil, fmt.Errorf("bytecode compilation not supported")
}
