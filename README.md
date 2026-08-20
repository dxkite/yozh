# yozh

在不依赖 Node.js 或任何云平台 CLI 的情况下，运行 `@astrojs/netlify` 适配器编译的 Astro SSR 应用。

JS 引擎基于 [goja/sobek](https://github.com/grafana/sobek)（纯 Go，无 WASM）。单个静态 Go 二进制，零运行时依赖。

```bash
yozh serve --pack bundle.pack --port 8888
```

---

## 特性

- **无 Node.js 依赖** — 静态二进制，`CGO_ENABLED=0`，可直接跑在 Alpine / scratch 镜像
- **goja 引擎** — 纯 Go JS 运行时（`grafana/sobek`），无 WASM、无 CGO
- **Pool 并发模型** — 多个 JS worker 并行处理请求，高并发渲染不阻塞
- **Pack 格式** — 单文件部署（bundle.mjs + dist/），无 node_modules
- **AsyncIterator buffer → Content-Length** — Astro 典型路径（`renderToAsyncIterable`）在 JS 侧收集全部 chunk 后单次写入，附带精确的 `Content-Length`；ReadableStream 路径走 Chunked Transfer-Encoding
- **Server-Timing** — 响应头携带 `pool;dur=X, js;dur=Y`（Go 端）+ `ssr;dur=A, resp;dur=B`（JS 端，buffer 模式注入初始头，stream 模式写 trailer）
- **图片 CDN** — `/.netlify/images` resize / crop / format 转换（JPEG / PNG / WebP → AVIF）
- **BFF 模式** — 作为 Go 库嵌入，`Pool.Get + HandleRequest` 按需渲染 Astro 页面
- **结构化日志** — slog JSON 输出，含 method / path / status / latency / client_ip

---

## 快速开始

### 1. 构建

```bash
go install github.com/dxkite/yozh/cmd@latest
# 或从源码
git clone https://github.com/dxkite/yozh
cd yozh
go build -o yozh ./cmd
```

### 2. 打包 Astro 项目

```bash
# 先 astro build（生成 .netlify/build/entry.mjs 和 dist/）
cd your-astro-project
pnpm exec astro build

# 生成 bundle.pack（单文件，含 goja bundle + 静态资产）
yozh build --pack \
  --entry .netlify/build/entry.mjs \
  --dist dist \
  --out bundle.pack
```

### 3. 启动服务

```bash
yozh serve --pack bundle.pack --port 8888
# → http://localhost:8888
```

---

## CLI 参考

### `build` — 打包 Astro SSR 产物

```
yozh build [--pack] --entry <path> [options]
```

| 参数 | 说明 |
|---|---|
| `--entry` | SSR entry 路径（默认 `.netlify/build/entry.mjs`） |
| `--kind` | entry 类型：`astro`（Netlify SSR，默认）或 `react`（JSX/TSX，浏览器条件） |
| `--pack` | 输出部署包（`.pack`，含 bundle.mjs + dist/） |
| `--dist` | 静态输出目录（`--pack` 时打包进去，默认 `dist`） |
| `--out` | 输出路径（默认由模式决定） |

### `serve` — 启动 SSR HTTP 服务

```
yozh serve [--pack <path> | --bundle <path> | --entry <path>] [options]
```

| 参数 | 默认值 | 说明 |
|---|---|---|
| `--pack` | — | `.pack` 文件（自包含，推荐生产） |
| `--bundle` | — | 预打包 `.mjs` |
| `--entry` | — | SSR entry（启动时实时打包，适合开发） |
| `--dist` | `dist` | 静态资产目录（`--bundle` / `--entry` 时使用） |
| `--port` | `8888` | 监听端口 |
| `--cache-dir` | `$XDG_CACHE_HOME/yozh` | pack 解压缓存目录（空字符串禁用） |
| `--pack-cache-size` | `0`（默认 3） | 最多保留的解压缓存目录数（负数为不限） |
| `--bootstrap` | — | 自定义 bootstrap `.js` 文件路径 |
| `--polyfill` | — | 替换全部内置 polyfill 的 JS 文件路径 |

> 未指定任何模式时，自动按 `bundle.pack` → `bundle.mjs` → `entry.mjs` 顺序探测。

---

## Docker 部署

```dockerfile
FROM ghcr.io/dxkite/yozh:latest
# 或自行构建：docker build -t yozh .
```

```yaml
# docker-compose.yml
services:
  app:
    image: yozh
    ports:
      - "8080:8080"
    volumes:
      - ./bundle.pack:/data/bundle.pack:ro
      - pack-cache:/cache

volumes:
  pack-cache:
```

镜像基于 `alpine:3.22`，压缩后 **~11 MB**，无 C++ 动态依赖。

---

## 作为 Go 库使用

```go
import yozh "github.com/dxkite/yozh"
```

### 从 pack 文件启动服务

```go
rt, err := yozh.NewRuntime(
    yozh.WithPackFile("bundle.pack"),
    yozh.WithCacheDir("/tmp/astro-cache"),
    yozh.WithPoolOptions(
        yozh.WithEnv(map[string]string{"NODE_ENV": "production"}),
        yozh.WithSize(4),
    ),
)
if err != nil {
    log.Fatal(err)
}
defer rt.Close()

log.Fatal(rt.ListenAndServe(":8888"))
```

### 嵌入现有 HTTP 服务（BFF 模式）

```go
rt, _ := yozh.NewRuntime(
    yozh.WithPack(packBytes),
    yozh.WithPoolOptions(yozh.WithSize(2)),
)
defer rt.Close()

mux := http.NewServeMux()
mux.Handle("/app/", http.StripPrefix("/app", rt)) // rt 实现 http.Handler
http.ListenAndServe(":8080", mux)
```

### 打包 SSR bundle

```go
// entry.mjs → esbuild 内联 → goja 格式转换 → .pack
jsCode, _ := yozh.BundleSSR("/path/to/entry.mjs")
err = yozh.BuildPack("bundle.pack", jsCode, "/path/to/dist")
```

---

## 性能

Apple M5，10 CPU，`go test -bench`（pool size=4，GOMAXPROCS=10）：

### Pool 冷启动

| size=1 | size=4 |
|---|---|
| **1.1 ms** | **4.7 ms** |

goja 是纯 Go 实现，无需 WASM 初始化，冷启动很快。

### 真实 Astro 应用 vs Node.js V8

轻计算的 JSON API / 动态路由场景下，V8 JIT 领先明显；而在高并发、含 outbound fetch 的复杂页面渲染场景下，Go pool 的并发模型可以反超 Node.js 单线程事件循环。完整数据见 [docs/benchmark.md](./docs/benchmark.md)。

**镜像大小**：yozh ~42 MB vs Node.js SSR 228 MB（小 **5.4×**）。

---

## 文档

| 文档 | 内容 |
|---|---|
| [docs/adapter-selection.md](./docs/adapter-selection.md) | 项目定位、适配器选型、BFF Render 架构 |
| [docs/design.md](./docs/design.md) | 整体架构、数据流、关键设计决策 |
| [docs/components.md](./docs/components.md) | 各文件职责与接口 |
| [docs/bundle.md](./docs/bundle.md) | esbuild 打包流程、pack 格式 |
| [docs/polyfills.md](./docs/polyfills.md) | Web API polyfill 实现与边界 |
| [docs/testing.md](./docs/testing.md) | 测试环境与用例说明 |
| [docs/benchmark.md](./docs/benchmark.md) | 性能基准：vs Node.js、镜像大小、资源对比 |

---

## 示例应用

`examples/example` — 完整功能示例（商品列表、购物车会话、HMAC token、BFF 聚合、图片 CDN）：

```bash
cd examples/example
pnpm install && pnpm build

# pack 模式
../../yozh build --pack \
  --entry .netlify/build/entry.mjs --dist dist --out example.pack
../../yozh serve --pack example.pack --port 8888

# 直接 serve（开发）
../../yozh serve \
  --entry .netlify/build/entry.mjs --dist dist --port 8888
```

---

## 依赖

| 依赖 | 用途 |
|---|---|
| [grafana/sobek](https://github.com/grafana/sobek) | 纯 Go JS 引擎（goja fork） |
| [evanw/esbuild](https://github.com/evanw/esbuild) | ESM bundle 打包（`BundleSSR`） |
| [spf13/cobra](https://github.com/spf13/cobra) | CLI 命令框架 |
| [golang.org/x/image](https://pkg.go.dev/golang.org/x/image) | 图片 CDN（resize / crop / format 转换） |

---

## License

MIT
