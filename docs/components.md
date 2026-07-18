# 组件文档

## cmd/main.go — CLI 入口

### 职责

解析命令行参数，通过 Runtime SDK 串联 build 和 serve 流程。

### build 命令流程

```
--kind astro（默认）：
  1. BundleSSR(absEntry) → jsCode []byte（esbuild ESM 打包，node/CJS-first conditions）
  2. --pack:  BuildPack(outPath, jsCode, absDist)
              （内部：ConvertBundleForGoja(jsCode) → gojaCode；writePack(outPath, gojaCode, absDist)，输出 bundle.mjs+dist/）
     默认:    ConvertBundleForGoja(jsCode) → gojaCode; writeOut(outPath, gojaCode)，输出 bundle.mjs

--kind react：
  1. BundleSSRReact(absEntry) → gojaCode []byte（JSX + browser conditions，内部已含 ConvertBundleForGoja）
  2. --pack:  BuildPackFromGoja(outPath, gojaCode, absDist)
     默认:    writeOut(outPath, gojaCode)
```

无论哪种 `--kind`，最终产物都只有 goja 格式的 `bundle.mjs`（或 `.pack` 内的 `bundle.mjs` + `dist/`）；没有字节码编译步骤，也没有 `--bytecode`/`--plain` 这类标志。

### serve 命令流程

```
--pack:   NewRuntime(WithPackFile, WithCacheDir, WithPackCacheSize, WithPoolOptions(WithEnv, WithBootstrap, WithPolyfill, WithSelfURL))
          → rt.ListenAndServe(addr)

--bundle: jsCode = os.ReadFile(bundle)
          NewRuntime(WithBundle, WithDistDir, WithCacheDir, WithPoolOptions(...))
          → rt.ListenAndServe(addr)

--entry:  jsCode = BundleSSRGoja(entry)   // esbuild 打包 + ConvertBundleForGoja，产出 goja 格式 ESM
          NewRuntime(WithBundle, WithDistDir, WithCacheDir, WithPoolOptions(...))
          → rt.ListenAndServe(addr)
```

自动检测顺序（未指定任何模式时）：
1. `.netlify/build/bundle.pack` 存在 → pack 模式
2. `.netlify/build/bundle.mjs` 存在 → bundle 模式
3. 默认 → entry 模式（`.netlify/build/entry.mjs`）

`envMap()` 将 `os.Environ()` 转换为 `map[string]string`，注入到 JS 引擎的 `process.env`。
`--bootstrap` / `--polyfill` 可指定文件路径，替换默认 bootstrap / 全部内置 polyfill。
`serve` 没有 `--engine` 之类的引擎选择标志——goja 是唯一引擎。

---

## pack.go — Pack 加载与构建

### 构建（对外导出）

```go
func BuildPack(outPath string, jsCode []byte, distDir string) error
func BuildPackFromGoja(outPath string, gojaCode []byte, distDir string) error
```

`BuildPack` 接收 esbuild 直接打包的 ESM `jsCode`，内部先 `ConvertBundleForGoja` 转成 goja 兼容格式，
再调用 `writePack` 写出 .pack zip（bundle.mjs + dist/）。没有 `engineKind` 参数——只有一种打包格式。

`BuildPackFromGoja` 跳过转换步骤，直接把已经是 goja 格式的 `gojaCode`（例如 `BundleSSRReact` 的输出）
写入 .pack，用于避免重复转换。

```go
func BundleSSR(entryPath string) ([]byte, error)  // bundle.go，对外导出
```

### 加载（内部）

| 函数 | 说明 |
|---|---|
| `openPackContentsInMemory(data)` | zip → gojaCode（读取 `bundle.mjs`） + 内存 distFS（zip.Reader 直接作为 fs.FS） |
| `openPackFile(path, cacheDir, maxSize)` | 读磁盘 → openPackContentsInMemory 或 extractPackToCache |
| `extractPackToCache(data, cacheDir, maxSize)` | SHA256 key → cacheDir/<hash>/ 持久解压，cache hit 跳过；LRU 按 maxSize 淘汰 |
| `readPackFromDir(dir)` | 从已解压目录读取 `bundle.mjs` + `dist/` |
| `extractZip(r, destDir)` | 带路径遍历防护的 zip 解压 |
| `readZipEntry(r, name)` | 读取单个 zip entry |
| `loadPackData(r)` | io.Reader → []byte |

