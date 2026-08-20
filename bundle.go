package yozh

import "github.com/dxkite/yozh/pkg/node"

func BundleSSR(entryPath string) ([]byte, error)      { return node.BundleSSR(entryPath) }
func BundleSSRGoja(entryPath string) ([]byte, error)  { return node.BundleSSRGoja(entryPath) }
func BundleSSRReact(entryPath string) ([]byte, error) { return node.BundleSSRReact(entryPath) }
func ConvertBundleForGoja(esm []byte) ([]byte, error) { return node.ConvertBundleForGoja(esm) }
