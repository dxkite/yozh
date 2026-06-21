# 组件文档

## cmd/main.go — CLI 入口

### 职责
解析命令行参数，按顺序调用 bundle → pool → server。

### 流程
```
1. flag.Parse()：--port, --ssr, --dist
2. filepath.Abs()：解析为绝对路径
3. os.Stat(absSSR)：验证 SSR entry 存在
4. BundleSSR(absSSR) → bundleCode []byte
5. NewPool(bundleCode, envMap(), poolSize) → *Pool
6. StartServer(pool, absDist, addr)
```

Pool 大小 = `runtime.NumCPU()`，限制在 `[2, 8]`。

`envMap()` 将 `os.Environ()` 转换为 `map[string]string`，注入到 QJS 的 `process.env`。

---

## bundle.go — esbuild 打包

### 函数签名
```go
func BundleSSR(entryPath string) ([]byte, error)
```

### 关键配置

| 选项 | 值 | 原因 |
|---|---|---|
| `Format` | `FormatCommonJS` | QJS 需要单文件 CJS，一次 `ctx.Eval` 完成加载 |
| `Platform` | `PlatformNeutral` | 不注入 Node/Browser 特定 shim |
| `Target` | `ES2020` | QJS（QuickJS-NG）支持 ES2020+ |
| `Write` | `false` | 输出到内存，不写磁盘 |
| `MainFields` | `["module", "main"]` | 优先使用 ESM 源码 |

### External 清单

所有 `node:*` 和裸 Node 内置（`fs`、`path`、`crypto` 等）标记为 external，
由 runtime.go 中的 `require` shim 处理。Netlify SDK（`@netlify/blobs` 等）和构建工具
（`vite`、`esbuild`）也标记为 external，SSR 运行时不需要它们。

### Define

```javascript
"process.env.NODE_ENV": '"production"'
```

在打包阶段消除开发模式代码路径，减小 bundle 体积。

---

## runtime.go — QJS Pool 管理

### 类型

```go
type Pool struct {
    inner *qjs.Pool
}
```

### 函数

```go
func NewPool(bundleCode []byte, env map[string]string, size int) (*Pool, error)
func (p *Pool) Get() (*qjs.Runtime, error)
func (p *Pool) Put(rt *qjs.Runtime)
func (p *Pool) Close()
```

`NewPool` 校验 size 在 `[1, 1000]` 范围内，创建 Pool 后立即 Get/Put 一个 runtime 做 eager warm-up，
在启动时暴露初始化错误。

`Close()` 是空操作——`qjs.Pool` 无 Close 方法，池中 runtime 在程序退出时被 GC。

### setupRuntime(rt, bundleCode, env)

每个 QJS Runtime 的初始化函数，顺序不可调换：

1. **injectHostFunctions** — 注册 Go host functions
2. **polyfills** — 8 个 JS 文件依次 `ctx.Eval`
3. **CJS bundle wrapper** — 用 `fmt.Sprintf` 拼接 `require` shim + bundle code
4. **glue.js** — 定义 `__handleRequest`

### CJS Wrapper 结构

```javascript
var __ssrHandler = (function(module, exports) {
  var require = function(id) {
    if (id === 'process' || id === 'node:process')
      return { env: __processEnv };
    if (id === 'node:crypto' || id === 'crypto')
      return { webcrypto: globalThis.crypto };
    if (id === 'node:buffer' || id === 'buffer')
      return { File: globalThis.File };
    if (id === 'node:path' || id === 'path')
      return { join, resolve, dirname, basename };
    // 主动 throw：激活 bundle 内置的 web-streams-polyfill fallback
    if (id === 'node:stream/web' || id === 'stream/web')
      throw new Error(id + ' not available in QJS');
    return {};
  };
  // ── bundle code ──
  ...
  // Netlify adapter 二级工厂：createHandler({}) → async handler(req, ctx)
  var __rawExport = module.exports.default || module.exports;
  return typeof __rawExport === 'function' ? __rawExport({}) : __rawExport;
}({ exports: {} }, {}));
```

