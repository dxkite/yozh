# 组件文档

## cmd/main.go — CLI 入口

### 职责

解析命令行参数，通过 Runtime SDK 串联 build 和 serve 流程。

### build 命令流程

```
1. BundleSSR(absEntry) → jsCode []byte
2. --plain:    writeOut(outPath, jsCode)
   --bytecode: CompileBundleBytecode(jsCode) → bc; writeOut(outPath, bc)
   --pack:     BuildPack(outPath, jsCode, absDist)
               （内部：CompileBundleBytecode → writePack，输出 bundle.mjs+bundle.bc+dist/）
```

### serve 命令流程

```
--pack:   NewRuntime(WithPackFile, WithCacheDir, WithPoolOptions(WithEnv))
          → rt.ListenAndServe(addr)

--bundle: jsCode = os.ReadFile(bundle)
          NewRuntime(WithBundle, WithDistDir, WithCacheDir, WithPoolOptions(WithEnv))
          → rt.ListenAndServe(addr)

--entry:  jsCode = BundleSSR(entry)
          NewRuntime(WithBundle, WithDistDir, WithCacheDir, WithPoolOptions(WithEnv))
          → rt.ListenAndServe(addr)
```

自动检测顺序（未指定任何模式时）：
1. `.netlify/build/bundle.pack` 存在 → pack 模式
2. `.netlify/build/bundle.mjs` 存在 → bundle 模式
3. 默认 → entry 模式（`.netlify/build/entry.mjs`）

`envMap()` 将 `os.Environ()` 转换为 `map[string]string`，注入到 JS 引擎的 `process.env`。

---

## pack.go — Pack 加载与构建

### 构建（对外导出）

```go
func BuildPack(outPath string, jsCode []byte, distDir string) error
```

编译字节码并打包为 .pack zip（bundle.mjs + bundle.bc + dist/）。

```go
func CompileBundleBytecode(bundleSrc []byte) ([]byte, error)  // engine.go，对外导出（代理至 jsruntime）
func BundleSSR(entryPath string) ([]byte, error)              // bundle.go，对外导出
```

### 加载（内部）

| 函数 | 说明 |
|---|---|
| `openPackInMemory(data)` | zip → bundleBC + 内存 distFS（zip.Reader 直接作为 fs.FS） |
| `openPackFile(path, cacheDir)` | 读磁盘 → openPackInMemory 或 extractPackToCache |
| `extractPackToCache(data, cacheDir)` | SHA256 key → cacheDir/<hash>/ 持久解压，cache hit 跳过 |
| `extractZip(r, destDir)` | 带路径遍历防护的 zip 解压 |
| `readZipEntry(r, name)` | 读取单个 zip entry |
| `loadPackData(r)` | io.Reader → []byte |

### Pack 格式

```
bundle.pack (zip)
├── bundle.mjs      — esbuild 打包的自包含 ESM（QJS 可直接 eval）
├── bundle.bc       — QuickJS 字节码（从 bundle.mjs 编译，启动时跳过 ~1.5s 编译耗时）
├── bundle-goja.mjs — IIFE 格式 bundle（goja 引擎使用；ES2017 降级）
└── dist/           — Astro 静态输出（_astro/*.{js,css,png,...}、index.html 等）
```

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
WithPack        → openPackInMemory 或 extractPackToCache（有 cacheDir 时）
WithPackFile    → openPackFile
WithBundle      → 直接传 jsCode 给 NewPool（可选 WithBundleCache）
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
| `Format` | `FormatESModule` | QJS 使用 `TypeModule()` 加载，需要 ESM 格式 |
| `Platform` | `PlatformNeutral` | 不注入 Node.js/浏览器特有 shim |
| `Target` | `ES2023` | QJS（QuickJS-NG）支持 ES2020+，ES2023 特性已充分覆盖 |
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
| `WithEngine(engine JSEngine)` | — | 直接传入 JSEngine 实现（优先级最高） |
| `WithEngineKind(kind EngineKind)` | — | 按名称选择引擎（`EngineGoja` / `EngineQJS`） |
| `WithMemoryLimit(bytes int)` | 0（无限制） | 每个 QJS 实例 WASM 堆上限（0 = 不限，QJS only） |
| `WithMaxStackSize(bytes int)` | 0（默认 256 KB） | JS 调用栈大小（0 = 引擎默认，QJS only） |
| `WithMaxExecutionTime(ms int)` | 0（不限） | 单次 Eval 执行超时（毫秒；0 = 不限，QJS only） |
| `WithGCThreshold(bytes int)` | 0（引擎默认） | GC 触发阈值（0 = 引擎默认，QJS only） |
| `WithPrecompiledBundle(bc []byte)` | — | 传入预编译字节码，跳过 bundle 编译步骤（polyfill 仍每次编译，QJS only） |
| `WithGojaBundle(code []byte)` | — | IIFE 格式 bundle，供 goja 引擎使用（从 pack 的 bundle-goja.mjs 加载），goja only |
| `WithBundleCache(dir string)` | `""` | 字节码磁盘缓存目录；缓存 key = SHA256(bundle + vcs.revision)（QJS only） |
| `WithRequestTimeout(d time.Duration)` | 0（不限） | 每请求超时，超时后 Await() 返回 ctx.Err()，立即释放 pool slot |
| `WithContextProvider(fn func(*http.Request) *NetlifyContext)` | — | 注册每请求的 NetlifyContext 构建函数，覆盖默认 IP 提取和 RequestID 逻辑 |