`packContents` 结构体只有两个字段：`gojaCode []byte`（bundle.mjs 内容）和 `distFS fs.FS`。

### Pack 格式

```
bundle.pack (zip)
├── bundle.mjs — goja 格式的自包含 ESM（由 ConvertBundleForGoja 生成，sobek 直接 eval）
└── dist/      — Astro 静态输出（_astro/*.{js,css,png,...}、index.html 等）
```

不再有 `bundle.bc`（字节码）或独立的 `bundle-goja.mjs` 条目——`bundle.mjs` 本身就是 goja 格式。

---

## server.go — Runtime SDK + HTTP 路由

### Runtime 类型

```go
type Runtime struct {
    pool   *Pool
    distFS fs.FS
}
```

### NewRuntime

```go
func NewRuntime(opts ...RuntimeOption) (*Runtime, error)
```

必须指定一个 source option（`WithPack`/`WithPackReader`/`WithPackFile`/`WithBundle`），
其余 option 均为可选。

内部分派逻辑：

```
WithPackReader  → loadPackData → 同 WithPack
WithPack        → openPackContentsInMemory 或 extractPackToCache（有 cacheDir 时）
WithPackFile    → openPackFile
WithBundle      → 直接传 jsCode 给 NewPool
```

### RuntimeOption

| 函数 | 说明 |
|---|---|
| `WithPack(data []byte)` | 内存 pack bytes |
| `WithPackReader(r io.Reader)` | 从 io.Reader 读取 pack（消费一次） |
| `WithPackFile(path string)` | .pack 文件路径 |
| `WithBundle(code []byte)` | 原始 JS bundle |
| `WithDistFS(fsys fs.FS)` | 静态资产 FS |
| `WithDistDir(path string)` | 静态资产目录（os.DirFS 包装） |
| `WithCacheDir(dir string)` | 持久缓存目录 |
| `WithPoolOptions(opts ...PoolOption)` | 传递 PoolOption（WithEnv/WithSize/…） |

### Runtime 方法

```go
func (rt *Runtime) ServeHTTP(w http.ResponseWriter, r *http.Request)
func (rt *Runtime) ListenAndServe(addr string) error
func (rt *Runtime) Shutdown(ctx context.Context) error  // 优雅关闭：在 ctx 截止前排空在途请求，之后再调 Close()
func (rt *Runtime) Pool() *Pool
func (rt *Runtime) DistFS() fs.FS
func (rt *Runtime) Stats() PoolStats
func (rt *Runtime) Close()
```

### ServeHTTP 路由逻辑

```
请求
├─ path == "/.netlify/images" → HandleImageCDN(distFS, w, r)
├─ distFS 中有对应文件       → serveStaticFS
│     /_astro/* → Cache-Control: public, max-age=31536000, immutable
│     其他资产  → Cache-Control: public, max-age=3600
├─ distFS 中有 path/index.html → serveStaticFS
└─ 否 → pool.RequestContext → HandleRequest（SSR 池）
```

ServeHTTP 捕获所有 panic，返回 HTTP 500 并记录日志。

### StartServer（向后兼容）

```go
func StartServer(pool *Pool, distFS fs.FS, addr string) error
```

等同于 `(&Runtime{pool: pool, distFS: distFS}).ListenAndServe(addr)`，保留以兼容旧代码。

---

## bundle.go — esbuild 打包

### 函数签名

```go
func BundleSSR(entryPath string) ([]byte, error)
```

### 关键配置

| 选项 | 值 | 原因 |
|---|---|---|
| `Format` | `FormatESModule` | 输出 ESM，供后续 `ConvertBundleForGoja`/goja `ParseModule` 加载 |
| `Platform` | `PlatformNeutral` | 不注入 Node.js/浏览器特有 shim |
| `Target` | `ES2023` | esbuild 尽量保留原始语法；真正供 goja 使用前还会经 `ConvertBundleForGoja` 降级到 ES2017 |
| `Write` | `false` | 输出到内存，不写磁盘 |
| `Conditions` | `["require", "node", "import", "default"]` | `require` 优先选取包的 CJS 发行版，避免 ESM 版拉入兄弟包 |
| `MainFields` | `["main", "module", "browser"]` | `main` 优先 CJS，覆盖无 `exports` map 的老旧包 |
| `Define` | `{"process.env.NODE_ENV": '"production'"}` | 编译期替换，esbuild dead-code elimination 删除开发路径 |
| `Sourcemap` | `SourceMapNone` | 去除 source map，减小 bundle 体积 |
| `LogLevel` | `LogLevelSilent` | 错误通过返回值传递，不污染 stderr |

