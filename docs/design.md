# yozh 设计文档

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
    └─ 未命中 → handler.go — 序列化请求 → JSON 对象
                    │
                    ▼
               pool.go (Pool) — 阻塞直到有空闲 runtime
                    │
                    ▼
               internal/runtime/ (jsruntime 包，唯一 JS 引擎：goja/sobek，无 build tag 区分)
                 ├── engine.go       — 接口定义（JSEngine / JSRuntime / JSContext）+ EngineKind（仅 EngineGoja）
                 ├── engine_goja.go  — goja/sobek 引擎实现（纯 Go）
                 ├── setup.go        — SetupRuntime：注入 host functions → polyfills → bundle → bootstrap
                 ├── hostfuncs.go    — injectBinaryOps / injectURLParser
                 ├── crypto.go       — Web Crypto API Go 实现
                 ├── polyfills.go    — //go:embed js/*.js（8 个 polyfill 文件）
                 └── bootstrap-astro.js — bootstrap（plain script，读 globalThis.__ssrEntry）
                    │
                    │ __go_sendHeaders / __go_sendChunk / __go_endStream
                    ▼
               Go: 写入 HTTP 响应
                 ├─ AsyncIterator（buffer 模式）→ Content-Length + 单次写入
                 └─ ReadableStream（stream 模式）→ Chunked Transfer-Encoding + 逐 chunk 刷新
```

## Pack 格式与加载流程

```
build --pack
    BundleSSR(entry.mjs)             → jsCode（ESM，~500KB）
    ConvertBundleForGoja(jsCode)     → gojaCode（goja 兼容 ESM，内部经 esbuild 二次转换）
    writePack(out, gojaCode, dist/)  → bundle.pack（zip：bundle.mjs + dist/）

serve --pack
    NewRuntime(WithPackFile)
        openPackFile → openPackContentsInMemory（内存 zip FS）
                    or extractPackToCache（SHA256 keyed disk cache）
        NewPool(nil, WithGojaBundle(gojaCode), ...)
        Runtime{pool, distFS}
    rt.ListenAndServe(addr)
```

## 核心组件

| 文件 | 职责 |
|---|---|
| `cmd/main.go` | CLI 入口，build/serve 两个子命令，通过 SDK 串联所有组件 |
| `pack.go` | Pack 加载（openPackContentsInMemory/openPackFile/extractPackToCache）+ 构建（BuildPack/writePack） |
| `server.go` | `Runtime` 类型 + `NewRuntime(WithOptions...)` SDK + `ServeHTTP` 路由 |
| `bundle.go` | esbuild 打包 `.mjs` → CJS 内存字节（`BundleSSR`） |
| `pool.go` | JS 引擎 Pool（有界阻塞语义，预热所有 slot），Pool/PoolOption API |
| `handler.go` | 单次请求处理（`RequestContext`、`HandleRequest`），写 HTTP 响应 |
| `engine.go` | 根包类型别名（`type JSEngine = jsruntime.JSEngine` 等） |
| `logx.go` | 根包日志代理（`NewLogger` / `SetLogger` → jsruntime） |
| `images.go` | `/.netlify/images` 图像 CDN：参数解析、解码、resize/crop、编码 |
| `internal/runtime/engine.go` | 接口：`GoFunc`、`EvalMode`、`JSContext`、`JSRuntime`、`JSEngine`、`EngineKind`；`NewEngineForKind`、`DefaultEngineKind`、`ValidateEngineKind`（无 build tag，goja 是唯一引擎） |
| `internal/runtime/engine_goja.go` | goja/sobek 纯 Go 引擎实现 |
| `internal/runtime/setup.go` | `StreamCallbacks`、`SetupOptions`、`SetupRuntime` |
| `internal/runtime/hostfuncs.go` | `injectBinaryOps`、`injectURLParser` |
| `internal/runtime/http.go` | `goFetch` + `fetchClient` |
| `internal/runtime/crypto.go` | Web Crypto API Go 实现 |
| `internal/runtime/polyfills.go` | `//go:embed js/*.js` 声明（8 个 polyfill 文件） |
| `internal/runtime/logx.go` | `WithRequestAttrs`、`NewLogger`、`SetLogger`、`Log()` |
| `internal/runtime/bootstrap-astro.js` | bootstrap（plain script，读 `globalThis.__ssrEntry`，由 goja 格式 bundle 副作用设置） |