### process 对象的特殊设置

```javascript
globalThis.process = { env: __processEnv, version: 'v20.0.0', ... };
// 使 Object.prototype.toString.call(process) === '[object process]'
// → Astro 的 isNode = true → 使用 renderToAsyncIterable（不依赖 ReadableStream/setTimeout）
Object.defineProperty(globalThis.process, Symbol.toStringTag, { value: 'process' });
```

### injectHostFunctions 注册的函数

| Host Function | 类型 | 参数 | 返回 | 实现 |
|---|---|---|---|---|
| `__cryptoRandomBytes(n)` | 同步 | 字节数 | ArrayBuffer | `crypto/rand.Read` |
| `__consoleWrite(level, msg)` | 同步 | 日志级别、消息 | `""` | `fmt.Fprintf(os.Stderr)` |
| `__goFetchRaw(url, method, headersJSON, body)` | 异步 | 请求参数 | JSON 响应字符串 | `fetchClient.Do`（30s 超时） |
| `__textEncodeUTF8(str)` | 同步 | 字符串 | ArrayBuffer | Go `[]byte(str)` |
| `__textDecodeUTF8(b64)` | 同步 | base64 字符串 | 字符串 | `base64.Decode` + `string(b)` |
| `__bufToB64(jsonNumArray)` | 同步 | JSON 字节数组 | base64 字符串 | `base64.StdEncoding.EncodeToString` |
| `__b64ToBuf(b64)` | 同步 | base64 字符串 | ArrayBuffer | `base64.StdEncoding.DecodeString` |
| `__urlParse(input, base)` | 同步 | URL 字符串、base 字符串 | JSON 字符串 | `net/url.Parse` + `ResolveReference` |
| `__cryptoSubtleDigest(algo, dataB64)` | 同步 | 算法名、数据 base64 | 摘要 base64 | `crypto/sha256`、`sha512`、`sha1` |
| `__cryptoSubtleImportKey(...)` | 同步 | format、数据、算法 JSON | keyId 或 `ERROR:msg` | 解析并存入 keyRegistry |
| `__cryptoSubtleGenerateKey(...)` | 同步 | 算法 JSON | keyId | `crypto/rand` 生成 |
| `__cryptoSubtleExportKey(format, keyId)` | 同步 | - | base64 或 JWK JSON | 从 keyRegistry 取出序列化 |
| `__cryptoSubtleSign(algoJSON, keyId, dataB64)` | 同步 | - | 签名 base64 | `crypto/hmac` |
| `__cryptoSubtleVerify(algoJSON, keyId, sigB64, dataB64)` | 同步 | - | `"true"`/`"false"` | `hmac.Equal` |
| `__cryptoSubtleEncrypt(algoJSON, keyId, plainB64)` | 同步 | - | 密文 base64 | AES-GCM / AES-CBC |
| `__cryptoSubtleDecrypt(algoJSON, keyId, cipherB64)` | 同步 | - | 明文 base64 | AES-GCM / AES-CBC |

`__goFetchRaw` 使用 `ctx.SetAsyncFunc`：goroutine 执行 HTTP 请求后将 resolve/reject 写入
`Context.pendingCallbacks chan func()`，QJS goroutine 的 `Await()` 轮询循环在 WASM 安全的上下文中消费
该 channel 并 resolve Promise，实现真正的并发 fetch（`Promise.allSettled` 3×80ms ≈ 83ms）。
其余函数均为同步（`ctx.SetFunc`）。

---

## crypto_subtle.go — Web Crypto API Go 实现

### 职责

实现 `crypto.subtle.*` 所有操作的 Go 端逻辑，注册为 `__cryptoSubtle*` host functions，
供 `js/crypto.js` 中的薄 JS 封装层调用。

### Key Registry

每个 `Pool` 实例拥有独立的 key registry（`map[string]*cryptoKey`），
密钥 ID 为随机生成的 16 字节十六进制字符串（`kXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`）。