所有 `node:*` 和裸 Node 内置由 `nodeShimPlugin` 在 esbuild 打包阶段替换为 `js/shims/` 中的轻量 ESM stub（详见 [bundle.md](./bundle.md)）。

---

## pool.go — JS 引擎 Pool 管理

### 类型

```go
type Pool struct { ... }
type PoolOption func(*poolConfig)
```

### 函数

```go
func NewPool(bundleCode []byte, opts ...PoolOption) (*Pool, error)
func (p *Pool) Get(ctx context.Context) (*pooledRuntime, error)  // 阻塞直到有空闲 runtime
func (p *Pool) Put(prt *pooledRuntime)
func (p *Pool) Close()
func (p *Pool) RequestContext(w, r) (*RequestContext, error)
```

### PoolOption

| 函数 | 默认 | 说明 |
|---|---|---|
| `WithEnv(env map[string]string)` | `{}` | 注入 process.env（不传则为空 map） |
| `WithSize(n int)` | clamp(NumCPU, 2, 8) | Pool 大小，范围 [1, 1000]；0 = 自动 |
| `WithGojaBundle(code []byte)` | — | goja 格式 ESM bundle（从 .pack 的 `bundle.mjs` 加载时使用）；未设置时回退到 `NewPool` 的 `bundleCode` 参数 |
| `WithContextProvider(fn func(*http.Request) *NetlifyContext)` | — | 注册每请求的 NetlifyContext 构建函数，覆盖默认 IP 提取和 RequestID 逻辑 |
| `WithRequestTimeout(d time.Duration)` | 0（不限） | 每请求超时，超时后 Await() 返回 ctx.Err()，立即释放 pool slot |
| `WithBootstrap(src string)` | 内置 bootstrap-astro.js | 自定义 bootstrap 源码，作为 plain script eval，需定义 `globalThis.__handleRequest` |
| `WithSelfURL(u string)` | `""` | 内部 base URL（如 `http://127.0.0.1:8080`），供 fetch.js 解析相对 URL 用 |
| `WithPolyfill(src string)` | 内置 8 个 polyfill | 自定义 polyfill 源码，设置后替换全部内置 polyfill |
| `WithEngine(engine JSEngine)` | — | 直接传入 JSEngine 实现（优先级高于 `WithEngineKind`） |
| `WithEngineKind(kind EngineKind)` | — | 按名称选择引擎；目前 `EngineKind` 只有 `EngineGoja` 一个值，`kind` 参数实际上不再影响行为 |

没有 `WithMemoryLimit`、`WithMaxStackSize`、`WithMaxExecutionTime`、`WithGCThreshold`、`WithPrecompiledBundle`、`WithBundleCache`
这些选项——它们都是 QJS/字节码专用旋钮，goja 直接 eval 源码，没有 WASM 堆或字节码编译步骤，因此这些选项随 QJS 一起被移除。

引擎选择优先级：`WithEngine` > `WithEngineKind` > 默认（`jsruntime.DefaultEngineKind()`，恒为 `EngineGoja`）。

### PoolStats

```go
type PoolStats struct {
    Size int  // pool 总容量
    Idle int  // 当前空闲 runtime 数
    Busy int  // 当前使用中 runtime 数
}
```

通过 `Pool.Stats()` 或 `Runtime.Stats()` 获取瞬时快照（非原子操作，仅供监控参考）。

### Pool 方法

```go
func (p *Pool) Stats() PoolStats      // 返回瞬时快照
func (p *Pool) Close()                // 停止所有 worker goroutine
func (p *Pool) RequestContext(w http.ResponseWriter, r *http.Request) (*RequestContext, error)
```

### Pool 语义（有界阻塞）

`NewPool` 预热所有 `size` 个 runtime（不是懒加载）；`Get()` 阻塞直到有空闲 runtime 可用。
这保证 size=1 的 Pool 在顺序测试中始终复用同一 runtime（in-memory session 不丢失）。

---

## handler.go — 请求处理