## 运行时初始化顺序

每个 JS runtime 按以下顺序初始化（`jsruntime.SetupRuntime`），顺序严格：

```
1. injectHostFunctions()（internal/runtime/setup.go）
   ├── process / __processEnv（含 Symbol.toStringTag = 'process'）
   ├── __go_cryptoRandomBytes(n) → ArrayBuffer
   ├── __go_consoleWrite(level, msg) → stderr
   ├── __go_sendHeaders / __go_sendChunk / __go_endStream（流式响应）
   ├── injectBinaryOps：__go_textEncodeUTF8 / __go_textDecodeUTF8 / __go_bufToB64 /
   │                    __go_b64ToBuf / __go_arrayBufToStr / __go_arrayBufToB64 / __go_urlParse
   ├── injectCryptoSubtle：__go_cryptoSubtle* 系列
   └── __go_fetchRaw(url, method, headers, body) → async Promise（SetGoAsyncFunc）

2-9. JS polyfills（顺序）：web-api → crypto → file → env-api → intl → structured-clone → console → fetch

10. bundle（`Eval(bundle, EvalModule)`：goja 原生 `ParseModule → Link → Evaluate` 加载源码）

11. bootstrap（`Eval(bootstrap-astro.js, EvalScript)`：plain script）
```

全部以源码 eval，没有字节码编译或缓存步骤。bundle 是经 `ConvertBundleForGoja` 转换过的 goja 兼容 ESM
（由 `WithGojaBundle` 提供，或退回 `bundleCode`），以模块方式 eval 后通过 `globalThis.__ssrEntry` 副作用
把导出对象交给 bootstrap-astro.js。

## 关键设计决策

### 1. `internal/runtime` 包隔离引擎实现

所有引擎逻辑（接口定义、goja 实现、polyfill 加载、bootstrap embed、host functions、crypto、http fetch）均位于 `internal/runtime/`（package `jsruntime`）。
根包（`package yozh`）仅保留公共 API 类型别名和面向用户的 Pool/Runtime 层，不直接引用任何引擎实现细节。
目的：避免根包膨胀，保持公共 API 与引擎实现解耦（历史上曾用于支持多引擎切换，现仅剩 goja 一种实现）。

### 2. 单引擎：goja/sobek

- **goja/sobek**（纯 Go，`github.com/grafana/sobek`）：唯一支持的 JS 引擎，无 cgo/WASM 依赖。
- `EngineKind` 只保留 `EngineGoja` 一个值；`NewEngineForKind(kind)` 忽略 `kind` 参数，恒定返回 `&gojaEngine{}`；`kind` 形参因此是历史遗留，不再有实际分支意义。
- `WithEngine(engine)` / `WithEngineKind(kind)`（`kind` 目前只能是 `EngineGoja`）仍是 `Pool` 的公开配置项，用于注入自定义 `JSEngine` 实现（例如测试用的假引擎），而非在多个真实引擎间选择。
- goja 不支持字节码，SSR bundle 和 polyfill 均以源码字符串直接 `Eval`；bundle 需先经过两步打包（esbuild ESM 打包 + `ConvertBundleForGoja` 做 ES2017 降级/UTF-8 charset 转换）才能被 sobek 正确解析。

### 3. AsyncIterator 自动 buffer，ReadableStream 流式

bootstrap 自动检测响应 body 类型，走两条不同路径：

**Buffer 路径**（AsyncIterator，Astro 典型路径 `renderToAsyncIterable`）：
- JS 将所有 chunk 收集到单个 `Uint8Array`，计算总字节数
- `Content-Length` + JS span（`ssr;dur=X, resp;dur=Y`）直接注入初始 `Server-Timing` 响应头
- 单次 `__go_sendChunk` 发送完整 body
- Go 端无分块传输；`__go_endStream` 中的 checkpoint 数据仅用于 trace hook，不再写 trailer

