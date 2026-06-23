# astro-runtime 设计文档

## 项目目标

在不依赖任何云平台 CLI 的情况下，直接运行 `@astrojs/netlify` 适配器编译的 Astro SSR 函数。
面向两个场景：**网站模板 SSR**（本地/私有服务器部署）和 **BFF Render**（Go 服务按需渲染 Astro 页面）。
详见 [adapter-selection.md](./adapter-selection.md)。

## 架构概览

```
HTTP 请求
    │
    ▼
Runtime.ServeHTTP（server.go）— 路由分发
    ├─ /.netlify/images?... → images.go (HandleImageCDN)
    │      resize/crop → encode JPEG/PNG（AVIF 源直接 ServeContent）
    │
    ├─ 静态文件命中 → serveStaticFS（distFS fs.FS）
    │
    └─ 未命中 → handler.go — 序列化请求 → JSON
                    │
                    ▼
               pool.go (Pool) — 阻塞直到有空闲 runtime
                    │
                    ▼
               QJS (dxkite/qjs → QuickJS-NG via wazero)
                 ├── js/         — Web API polyfills（8 个 JS 文件，//go:embed 嵌入）
                 ├── bundle CJS  — Astro SSR bundle（esbuild 打包；字节码缓存至磁盘）
                 └── glue.js     — __handleRequest: JSON → Request → __ssrHandler → 流式输出
                    │  __go_sendHeaders / __go_sendChunk / __go_endStream
                    ▼
               Go: 流式写入 HTTP 响应（headers → chunks → done）
```

## Pack 格式与加载流程

```
build --pack
    BundleSSR(entry.mjs)           → bundle.mjs（~500KB）
    CompileBundleBytecode(mjs)     → bundle.bc（~300KB，跳过 ~1.5s 启动编译）
    BuildPack(out, mjs, bc, dist/) → bundle.pack（zip）

serve --pack
    NewRuntime(WithPackFile)
        openPackFile → openPackInMemory（内存 zip FS）
                    or extractPackToCache（SHA256 keyed disk cache）
        NewPool(nil, WithPrecompiledBundle(bc), ...)
        Runtime{pool, distFS}
    rt.ListenAndServe(addr)
```

## 核心组件

| 文件 | 职责 |
|---|---|
| `cmd/main.go` | CLI 入口，build/serve 两个子命令，通过 SDK 串联所有组件 |
| `pack.go` | Pack 加载（openPackInMemory/File/ToCache）+ 构建（BuildPack/writePack） |
| `server.go` | `Runtime` 类型 + `NewRuntime(WithOptions...)` SDK + `ServeHTTP` 路由 |
| `bundle.go` | esbuild 打包 `.mjs` → CJS 内存字节（`BundleSSR`） |
| `bytecode.go` | `CompileBundleBytecode` + 字节码磁盘缓存（SHA256 key，gob 序列化） |
| `pool.go` | QJS Pool（有界阻塞语义，预热所有 slot），Pool/PoolOption API |
| `runtime.go` | QJS Runtime 初始化（`setupRuntime`），注入 host functions |
| `polyfills.go` | `//go:embed` 声明，将 `js/` 下的 8 个 JS 文件嵌入二进制 |
| `crypto_subtle.go` | Web Crypto API Go 实现（digest、HMAC、AES-GCM/CBC、JWK） |
| `glue.js` | Go↔QJS 桥接，定义 `__handleRequest`，流式输出 headers/chunks |
| `handler.go` | 单次请求处理（`RequestContext`、`HandleRequest`），流式写响应 |
| `images.go` | `/.netlify/images` 图像 CDN：参数解析、解码、resize/crop、编码 |

## QJS 运行时初始化顺序

每个 QJS 运行时按以下顺序初始化，顺序严格：