### 类型

```go
type RequestContext struct { ... }  // 单次请求上下文，含 pool、pooledRuntime、w、r

func (p *Pool) RequestContext(w http.ResponseWriter, r *http.Request) (*RequestContext, error)
func HandleRequest(rc *RequestContext)
```

### 流程

```
1. pool.Get(ctx) → pooledRuntime（阻塞；如配置 WithRequestTimeout 则有 context deadline）
2. io.ReadAll(io.LimitReader(r.Body, 10MB)) → bodyPtr
3. fullURL(r) → 重建 scheme://host+RequestURI
4. json.Marshal(requestPayload) → payloadJSON → 内联到 await __handleRequest(jsonLiteral)
5. ctx.Eval("handle-request.js", code, EvalAsync)（在 worker goroutine 中运行）
6. 响应信号处理（sigHeader / sigChunk × N / sigDone）：
   - sigHeader: 添加 Server-Timing(pool/js) 初始头，WriteHeader
   - sigChunk:  Write + Flush
   - sigDone:   (stream 路径) 过滤 ssr/resp span → trailer Server-Timing；(buffer 路径) JS 已在初始头写入
7. pool.Put(rt) [defer]
```

Server-Timing 写入细节：
- `pool` 和 `js` 用 `w.Header().Add("Server-Timing", ...)` 追加到初始响应头（与 JS 注入的 `ssr`/`resp` 行并列）
- stream 路径：Go 端在 `sigDone` 时用 `w.Header().Set(http.TrailerPrefix+"Server-Timing", ...)` 写 trailer，仅包含 `ssr` 和 `resp` span
- buffer 路径：JS 端在 `__go_sendHeaders` 调用前已将 `ssr;dur=X, resp;dur=Y` 注入 respHeaders，无 trailer

每次请求独立的 `tailCh chan responseInfo`（buffer=1）协调 worker→main timing，
确保 trace span 在响应完成后正确记录。

---

## internal/runtime/ — JS 引擎与运行时核心

`package jsruntime`，包含引擎实现（goja/sobek，唯一引擎，无 build tag）、运行时初始化、polyfill、host functions
和 bootstrap 文件。根包通过类型别名暴露公共 API。没有字节码流水线——所有源码均直接 `Eval`。

### engine.go — 引擎接口（无 build tag，单文件）

```go
type GoFunc     func(ctx context.Context, args ...any) (any, error)
type EvalMode   uint8  // EvalScript | EvalModule | EvalAsync
type JSContext  interface {
    context.Context
    SetContext(ctx context.Context)
    Eval(filename, src string, mode EvalMode) error
    SetGoFunc(name string, fn GoFunc)
    SetGoAsyncFunc(name string, fn GoFunc)
}
type JSRuntime  interface { Ctx() JSContext; Close() }
type JSEngine   interface { New() (JSRuntime, error) }
type EngineKind string  // 只有 "goja"（EngineGoja）

func NewEngineForKind(kind EngineKind) JSEngine  // kind 参数被忽略，恒定返回 &gojaEngine{}
func DefaultEngineKind() EngineKind              // 恒为 EngineGoja
func ValidateEngineKind(kind EngineKind) error   // 非 "" / EngineGoja 时报错
```

`JSContext` 没有 `EvalBytecode`/`Compile` 方法，`JSEngine` 没有 `SupportsBytecode()`——这些接口方法只存在于
QJS 时代，随字节码支持一起被删除。`engine_qjs.go`、`dispatch_qjs.go`/`dispatch_stub.go`、
`bytecode.go`/`bytecode_qjs.go`/`bytecode_stub.go` 均已删除，不再存在于代码库中。

### engine_goja.go — goja/sobek 实现（唯一引擎实现）

纯 Go JS 引擎（grafana/sobek）。`gojaEngine.New()` 创建 `sobek.Runtime` 并设置 `UncapFieldNameMapper()`。
`Eval` 的 `EvalModule` 模式走 sobek 原生 `ParseModule → Link → Evaluate`；`EvalAsync` 模式把源码包进
`(async()=>{ ... })()` IIFE 再用 `RunScript` 执行（顶层 await 语法糖）。