```go
type cryptoKey struct {
    ID          string
    Type        string    // "secret" | "public" | "private"
    Algorithm   ckAlgo
    Raw         []byte
    Extractable bool
    Usages      []string
}
```

密钥不跨 Pool 共享，不持久化，进程退出后失效。

### 支持的算法

| 操作 | 算法 | 备注 |
|---|---|---|
| digest | SHA-1, SHA-256, SHA-384, SHA-512 | |
| generateKey / importKey | HMAC + SHA-256/384/512 | raw / JWK 格式 |
| generateKey / importKey | AES-GCM 128/256 | raw 格式 |
| generateKey / importKey | AES-CBC 128/256 | raw 格式 |
| sign / verify | HMAC | |
| encrypt / decrypt | AES-GCM（12 字节 nonce，16 字节 tag） | |
| encrypt / decrypt | AES-CBC（PKCS7 padding，16 字节 IV） | |
| exportKey | HMAC → raw / JWK；AES → raw | |

### 安全实现要点

- **`newKeyID()`**：`rand.Read` 失败时返回 error，不静默忽略
- **IV 长度验证**：AES-GCM 在 `cipher.NewGCM` 后验证 `len(iv) == gcm.NonceSize()`；
  AES-CBC 验证 `len(iv) == aes.BlockSize`，长度不对直接返回错误，不进入 Seal/Open
- **常量时间 PKCS7**：unpad 遍历所有 padding 字节做 XOR 累积，不提前退出，防止 padding oracle

---

## polyfills.go — JS Polyfill 嵌入声明

通过 `//go:embed` 在编译时将 `js/` 目录下的 8 个 JS 文件嵌入二进制：

```go
//go:embed js/web-api.js
var webAPIPolyfill string

//go:embed js/crypto.js
var cryptoPolyfill string
// ... 共 8 个
```

无运行时文件 I/O，JS 源码与 Go 二进制一起分发。

---

## glue.js — Go↔QJS 桥接

### 接口

```javascript
globalThis.__handleRequest(requestJSON: string): Promise<string>
```

**输入**（JSON）：
```json
{
  "method": "GET",
  "url": "http://localhost:8888/products/1",
  "headers": [["accept", "text/html"], ["cookie", "user-id=abc"]],
  "body": null,
  "context": { "ip": "127.0.0.1", "requestId": "mock-id", "geo": {}, ... }
}
```

**输出**（JSON）：
```json
{
  "status": 200,
  "headers": [["content-type", "text/html"], ["vary", "Accept-Encoding"]],
  "body": "<!DOCTYPE html>..."
}
```

### buildNetlifyContext

构造完整的 Netlify `Context` 对象，包含：
- `ip`, `requestId`
- `geo`：`{ city, country, subdivision, timezone, longitude, latitude }`
- `site`, `deploy`, `account`, `server`
- 方法：`json(data)`、`log(...args)`
- Stub（抛出错误）：`next()`、`cookies`、`params`、`rewrite()`

---

## handler.go — 请求处理

### 函数签名
```go
func HandleSSR(pool *Pool, w http.ResponseWriter, r *http.Request)
```

### 流程

```
1. io.ReadAll(io.LimitReader(r.Body, 10MB)) → body string（非 GET/HEAD）
   注：空 body POST 传递 ""，不跳过
2. 收集 r.Header → [][2]string
3. json.Marshal(requestPayload) → payloadBytes
4. json.Marshal(string(payloadBytes)) → JS 字符串字面量（双重编码）
5. pool.Get() → rt
6. ctx.Eval("handle-request.js", "await __handleRequest("+jsLiteral+")", FlagAsync)
7. json.Unmarshal(resultVal.String()) → responsePayload
8. w.Header().Add 写入响应头
9. w.WriteHeader(resp.Status)
10. fmt.Fprint(w, resp.Body)
11. pool.Put(rt) [defer]
```

