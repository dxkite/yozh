module github.com/dxkite/astro-runtime

go 1.25.0

require (
	github.com/dxkite/qjs v0.0.0-20260622114755-c90f6e2b5afd
	github.com/evanw/esbuild v0.25.0
	golang.org/x/image v0.43.0
)

replace github.com/dxkite/qjs => ../qjs

require (
	github.com/tetratelabs/wazero v1.9.0 // indirect
	golang.org/x/sys v0.0.0-20220715151400-c0bba94af5f8 // indirect
)