```
1. injectHostFunctions()
   ├── __processEnv / process（含 Symbol.toStringTag = 'process'）
   ├── __go_cryptoRandomBytes(n) → ArrayBuffer
   ├── __go_consoleWrite(level, msg) → stderr
   ├── __go_fetchRaw(url, method, headers, body) → async Promise（SetGoAsyncFunc）
   ├── __go_sendHeaders / __go_sendChunk / __go_endStream（流式响应）
   ├── injectBinaryOps：textEncodeUTF8 / textDecodeUTF8 / bufToB64 / b64ToBuf / urlParse
   └── injectCryptoSubtle：digest / importKey / generateKey / exportKey / sign / verify / encrypt / decrypt

2-9. JS polyfills（顺序）：web-api → crypto → file → env-api → intl → structured-clone → console → fetch

10. CJS bundle（esbuild 打包的 Astro SSR，带 require shim 包装）

11. glue.js（定义 __handleRequest）
```

## 关键设计决策

### 1. `isNode = true` via `Symbol.toStringTag`

Astro 用 `Object.prototype.toString.call(process) === "[object process]"` 判断是否为 Node。
`isNode = true` → `renderToAsyncIterable`（QJS 支持）；`isNode = false` → `renderToReadableStream`（依赖 setTimeout，QJS 中静默失败）。
解决方案：在 process 对象上设置 `Symbol.toStringTag = 'process'`，强制走 AsyncIterable 路径。

### 2. `node:stream/web` 主动抛出

bundle 中 `require("node:stream/web")` 主动 throw，触发 bundle 内置 web-streams-polyfill fallback。

### 3. Netlify adapter 二级工厂

`createExports` 返回 `{ default: createHandler }`，CJS wrapper 末尾调用工厂：
```javascript
var __rawExport = module.exports.default || module.exports;
return typeof __rawExport === 'function' ? __rawExport({}) : __rawExport;
```

### 4. 双重 JSON 编码传参

请求 payload 先 `json.Marshal` → JSON 字符串，再 `json.Marshal(string)` → JS 字符串字面量，
确保 payload 中任意字节（含引号、换行、Unicode）都能安全传入 QJS。

### 5. AsyncIterable body 流式传输

glue.js 不缓冲全部 body，逐 chunk 通过 `__go_sendChunk` 推给 Go，实现真正的流式传输。
Go 端 handler.go 通过带缓冲 channel（size=1）接收 `sigHeader` / `sigChunk` / `sigDone`，
写入 HTTP 响应并 Flush，客户端渐进接收。

### 6. 二进制数据跨边界传输（base64 + JSON）

Go 与 QJS 之间传递二进制（密钥、密文、摘要）：
- **ArrayBuffer 直传**：`__go_cryptoRandomBytes`、`__go_textEncodeUTF8`、`__go_b64ToBuf`
- **base64 字符串**：`__go_cryptoSubtle*` 系列（参数和返回值）

### 7. 常量时间 PKCS7 填充验证（防 padding oracle）

AES-CBC unpad 使用 XOR 累积，不提前退出：
```go
var invalid byte
for i := len(data) - pad; i < len(data); i++ {
    invalid |= data[i] ^ byte(pad)
}
if invalid != 0 { return nil, fmt.Errorf("invalid padding") }
```

### 8. fetch 超时保护

独立 `fetchClient = &http.Client{Timeout: 30 * time.Second}`，防止永久阻塞泄漏 goroutine。

### 9. 并发 fetch via `pendingCallbacks` channel

`__go_fetchRaw` 使用 `SetGoAsyncFunc`：goroutine 执行 HTTP 请求（不接触 WASM），
完成后写入 `Context.pendingCallbacks chan func()`；
`Await()` 在 WASM 安全上下文中消费 channel、resolve Promise，实现 `Promise.allSettled` 真正并发。

### 10. 字节码磁盘缓存

以 SHA256(bundle || polyfills || glue) 为 key，`bytecodeSet` gob 序列化到磁盘。
命中缓存时冷启动 <100ms（vs 首次编译 ~1.5s）。