**Stream 路径**（ReadableStream，`renderToReadableStream`）：
- `__go_sendHeaders` 立即发送，Go 端 WriteHeader + Flush
- 每个 chunk 通过 `__go_sendChunk` 逐个发送，Go 端 Write + Flush（Chunked Transfer-Encoding）
- `ssr` 和 `resp` span 由 `__go_endStream` 传递，Go 端写入 HTTP trailer

**String / null body**：设置 Content-Length，单次 sendChunk 或无 body。

### 4. `isNode = true` via `Symbol.toStringTag`

Astro 用 `Object.prototype.toString.call(process) === "[object process]"` 判断是否为 Node。
`isNode = true` → `renderToAsyncIterable`（Buffer 路径，推荐）；`isNode = false` → `renderToReadableStream`（Stream 路径）。
解决方案：在 process 对象上设置 `Symbol.toStringTag = 'process'`，强制走 AsyncIterator 路径。

### 5. `node:stream/web` re-export shim

esbuild 打包阶段 `nodeShimPlugin` 把 `node:stream/web` / `stream/web` 替换为 `js/shims/node-stream-web.js`：
该 shim 直接从 `globalThis` 重新导出 `ReadableStream`/`WritableStream`/`TransformStream` 等（由 goja 运行时
的 web-api polyfill 提供），而不是抛错触发 bundle 自带的 web-streams-polyfill。

### 6. Netlify adapter 多版本兼容

不同版本的 `@astrojs/netlify` 导出格式不同，bootstrap 统一处理：

```javascript
// Astro ≤v4：default export（函数）
// Astro v6+：named export createHandler
var _rawFactory = (typeof _entry.default === 'function')
  ? _entry.default
  : _entry.createHandler;

// factory（.length < 2）：先调用工厂获得 handler
// direct handler（.length >= 2）：直接使用
if (typeof _rawFactory === 'function' && _rawFactory.length < 2) {
  var _h = _rawFactory({});
  __ssrHandler = (typeof _h === 'function') ? _h : _rawFactory;
} else {
  __ssrHandler = _rawFactory;
}
```

`_rawFactory.length < 2` 是区分"工厂函数"与"直接 handler"的判断依据，与 node_server.mjs 的逻辑完全一致。

### 7. 双重 JSON 编码传参

请求 payload 先 `json.Marshal` → JSON 字符串，再直接内联到 JS eval 代码（`await __handleRequest(jsonLiteral)`），
确保 payload 中任意字节（含引号、换行、Unicode）都能安全传入 JS 引擎。

### 8. 二进制数据跨边界传输（base64 + JSON）

Go 与 JS 之间传递二进制（密钥、密文、摘要）：
- **ArrayBuffer 直传**：`__go_cryptoRandomBytes`、`__go_textEncodeUTF8`、`__go_b64ToBuf`
- **base64 字符串**：`__go_cryptoSubtle*` 系列（参数和返回值）

### 9. 常量时间 PKCS7 填充验证（防 padding oracle）

AES-CBC unpad 使用 XOR 累积，不提前退出：
```go
var invalid byte
for i := len(data) - pad; i < len(data); i++ {
    invalid |= data[i] ^ byte(pad)
}
if invalid != 0 { return nil, fmt.Errorf("invalid padding") }
```

### 10. fetch 超时保护

独立 `fetchClient = &http.Client{Timeout: 30 * time.Second}`，防止永久阻塞泄漏 goroutine。

### 11. `SetGoAsyncFunc` 在 goja 下是同步执行

sobek（goja）没有多线程/事件循环概念：host 函数与 JS 代码运行在同一个 goroutine 上。
`gojaContext.SetGoAsyncFunc` 注册的包装函数会**阻塞式**调用 `fn(ctx, args...)`，
拿到结果后才创建一个已经 resolve 好的 `sobek.Promise` 返回给 JS——JS 侧看到的仍是
`await __go_fetchRaw(...)` 这种 Promise 语法，但底层没有真正的并发：
一次请求里连续多个 `await __go_fetchRaw(...)` 是顺序执行的 HTTP round trip，而不是并行。
`__go_fetchRaw` 仍通过 `SetGoAsyncFunc`（而非 `SetGoFunc`）注册，只是为了保持与 JS 侧
`await` 调用约定一致，并非为了并发。

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

### Buffer 路径（AsyncIterator，Astro 典型）