sobek 的 host 函数与 JS 代码运行在同一 goroutine，因此 `SetGoAsyncFunc` 与 `SetGoFunc` 语义上等价：
都是阻塞式调用 Go 函数，`SetGoAsyncFunc` 只是多包一层已经 resolve/reject 好的 `sobek.Promise`
以匹配 JS 侧 `await` 语法，并不提供真正的并发。

### setup.go — SetupRuntime

```go
type StreamCallbacks struct {
    SendHeaders func(status int, headersJSON string)
    SendChunk   func(chunk []byte)
    EndStream   func(checkpoints []trace.JSCheckpoint)
}

type SetupOptions struct {
    Bundle    []byte  // ESM bundle 源码
    Env       map[string]string
    Stream    StreamCallbacks
    Bootstrap string  // 自定义 bootstrap 源码；"" = 使用内置 bootstrap-astro.js
    Polyfill  string  // 自定义 polyfill 源码；非空时替换全部内置 polyfill
    SelfURL   string  // 内部 base URL，供 fetch.js 解析相对 URL
}

func SetupRuntime(ctx JSContext, opts SetupOptions) error
```

`SetupOptions` 没有 `BCS *BytecodeSet` 字段——那个字段在删除前就已经是死代码（`SetupRuntime` 内部从未读取它）。
`SetupRuntime` 的参数列表也没有第三个 `engine JSEngine` 参数（同样是函数体内未使用的死参数）。

初始化顺序：host functions → stream callbacks（`__go_sendHeaders`/`__go_sendChunk`/`__go_endStream`）→
polyfills（8 个，按序）→ bundle（若非空，`Eval(entry.js, EvalModule)`）→ bootstrap
（`Eval(bootstrap.js, resolveBootstrap(opts), EvalScript)`）。全部以源码字符串 `Eval`，无字节码步骤。

### hostfuncs.go — 二进制操作与 URL 解析

`injectBinaryOps` 注册：
- `__go_textEncodeUTF8`：string → []byte
- `__go_textDecodeUTF8`：base64 → string
- `__go_bufToB64`：JSON 数组 → base64
- `__go_b64ToBuf`：base64 → []byte
- `__go_arrayBufToStr`：[]byte → string（避免 JSON 数组序列化）
- `__go_arrayBufToB64`：[]byte → base64

`injectURLParser` 注册 `__go_urlParse`（WHATWG 规范 URL 解析，via `net/url`）。

### http.go — fetch 实现

```go
var fetchClient = &http.Client{Timeout: 30 * time.Second}
func goFetch(urlStr, method, headersJSON, reqBody string) (result string, status int, err error)
```

`__go_fetchRaw` 通过 `SetGoAsyncFunc` 注册；goja 下该调用在当前 goroutine 上同步阻塞执行
（见 engine_goja.go 一节），并不启动额外 goroutine。

### crypto.go — Web Crypto API