双重 JSON 编码保证 payload 中含特殊字符时 JS 代码字符串仍然合法。

---

## images.go — Netlify 图像 CDN

### 职责

模拟 Netlify 的 `/.netlify/images` 图像转换端点。`@astrojs/netlify` 适配器通过
`image-service.js` 将所有 `<Image />` 组件的 URL 改写为此格式，生产环境由 Netlify
内置图像 CDN 处理；本模块在本地开发/私有部署时提供等效实现。

### 入口函数

```go
func HandleImageCDN(distDir string, w http.ResponseWriter, r *http.Request)
```

### 参数规范

| 参数 | 说明 | 备注 |
|------|------|------|
| `url` | 源图像路径（相对）或绝对 URL | 相对路径不含前导 `/`（image-service.js 的 `removeLeadingForwardSlash` 处理） |
| `fm` | 输出格式：`avif`, `jpg`, `png`, `webp` | 不支持的编码格式降级为 JPEG |
| `w` | 目标宽度（像素） | 为 0 时按 h 等比推算 |
| `h` | 目标高度（像素） | 为 0 时按 w 等比推算 |
| `q` | 质量 1–100 | 缺省 75 |
| `fit` | 裁切模式：`cover`、`contain`、`fill` | 缺省 `contain` |

### 内部函数

**`openSource(distDir, rawURL)`**

- 相对 URL → `os.Open(filepath.Join(distDir, rawURL))`
- 绝对 URL → 复用 `fetchClient`（30s 超时 HTTP 客户端，定义于 runtime.go）

**`decodeImage(r, ext)`**

| 格式 | 实现 | 备注 |
|------|------|------|
| `jpg`/`jpeg` | `image/jpeg`（stdlib） | |
| `png` | `image/png`（stdlib） | |
| `gif` | `image/gif`（stdlib） | |
| `webp` | `golang.org/x/image/webp` | 仅解码，无编码器 |
| `avif` | — | 返回 `errUnsupportedFormat`，触发 fallback |

**`resizeImage(src, w, h, fit)`**

使用 `golang.org/x/image/draw.BiLinear.Scale` 进行双线性插值缩放：

```
cover:   等比放大至填满 w×h → 裁中心区域
contain: 等比缩放至 w×h 内（不裁切）
fill:    直接拉伸至 w×h
```

**`encodeResponse(w, img, format, quality)`**

```
fm=png          → image/png（stdlib）
fm=jpg/jpeg     → image/jpeg（stdlib，quality 参数生效）
fm=webp/avif    → 降级为 image/jpeg（纯 Go 无 WebP/AVIF 编码器，开发环境可接受）
```

### AVIF 降级策略

Go 无纯 Go AVIF 解码器（需 CGO + libavif），AVIF 源文件走 fallback 路径：
直接 `http.ServeFile` 原始 `.avif` 文件，忽略 `w`/`h`/`fm` 等变换参数。
现代浏览器（Chrome 85+、Firefox 93+、Safari 16+）原生支持 AVIF，页面图片可正常显示，
仅失去尺寸裁剪能力，不影响本地开发。

---

## server.go — HTTP 路由

### 路由优先级

Netlify `preferStatic: true` 的本地模拟：

```
GET /path
    │
    ├─ /.netlify/images?...  → HandleImageCDN（图像 CDN，优先于 catch-all）
    ├─ distDir/path 是文件？ → http.ServeFile
    ├─ distDir/path/index.html 存在？ → http.ServeFile
    └─ 否 → HandleSSR
```

`/.netlify/images` 必须在 catch-all `/` 之前注册，否则 Go 的 `ServeMux` 会将其
匹配到 `/` 路由而进入 SSR 处理器。

### 静态缓存策略

`/_astro/` 前缀的资源（Astro 内容哈希文件）设置：
```
Cache-Control: public, max-age=31536000, immutable
```

其他静态文件使用 `http.ServeFile` 默认行为（支持 ETag 和 If-Modified-Since）。