```
Go HTTP Request
    │ io.ReadAll（≤10MB）
    │ json.Marshal → requestPayload
    │ await __handleRequest(jsonLiteral)
    ▼
JS: __handleRequest(requestData)
    │ new Request + buildNetlifyContext
    │ await __ssrHandler → renderToAsyncIterable → AsyncGenerator<Uint8Array>
    │ for await chunk → 收集到 Uint8Array 缓冲区
    │ 计算 Content-Length + JS span（ssr;dur=X, resp;dur=Y）
    │ __go_sendHeaders(status, headersJSON)  // 含 Content-Length + Server-Timing(JS)
    │ __go_sendChunk(fullBuffer)             // 单次写入完整 body
    │ __go_endStream(traceJSON)             // 传递所有 span，供 trace hook 使用
    ▼
Go: WriteHeader → Write(body) → 添加 Server-Timing(pool/js) 初始头 → 返回
```

### Stream 路径（ReadableStream）

```
Go HTTP Request
    │ io.ReadAll（≤10MB）
    │ await __handleRequest(jsonLiteral)
    ▼
JS: __handleRequest(requestData)
    │ await __ssrHandler → renderToReadableStream → ReadableStream
    │ __go_sendHeaders → Go: WriteHeader + Flush
    │ while reader.read() not done:
    │     __go_sendChunk(chunk) → Go: Write + Flush（Chunked Transfer-Encoding）
    │ __go_endStream(traceJSON)
    │     → Go: trailer Server-Timing（ssr;dur=X, resp;dur=Y）
    ▼
Go HTTP Response（流式 Chunked Transfer）
```

### Server-Timing 说明

Go 端（初始响应头，两种路径均有）：
```
Server-Timing: pool;dur=X, js;dur=Y
```
- `pool`：pool.Get() 等待耗时
- `js`：从开始 eval 到收到第一个 header 信号的耗时

JS 端 span（`ssr`、`resp`）：
- **Buffer 路径**：由 JS 注入初始 `Server-Timing` 响应头（`ssr;dur=A, resp;dur=B`）
- **Stream 路径**：由 Go 写入 HTTP trailer（`Server-Timing: ssr;dur=A, resp;dur=B`）

其余 JS span（`parse-request`、`build-request`、`collect-headers`）内部追踪，通过 `__go_endStream` 传入 trace hook，不写入 Server-Timing。

典型 buffer 模式响应头：
```
Server-Timing: ssr;dur=78, resp;dur=11    ← JS 注入初始头
Server-Timing: pool;dur=0.005, js;dur=89  ← Go 追加初始头
Content-Length: 107260
```

## 限制与已知问题

| 项目 | 说明 |
|---|---|
| 状态共享 | Pool 中每个 runtime 持有独立 JS heap，模块级变量跨请求保留但不跨 runtime 共享 |
| WebAssembly | goja (sobek) 环境无原生 WebAssembly 支持，polyfill 中的 `WebAssembly` stub（`js/env-api.js`）永远返回不支持 |
| setTimeout（async eval） | async SSR eval 只跑 microtask，不等 OS timer |
| 并发 fetch | `SetGoAsyncFunc` 在 goja 下同步阻塞执行（见"关键设计决策 #11"），单个请求内多次 `await fetch` 是顺序执行，无真正并行 |
| 二进制响应 | 图片/PDF 等应走静态文件路由，不经 SSR |
| 图像 AVIF 变换 | AVIF 源无法解码（无纯 Go 实现），直接 ServeContent 原始文件 |
| 图像 WebP 输出 | `fm=webp`/`fm=avif` 降级为 JPEG，格式与请求不符 |

## 依赖说明

| 依赖 | 版本 | 用途 |
|---|---|---|
| `github.com/grafana/sobek` | — | 纯 Go JS 引擎（唯一 JS 引擎） |
| `github.com/evanw/esbuild` | v0.25.0 | in-process JS 打包（含 `ConvertBundleForGoja` 二次转换） |
| `golang.org/x/image` | v0.43.0 | WebP 解码（`webp`）+ 双线性缩放（`draw.BiLinear`） |
| `github.com/spf13/cobra` | — | CLI 命令解析 |