引擎选择优先级：`WithEngine` > `WithEngineKind` > 默认（有 `-tags qjs` 时为 `EngineQJS`，否则 `EngineGoja`）。

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

`package jsruntime`，包含所有引擎实现、运行时初始化、polyfill、host functions、字节码流水线和 bootstrap 文件。根包通过类型别名暴露公共 API。

### engine.go — 引擎接口

```go
type GoFunc     func(ctx context.Context, args ...any) (any, error)
type EvalMode   uint8  // EvalScript | EvalModule | EvalAsync
type JSContext  interface { ... }  // Eval / EvalBytecode / Compile / SetGoFunc / SetGoAsyncFunc
type JSRuntime  interface { Ctx() JSContext; Close() }
type JSEngine   interface { New() (JSRuntime, error); SupportsBytecode() bool }
type EngineKind string  // "goja" | "qjs"
```

### engine_goja.go — goja/sobek 实现

纯 Go JS 引擎（grafana/sobek）。不支持字节码（`SupportsBytecode() = false`）。
bundle 以 IIFE 格式加载（`WithGojaBundle`），由 `globalThis.__ssrEntry` 传递给 bootstrap-goja.js。

### engine_qjs.go — QJS 实现（build tag: qjs）

QuickJS-NG via wazero。支持字节码（`SupportsBytecode() = true`）。
QJS 特有参数：`MemoryLimit`、`MaxStackSize`、`MaxExecutionTime`、`GCThreshold`。

### dispatch_qjs.go / dispatch_stub.go — 引擎分派

```go
func NewEngineForKind(kind EngineKind, memoryLimit, maxStackSize, maxExecutionTime, gcThreshold int) JSEngine
func DefaultEngineKind() EngineKind  // qjs（有 -tags qjs）或 goja（无）
func ValidateEngineKind(kind EngineKind) error
```

- `dispatch_qjs.go`（`//go:build qjs`）：`defaultEngineKind = EngineQJS`，同时支持 goja 和 qjs
- `dispatch_stub.go`（`//go:build !qjs`）：`defaultEngineKind = EngineGoja`，选 qjs 返回 error

### bytecode.go / bytecode_qjs.go / bytecode_stub.go — 字节码

```go
type PolyfillEntry struct { Name string; BC []byte }
type BytecodeSet   struct { Polyfills []PolyfillEntry; Bundle []byte }
func BundleCacheKey(bundleCode []byte) string  // SHA256(bundle + vcs.revision)
```

- `bytecode_qjs.go`（`//go:build qjs`）：实现 `CompileBytecodes`（编译 polyfill + bundle）
- `bytecode_stub.go`（`//go:build !qjs`）：stub，返回 nil BytecodeSet

### setup.go — SetupRuntime

```go
type StreamCallbacks struct {
    SendHeaders func(status int, headersJSON string)
    SendChunk   func(chunk []byte)
    EndStream   func(checkpoints []trace.JSCheckpoint)
}

type SetupOptions struct {
    BCS    *BytecodeSet      // nil → goja source path
    Bundle []byte            // goja: ESM bundle source；QJS：当 BCS 有 Bundle 时忽略
    Env    map[string]string
    Stream StreamCallbacks
}

func SetupRuntime(ctx JSContext, opts SetupOptions, engine JSEngine) error
```

初始化顺序：host functions → stream callbacks → polyfills → bundle → bootstrap。
QJS 路径：polyfill 和 bundle 用 `EvalBytecode`；bootstrap 用 `Eval(bootstrapMJS, EvalModule)`。
goja 路径：全部用 `Eval`；bootstrap 用 `Eval(bootstrapGojaJS, EvalScript)`。

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

`__go_fetchRaw` 通过 `SetGoAsyncFunc` 注册，goroutine 执行 HTTP 请求不阻塞 WASM 线程。

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

`polyfillSources()` 按顺序返回 8 个 polyfill，供 goja 路径 eval。

### logx.go — 结构化日志

```go
func WithRequestAttrs(ctx context.Context, attrs ...slog.Attr) context.Context
func NewLogger(h slog.Handler) *slog.Logger
func SetLogger(l *slog.Logger)
func Log() *slog.Logger  // 返回当前 package-level logger
```

`ctxHandler` 包装 `slog.Handler`，在 `Handle` 时自动从 ctx 提取并注入每请求 attrs（method、path、status、latency）。

### bootstrap.mjs — QJS bootstrap（ES module）

通过 `//go:embed bootstrap.mjs` 嵌入（`internal/runtime/setup.go`），在 QJS 运行时初始化最后 eval。

入口：`import * as _entry from 'entry.mjs'`（QJS 模块系统加载 bundle）。

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

### bootstrap-goja.js — goja bootstrap（plain script）

入口：`var _entry = globalThis.__ssrEntry`（由 IIFE bundle eval 后设置）。

除入口方式外，逻辑与 bootstrap.mjs 完全相同：同样的双路径（buffer/stream），同样的 span 名称（`ssr`/`resp`），同样的 `buildNetlifyContext`，同样的 `__go_sendHeaders` / `__go_sendChunk` / `__go_endStream` 调用。

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
const EngineGoja, EngineQJS EngineKind   = ...

func ValidateEngineKind(kind EngineKind) error
func CompileBundleBytecode(bundleSrc []byte) ([]byte, error)
```

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
