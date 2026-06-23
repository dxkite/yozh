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
| [testing.md](./testing.md) | 测试环境、测试用例（51 个）、调试问题记录 |

## 快速开始

```bash
# 构建 CLI
git clone https://github.com/dxkite/astro-runtime
cd astro-runtime
go build -o astro-runtime ./cmd

# 在已有 Astro + Netlify 项目中运行（先 astro build）

# 方式一：pack（推荐，含静态文件，部署最简单）
./astro-runtime build --pack --entry .netlify/build/entry.mjs --dist dist --out bundle.pack
./astro-runtime serve --pack bundle.pack --port 8888

# 方式二：bundle（预打包 .mjs + 独立 dist 目录）
./astro-runtime build --plain --entry .netlify/build/entry.mjs --out bundle.mjs
./astro-runtime serve --bundle bundle.mjs --dist dist --port 8888

# 方式三：entry（实时打包，适合开发）
./astro-runtime serve --entry .netlify/build/entry.mjs --dist dist --port 8888
```

## CLI 命令

### `build` — 打包 Astro SSR 产物

```bash
astro-runtime build [--plain | --bytecode | --pack] [--entry path] [--dist dir] [--out path]
```

| 参数 | 默认值 | 说明 |
|---|---|---|
| `--entry` | `.netlify/build/entry.mjs` | SSR entry 路径（先 `astro build`） |
| `--dist` | `dist` | 静态输出目录（`--pack` 时打包进去） |
| `--plain` | — | 输出自包含 JS bundle（`.mjs`） |
| `--bytecode` | — | 输出 QuickJS 字节码（`.bc`） |
| `--pack` | — | 输出部署包（`.pack`，含 bundle.mjs + bundle.bc + dist/） |
| `--out` | 依模式而定 | 输出路径 |

### `serve` — 启动 SSR 服务

```bash
astro-runtime serve [--pack path | --bundle path | --entry path] [--dist dir] [--port N]
```

| 参数 | 默认值 | 说明 |
|---|---|---|
| `--pack` | — | .pack 文件（自包含，无需 --dist） |
| `--bundle` | — | 预打包 .mjs |
| `--entry` | — | SSR entry（启动时实时打包） |
| `--dist` | `dist` | 静态输出目录（--bundle/--entry 时使用） |
| `--port` | `8888` | 监听端口 |
| `--cache-dir` | `$XDG_CACHE_HOME/astro-runtime` | 字节码/pack 解压缓存目录（空字符串禁用） |
| `--trace` | false | 打印每次请求的 span 耗时到 stderr |

自动检测：未指定任何模式时，按 `bundle.pack` → `bundle.mjs` → `entry.mjs` 顺序探测。

## 示例应用

`examples/example` — 完整功能示例（商品列表、购物车会话、HMAC token、AES-GCM、BFF 聚合、图片 CDN）

```bash
cd examples/example
pnpm install
pnpm build

# 方式一：serve from pack
../../astro-runtime build --pack --entry .netlify/build/entry.mjs --dist dist --out example.pack
../../astro-runtime serve --pack example.pack --port 8888

# 方式二：直接 serve
../../astro-runtime serve --entry .netlify/build/entry.mjs --dist dist --port 8888
```

测试路由：
- `GET /` — 商品列表（含 Image 组件）
- `GET /products/:id` — 商品详情
- `GET /cart` — 购物车页（Cookie 会话）
- `GET /greet/:name` — 动态路由
- `GET /api/products` — 商品列表 JSON
- `GET /api/products/:id` — 单个商品 JSON
- `GET /POST /api/cart` — 购物车（AES-GCM Cookie 加密会话）
- `GET /api/time` — 服务端时间
- `GET /api/token?user=X` — HMAC 签名 token
- `POST /api/token` — HMAC 验证 token
- `GET /api/summary` — BFF 聚合（并发 fetch）
- `GET /.netlify/images?url=...` — 图片 CDN（resize/crop/format）

## 作为库使用

### 构建 pack

```go
import astroruntime "github.com/dxkite/astro-runtime"

// 1. 从 entry.mjs 打包（esbuild + QJS 字节码）
jsCode, err := astroruntime.BundleSSR("/path/to/entry.mjs")

// 2. 编译字节码
bc, err := astroruntime.CompileBundleBytecode(jsCode)

// 3. 打包为 .pack（bundle.mjs + bundle.bc + dist/）
err = astroruntime.BuildPack("out.pack", jsCode, "/path/to/dist")
```

### 从 pack 启动服务

```go
rt, err := astroruntime.NewRuntime(
    astroruntime.WithPackFile("out.pack"),
    astroruntime.WithCacheDir("/tmp/astro-cache"),         // 可选，持久解压缓存
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

### 从 bundle 启动服务

```go
jsCode, _ := os.ReadFile("bundle.mjs")
rt, err := astroruntime.NewRuntime(
    astroruntime.WithBundle(jsCode),
    astroruntime.WithDistDir("/path/to/dist"),
    astroruntime.WithCacheDir("/tmp/cache"),
    astroruntime.WithPoolOptions(astroruntime.WithEnv(envMap())),
)
defer rt.Close()
rt.ListenAndServe(":8888")
```

### 内嵌于现有 HTTP 服务

```go
rt, _ := astroruntime.NewRuntime(
    astroruntime.WithPack(packBytes),    // 从内存加载
    astroruntime.WithPoolOptions(astroruntime.WithSize(2)),
)
defer rt.Close()

mux := http.NewServeMux()
mux.Handle("/app/", http.StripPrefix("/app", rt))   // rt 实现 http.Handler
http.ListenAndServe(":8080", mux)
```

### RuntimeOption 完整列表

| 选项 | 说明 |
|---|---|
| `WithPack(data []byte)` | 内存 pack bytes |
| `WithPackReader(r io.Reader)` | 从 io.Reader 读取 pack |
| `WithPackFile(path string)` | .pack 文件路径 |
| `WithBundle(code []byte)` | 原始 JS bundle bytes |
| `WithDistFS(fsys fs.FS)` | 静态资产 FS（bundle 模式时使用） |
| `WithDistDir(path string)` | 静态资产目录（等同 WithDistFS(os.DirFS(path))） |
| `WithCacheDir(dir string)` | 缓存目录（pack 解压 / 字节码缓存） |
| `WithPoolOptions(opts ...PoolOption)` | 传递 PoolOption（WithEnv、WithSize 等） |
