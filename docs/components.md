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

`envMap()` 将 `os.Environ()` 转换为 `map[string]string`，注入到 QJS 的 `process.env`。

---

## pack.go — Pack 加载与构建

### 构建（对外导出）

```go
func BuildPack(outPath string, jsCode []byte, distDir string) error
```

编译字节码并打包为 .pack zip（bundle.mjs + bundle.bc + dist/）。

```go
func CompileBundleBytecode(bundleSrc []byte) ([]byte, error)  // bytecode.go，对外导出
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
├── bundle.mjs   — esbuild 打包的自包含 ESM（CJS format，QJS 可直接 eval）
├── bundle.bc    — QuickJS 字节码（从 bundle.mjs 编译，启动时跳过 ~1.5s 编译耗时）
└── dist/        — Astro 静态输出（_astro/*.{js,css,png,...}、index.html 等）
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

## pool.go — QJS Pool 管理

### 类型

```go
type Pool struct { ... }
type PoolOption func(*poolConfig)
```

### 函数

```go
func NewPool(bundleCode []byte, opts ...PoolOption) (*Pool, error)
func (p *Pool) Get() (*pooledRuntime, error)   // 阻塞直到有空闲 runtime
func (p *Pool) Put(prt *pooledRuntime)
func (p *Pool) Close()
func (p *Pool) RequestContext(w, r) (*RequestContext, error)
```

### PoolOption

| 函数 | 默认 | 说明 |
|---|---|---|
| `WithEnv(env map[string]string)` | `{}` | 注入 process.env（不传则为空 map） |
| `WithSize(n int)` | clamp(NumCPU, 2, 8) | Pool 大小，范围 [1, 1000]；0 = 自动 |
| `WithMemoryLimit(bytes int)` | 0（无限制） | 每个 QJS 实例 WASM 堆上限（0 = 不限） |
| `WithMaxStackSize(bytes int)` | 0（默认 256 KB） | JS 调用栈大小（0 = 引擎默认） |
| `WithMaxExecutionTime(ms int)` | 0（不限） | 单次 Eval 执行超时（毫秒；0 = 不限） |
| `WithGCThreshold(bytes int)` | 0（引擎默认） | GC 触发阈值（0 = 引擎默认） |
| `WithPrecompiledBundle(bc []byte)` | — | 传入预编译字节码，跳过 bundle 编译步骤（polyfill 仍每次编译） |
| `WithBundleCache(dir string)` | `""` | 字节码磁盘缓存目录；缓存 key = SHA256(bundle + vcs.revision) |
| `WithContextProvider(fn func(*http.Request) *NetlifyContext)` | — | 注册每请求的 NetlifyContext 构建函数，覆盖默认 IP 提取和 RequestID 逻辑 |

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
1. pool.Get() → pooledRuntime（阻塞）
2. io.ReadAll(io.LimitReader(r.Body, 10MB)) → bodyPtr
3. fullURL(r) → 重建 scheme://host+RequestURI
4. json.Marshal(requestPayload) → payloadBytes（双重 JSON 编码）
5. ctx.Eval("await __handleRequest(jsonLiteral)", FlagAsync)
6. 流式输出：__go_sendHeaders → __go_sendChunk × N → __go_endStream
7. pool.Put(rt) [defer]
```

每次请求独立的 `tailCh chan responseInfo`（buffer=1）协调 worker→main timing，
确保 trace span 在响应完成后正确记录。

---

## runtime.go — QJS 运行时初始化

### setupRuntime 顺序

每个 QJS Runtime 按以下顺序初始化（顺序不可调换）：

```
1. injectHostFunctions()
   ├── process / __processEnv
   ├── __go_cryptoRandomBytes
   ├── __go_consoleWrite
   ├── __go_fetchRaw（异步，SetGoAsyncFunc）
   ├── __go_sendHeaders / __go_sendChunk / __go_endStream
   ├── injectBinaryOps：__go_textEncodeUTF8/DecodeUTF8/bufToB64/b64ToBuf/__go_urlParse
   └── injectCryptoSubtle：__go_cryptoSubtle* 系列

2. webAPIPolyfill（js/web-api.js）
3. cryptoPolyfill（js/crypto.js）
4. filePolyfill（js/file.js）
5. envAPIStub（js/env-api.js）：URL, URLSearchParams, atob/btoa, setTimeout stub 等
6. intlStub（js/intl.js）
7. structuredCloneGuard（js/structured-clone.js）
8. consoleDef（js/console.js）
9. fetchDef（js/fetch.js）
10. CJS bundle（带 require shim 包装的 Astro SSR bundle）
11. bootstrap.mjs（定义 __handleRequest）
```

---

## crypto_subtle.go — Web Crypto API Go 实现

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

---

## bootstrap.mjs — Go↔QJS 桥接

通过 `//go:embed bootstrap.mjs` 嵌入到 Go 二进制，在 QJS 运行时初始化的最后一步 eval。

主要职责：
- 检测 Netlify adapter 的导出格式（工厂函数 vs 直接 handler）
- 初始化 `globalThis.__ssrHandler`
- 定义 `globalThis.__handleRequest(requestJSON: string): Promise<void>`
- 支持 `globalThis.__netlifyContextProvider(rawCtx, req)` 的 JS 侧注入（由 `WithContextProvider` 触发）

流式输出顺序：

```javascript
__go_sendHeaders(status, headersJSON)      // 立即写 HTTP status + headers → Flush
for await (chunk of body)
    __go_sendChunk(chunk.buffer)           // 写一个 body chunk → Flush
__go_endStream(traceJSON)                  // 携带 trace spans，标记结束
```

---

## logx.go — 结构化日志

```go
func NewLogger(h slog.Handler) *slog.Logger
func SetLogger(l *slog.Logger)
```

| 函数 | 说明 |
|---|---|
| `NewLogger(h slog.Handler)` | 用 `h` 构造 `*slog.Logger`，自动注入每请求的 context 字段（method、path、status、latency）。构建自定义 logger 时应通过此函数而非直接 `slog.New(h)` |
| `SetLogger(l *slog.Logger)` | 替换全局 runtime logger。在接受任何请求前调用。benchmark 中传入 `slog.New(slog.NewTextHandler(io.Discard, nil))` 可屏蔽日志 |

---

## polyfills.go — JS Polyfill 嵌入声明

通过 `//go:embed` 将 `js/` 目录下的 Web API polyfill 文件编译进二进制，无运行时文件 I/O。