支持算法见 [组件文档 - crypto_subtle](#crypto_subtle)。

### polyfills.go — polyfill 嵌入声明

```go
//go:embed js/web-api.js
//go:embed js/crypto.js
//go:embed js/file.js
//go:embed js/env-api.js
//go:embed js/intl.js
//go:embed js/structured-clone.js
//go:embed js/console.js
//go:embed js/fetch.js
```

`polyfillSources()` 按顺序返回 8 个 polyfill，供 `SetupRuntime` 逐个 eval。

### logx.go — 结构化日志

```go
func WithRequestAttrs(ctx context.Context, attrs ...slog.Attr) context.Context
func NewLogger(h slog.Handler) *slog.Logger
func SetLogger(l *slog.Logger)
func Log() *slog.Logger  // 返回当前 package-level logger
```

`ctxHandler` 包装 `slog.Handler`，在 `Handle` 时自动从 ctx 提取并注入每请求 attrs（method、path、status、latency）。

### bootstrap-astro.js — bootstrap（plain script，唯一 bootstrap 文件）

通过 `//go:embed bootstrap-astro.js` 嵌入为 `bootstrapAstroJS`（`internal/runtime/setup.go`），
在运行时初始化的最后一步以 `EvalScript` 方式 eval。

入口：`var _entry = globalThis.__ssrEntry`（由 goja 格式 bundle 在模块 eval 时以副作用设置，
参见 `ConvertBundleForGoja`/`gojaWrapperPlugin`），不是 ES module，没有 `import` 语句。

主要职责：
- 检测 Netlify adapter 导出格式，初始化 `__ssrHandler`
- 定义 `globalThis.__handleRequest(requestData: object): Promise<null>`
- 支持 `globalThis.__netlifyContextProvider(rawCtx, req)` JS 侧注入
- 自动检测 body 类型，走 buffer（AsyncIterator）或 stream（ReadableStream）路径

Buffer 路径（AsyncIterator）：
```javascript
// 收集所有 chunk → 计算 Content-Length → 注入 Server-Timing(ssr/resp) 到初始头
__go_sendHeaders(status, JSON.stringify(respHeaders))  // 含 content-length + server-timing
__go_sendChunk(fullBuffer)                             // 单次写入
__go_endStream(JSON.stringify(_spans))                 // 传递所有 span 供 trace hook
```

Stream 路径（ReadableStream）：
```javascript
__go_sendHeaders(status, JSON.stringify(respHeaders))  // 立即发送
while (reader.read()) __go_sendChunk(chunk)            // 逐 chunk
__go_endStream(JSON.stringify(_spans))                 // 含 ssr/resp span，Go 写 trailer
```

---

## engine.go（根包）— 类型别名与代理

```go
type GoFunc     = jsruntime.GoFunc
type EvalMode   = jsruntime.EvalMode
type JSContext  = jsruntime.JSContext
type JSRuntime  = jsruntime.JSRuntime
type JSEngine   = jsruntime.JSEngine
type EngineKind = jsruntime.EngineKind

const EvalScript, EvalModule, EvalAsync EvalMode = ...
const EngineGoja EngineKind = jsruntime.EngineGoja  // 唯一取值，没有 EngineQJS

func ValidateEngineKind(kind EngineKind) error
```

没有 `CompileBundleBytecode` 函数——它曾是对 `jsruntime.CompileBundleBytecode`（QJS 专用字节码编译器）的
薄封装，随字节码支持一起被整体删除，根包没有替代品。

---

## logx.go（根包）— 日志代理

```go
func NewLogger(h slog.Handler) *slog.Logger  // 代理 jsruntime.NewLogger
func SetLogger(l *slog.Logger)               // 同步更新 jsruntime 和根包的 rtlog
```

---

## crypto_subtle（internal/runtime/crypto.go）— Web Crypto API Go 实现

### 支持的算法

| 操作 | 算法 |
|---|---|
| digest | SHA-1, SHA-256, SHA-384, SHA-512 |
| generateKey / importKey | HMAC (SHA-256/384/512)，raw / JWK |
| generateKey / importKey | AES-GCM 128/256，raw |
| generateKey / importKey | AES-CBC 128/256，raw |
| sign / verify | HMAC |
| encrypt / decrypt | AES-GCM（12 字节 nonce，16 字节 tag） |
| encrypt / decrypt | AES-CBC（PKCS7 padding，16 字节 IV） |
| exportKey | HMAC → raw / JWK；AES → raw |

### 安全实现要点

- IV 长度严格校验（AES-GCM 必须 12 字节，AES-CBC 必须 16 字节）
- PKCS7 unpad 使用 XOR 累积（常量时间，防 padding oracle 攻击）
- keyID 通过 `crypto/rand.Read` 生成，失败时返回 error

---

## images.go — Netlify 图像 CDN

### 入口函数

```go
func HandleImageCDN(distFS fs.FS, w http.ResponseWriter, r *http.Request)
```

参数从 `fs.FS` 读取静态资产（兼容 zip 内存 FS 和 os.DirFS），支持相对路径和绝对 URL。

### 参数规范

| 参数 | 说明 |
|---|---|
| `url` | 源图像路径（相对 distFS）或绝对 HTTP URL |
| `fm` | 输出格式：jpg/png/webp/avif |
| `w` / `h` | 目标尺寸（像素），0 时等比推算 |
| `q` | 质量 1–100，默认 75 |
| `fit` | cover / contain（默认）/ fill |

### AVIF / WebP 降级策略

- AVIF 源文件：无纯 Go 解码器，直接 `http.ServeContent` 原始文件
- WebP/AVIF 输出格式：降级为 JPEG 输出（纯 Go 无编码器）

### 绝对 URL 扩展名修复

`openSource` 对 HTTP URL 返回 `name=""`，此时从 `rawURL` 路径中提取扩展名，
避免 `ext=""` 触发 `errUnsupportedFormat`（415）。
