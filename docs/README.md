# astro-runtime 文档索引

用于网站模板 SSR + BFF Render 的 Go + QuickJS 运行时。
在不依赖任何云平台 CLI 的情况下，本地或服务端直接运行 `@astrojs/netlify` 适配器编译的 Astro SSR 函数。

## 文档列表

| 文档 | 内容 |
|---|---|
| [adapter-selection.md](./adapter-selection.md) | 项目定位、适配器选型依据、BFF Render 架构说明 |
| [design.md](./design.md) | 整体架构、数据流、关键设计决策、依赖说明 |
| [components.md](./components.md) | 各 Go/JS 文件的职责、接口、实现细节 |
| [polyfills.md](./polyfills.md) | 每个 polyfill 的存在原因、边界、已知局限 |
| [testing.md](./testing.md) | 测试环境、测试用例（31 个）、调试问题记录 |

## 快速开始

```bash
# 构建
git clone https://github.com/dxkite/astro-runtime
cd astro-runtime
go build -o astro-runtime.exe ./cmd

# 在已有 Astro + Netlify 项目中运行（先 astro build）
./astro-runtime.exe \
  -ssr .netlify/build/entry.mjs \
  -dist dist \
  -port 8888
# 字节码缓存默认开启（$XDG_CACHE_HOME/astro-runtime），-cache-dir="" 禁用
```

## 示例应用

`examples/testapp-ssr` — 完整功能示例（商品列表、购物车、Cookie 会话）

```bash
./astro-runtime.exe \
  -ssr examples/testapp-ssr/.netlify/build/entry.mjs \
  -dist examples/testapp-ssr/dist
```

测试路由：
- `GET /` — 商品列表
- `GET /products/:id` — 商品详情
- `GET /cart` — 购物车页
- `GET /api/products` — 商品 JSON
- `GET /api/products/:id` — 单商品 JSON
- `GET/POST /api/cart` — 购物车（需 Cookie: user-id=xxx）

## 作为库使用

```go
import astroruntime "github.com/dxkite/astro-runtime"

code, _ := astroruntime.BundleSSR("/path/to/entry.mjs")
pool, _ := astroruntime.NewPool(code, envMap, 4)
defer pool.Close()

http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
    astroruntime.HandleSSR(pool, w, r)
})
```
