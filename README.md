# astro-runtime

在不依赖 Node.js 或任何云平台 CLI 的情况下，运行 `@astrojs/netlify` 适配器编译的 Astro SSR 应用。

基于 [QuickJS-NG](https://github.com/nicowillis/quickjs-ng)（通过 [wazero](https://wazero.io) 嵌入）实现 JavaScript 执行；单个静态 Go 二进制，零运行时依赖。

```bash
astro-runtime serve --pack bundle.pack --port 8888
```

---

## 特性

- **无 Node.js 依赖** — 静态二进制，`CGO_ENABLED=0`，可直接跑在 Alpine / scratch 镜像
- **Pool 并发模型** — 多个 QJS worker 并行处理请求，高并发渲染不阻塞
- **Pack 格式** — 单文件部署（bundle.mjs + bytecode + dist/），无 node_modules
- **流式响应** — SSR 结果逐 chunk 流式写入 HTTP 响应，首字节延迟低
- **Server-Timing** — 响应头 + HTTP trailer 携带 pool-get / js-eval / response-write 耗时
- **图片 CDN** — `/.netlify/images` resize / crop / format 转换（JPEG / PNG / WebP → AVIF）
- **BFF 模式** — 作为 Go 库嵌入，`Pool.Get + HandleRequest` 按需渲染 Astro 页面
- **结构化日志** — slog JSON 输出，含 method / path / status / latency / client_ip

---

## 快速开始

### 1. 构建

```bash
go install github.com/dxkite/astro-runtime/cmd@latest
# 或从源码
git clone https://github.com/dxkite/astro-runtime
cd astro-runtime
go build -o astro-runtime ./cmd
```

### 2. 打包 Astro 项目

```bash
# 先 astro build（生成 .netlify/build/entry.mjs 和 dist/）
cd your-astro-project
pnpm exec astro build

# 生成 bundle.pack（单文件，含 bytecode + 静态资产）
astro-runtime build --pack \
  --entry .netlify/build/entry.mjs \
  --dist dist \
  --out bundle.pack
```

### 3. 启动服务

```bash
astro-runtime serve --pack bundle.pack --port 8888
# → http://localhost:8888
```

---

## CLI 参考

### `build` — 打包 Astro SSR 产物

```
astro-runtime build [--plain | --bytecode | --pack] --entry <path> [options]
```

| 参数 | 说明 |
|---|---|
| `--entry` | SSR entry 路径（默认 `.netlify/build/entry.mjs`） |
| `--plain` | 输出自包含 JS bundle（`.mjs`） |
| `--bytecode` | 输出 QuickJS 字节码（`.bc`） |
| `--pack` | 输出部署包（`.pack`，含 bundle.mjs + bundle.bc + dist/） |
| `--dist` | 静态输出目录（`--pack` 时打包进去，默认 `dist`） |
| `--out` | 输出路径（默认由模式决定） |

### `serve` — 启动 SSR HTTP 服务

```
astro-runtime serve [--pack <path> | --bundle <path> | --entry <path>] [options]
```

| 参数 | 默认值 | 说明 |
|---|---|---|
| `--pack` | — | `.pack` 文件（自包含，推荐生产） |
| `--bundle` | — | 预打包 `.mjs` |
| `--entry` | — | SSR entry（启动时实时打包，适合开发） |
| `--dist` | `dist` | 静态资产目录（`--bundle` / `--entry` 时使用） |
| `--port` | `8888` | 监听端口 |
| `--cache-dir` | `$XDG_CACHE_HOME/astro-runtime` | 字节码缓存目录（空字符串禁用） |

> 未指定任何模式时，自动按 `bundle.pack` → `bundle.mjs` → `entry.mjs` 顺序探测。

---

## Docker 部署

```dockerfile
FROM ghcr.io/dxkite/astro-runtime:latest
# 或自行构建：docker build -t astro-runtime .
```

```yaml
# docker-compose.yml
services:
  app:
    image: astro-runtime
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
import astroruntime "github.com/dxkite/astro-runtime"
```

### 从 pack 文件启动服务

```go
rt, err := astroruntime.NewRuntime(
    astroruntime.WithPackFile("bundle.pack"),
    astroruntime.WithCacheDir("/tmp/astro-cache"),
    astroruntime.WithPoolOptions(
        astroruntime.WithEnv(map[string]string{"NODE_ENV": "production"}),
        astroruntime.WithSize(4),
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
rt, _ := astroruntime.NewRuntime(
    astroruntime.WithPack(packBytes),
    astroruntime.WithPoolOptions(astroruntime.WithSize(2)),
)
defer rt.Close()

mux := http.NewServeMux()
mux.Handle("/app/", http.StripPrefix("/app", rt)) // rt 实现 http.Handler
http.ListenAndServe(":8080", mux)
```

### 打包 SSR bundle

```go
// entry.mjs → esbuild 内联 → QuickJS 字节码 → .pack
jsCode, _ := astroruntime.BundleSSR("/path/to/entry.mjs")
err = astroruntime.BuildPack("bundle.pack", jsCode, "/path/to/dist")
```

---

## 性能

在 Apple M5 / Docker 容器（10 vCPU，ab -c 32）下的测试结果：

| 路由 | astro-runtime | Node.js V8 | 说明 |
|---|---|---|---|
| `/api/products`（JSON API） | 2,368 RPS | 8,952 RPS | V8 JIT 在轻计算场景快 3.8× |
| `/`（首页，含 fetch + 渲染） | **2,237 RPS** | 1,190 RPS | Go pool 并发快 1.9× |

**镜像大小**：astro-runtime 42 MB vs Node.js SSR 228 MB（小 5.4×）。

> QuickJS 是 bytecode 解释器（无 JIT），纯计算速度约为 V8 的 1/6；但 Go 的并发 pool 模型在高并发复杂渲染场景下可超越 Node.js 单线程事件循环。详见 [docs/benchmark.md](./docs/benchmark.md)。

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
../../astro-runtime build --pack \
  --entry .netlify/build/entry.mjs --dist dist --out example.pack
../../astro-runtime serve --pack example.pack --port 8888

# 直接 serve（开发）
../../astro-runtime serve \
  --entry .netlify/build/entry.mjs --dist dist --port 8888
```

---

## 依赖

| 依赖 | 用途 |
|---|---|
| [dxkite/qjs](https://github.com/dxkite/qjs) | QuickJS-NG via wazero — JS 引擎 |
| [tetratelabs/wazero](https://github.com/tetratelabs/wazero) | 纯 Go WebAssembly 运行时 |
| [evanw/esbuild](https://github.com/evanw/esbuild) | ESM bundle 打包（`BundleSSR`） |
| [spf13/cobra](https://github.com/spf13/cobra) | CLI 命令框架 |

---

## License

MIT