### 11. QJS 事件循环优化（`QJS_DrainEventLoop`）

单次 WASM 调用内跑完所有 `JS_ExecutePendingJob`（vs 原来每个 microtask 一次 Go→WASM 往返 ~550µs）。
Astro SSR 一次请求约 5322 个 microtask，优化后 gap 从 **2.93s → ~10µs**。

### 12. Pool 有界阻塞语义

`NewPool` 预热所有 `size` 个 runtime（非懒加载）；`Get()` 阻塞直到有空闲 runtime。
保证 size=1 Pool 在顺序测试中始终复用同一 runtime（in-memory session 不丢失）。

### 13. Pack 内存 FS vs 磁盘缓存

- 无 `cacheDir`：`zip.NewReader` 直接作为 `fs.FS` 使用，distFS 零拷贝，data bytes 必须在 Runtime 生命周期内存活。
- 有 `cacheDir`：SHA256 keyed 目录，cache hit 跳过解压（`os.DirFS`），适合多次重启的生产部署。

### 14. 图像 CDN：distFS 接口化

`HandleImageCDN` 接受 `fs.FS` 而非 `string` 目录路径，同时兼容：
- `os.DirFS(distDir)` — 磁盘文件系统
- zip 内存 FS（pack 内嵌）— `packRT.DistFS()`
- `embed.FS` — 编译时嵌入

### 15. 绝对 URL 图像扩展名修复

`openSource` 对 HTTP URL 返回 `name=""`；此时 `filepath.Ext(name)=""` 导致 `errUnsupportedFormat`（415）。
修复：`ext` 从 `rawURL` 路径中提取（去掉 query string 后取扩展名）。

## 数据流

```
Go HTTP Request
    │ io.ReadAll（≤10MB）
    │ json.Marshal → requestPayload
    │ json.Marshal(string) → JS 字符串字面量
    ▼
QJS: __handleRequest(jsonStr)
    │ JSON.parse → {method, url, headers, body, context}
    │ new Request + buildNetlifyContext
    ▼
QJS: __ssrHandler(request, context)
    │ Astro router → renderToAsyncIterable → AsyncGenerator<Uint8Array>
    ▼
QJS: glue.js 流式输出
    │ __go_sendHeaders → Go: WriteHeader + Flush
    │ for await chunk: __go_sendChunk → Go: Write + Flush
    │ __go_endStream(traceJSON) → Go: 记录 trace，handler 返回
    ▼
Go HTTP Response（流式 Chunked Transfer）
```

## 限制与已知问题

| 项目 | 说明 |
|---|---|
| 状态共享 | Pool 中每个 runtime 持有独立 JS heap，模块级变量跨请求保留但不跨 runtime 共享 |
| WebAssembly | QJS 中 WebAssembly stub 永远返回不支持 |
| setTimeout（async eval） | async SSR eval 只跑 microtask，不等 OS timer |
| 二进制响应 | 图片/PDF 等应走静态文件路由，不经 SSR |
| 图像 AVIF 变换 | AVIF 源无法解码（无纯 Go 实现），直接 ServeContent 原始文件 |
| 图像 WebP 输出 | `fm=webp`/`fm=avif` 降级为 JPEG，格式与请求不符 |

## 依赖说明

| 依赖 | 版本 | 用途 |
|---|---|---|
| `github.com/dxkite/qjs` | local (x062201) | QuickJS-NG via wazero；新增 `QJS_DrainEventLoop`、`pendingCallbacks`、`SetGoAsyncFunc`、`RunAsync` |
| `github.com/tetratelabs/wazero` | v1.9.0 | WebAssembly 运行时（qjs 间接依赖） |
| `github.com/evanw/esbuild` | v0.25.0 | in-process JS 打包 |
| `golang.org/x/image` | v0.43.0 | WebP 解码（`webp`）+ 双线性缩放（`draw.BiLinear`） |
| `github.com/spf13/cobra` | — | CLI 命令解析 |
