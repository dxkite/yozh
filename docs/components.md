# 组件文档

## main.go — CLI 入口

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
| `Target` | `ES2020` | QJS (QuickJS-NG) 支持 ES2020+ |
| `Write` | `false` | 输出到内存，不写磁盘 |
| `MainFields` | `["module", "main"]` | 优先使用 ESM 源码 |

### External 清单

所有 `node:*` 和裸 Node 内置（`fs`, `path`, `crypto` 等）标记为 external，由 runtime.go 中的 `require` shim 处理。Netlify SDK（`@netlify/blobs` 等）和构建工具（`vite`, `esbuild`）也标记为 external，SSR 运行时不需要它们。

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

`NewPool` 创建 Pool 后立即 Get/Put 一个 runtime 做 eager warm-up，在启动时暴露初始化错误。

`Close()` 是空操作——`qjs.Pool` 无 Close 方法，池中 runtime 在程序退出时被 GC。

### setupRuntime(rt, bundleCode, env)

每个 QJS Runtime 的初始化函数，顺序不可调换：

1. **injectHostFunctions** — 注册 Go host functions
2. **polyfills** — 8 个 JS 常量依次 `ctx.Eval`
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

### injectHostFunctions

| Host Function | 参数 | 返回 | 实现 |
|---|---|---|---|
| `__cryptoRandomBytes(n)` | 字节数 | JSON 数字数组字符串 | `crypto/rand.Read` |
| `__consoleWrite(level, msg)` | 日志级别、消息 | `""` | `fmt.Fprintf(os.Stderr, ...)` |
| `__goFetchRaw(url, method, headersJSON, body)` | 请求参数 | JSON 响应字符串（async） | `http.DefaultClient.Do` |

`__goFetchRaw` 使用 `ctx.SetAsyncFunc`——Go goroutine 完成后通过 `this.Promise().Resolve/Reject` 通知 QJS，QJS 事件循环感知 Promise 完成继续执行。

---

## polyfills.go — JS Polyfill 常量

### webAPIPolyfill

**内容**：TextEncoder, TextDecoder, Headers, Request, Response

**TextEncoder.encode** 实现完整 UTF-8 编码，覆盖 BMP 和补充字符（surrogate pair）。

**Headers** 使用 `Object.create(null)` 存储，key 统一转小写。`getSetCookie()` 用于多值 Set-Cookie 头。

**Response.text()** 支持三种 body 类型：
- `null` / `undefined` → `''`
- ReadableStream（有 `getReader()`）→ `reader.read()` 循环
- AsyncIterable（有 `Symbol.asyncIterator`）→ `for await...of` + TextDecoder

### cryptoPolyfill

```javascript
globalThis.crypto = {
  randomUUID() { /* 调用 __cryptoRandomBytes(16)，格式化为 UUID v4 */ },
  getRandomValues(typedArray) { /* 调用 __cryptoRandomBytes(n) 填充 */ },
}
```

依赖 `__cryptoRandomBytes` host function，确保密钥等随机值使用 OS 熵源。

### filePolyfill

先定义 `Blob`（QJS 无内置 Blob），再定义 `File extends Blob`。
`Blob.text()` 和 `Blob.arrayBuffer()` 均为 async，返回 parts 拼接结果。

### envAPIStub

| 全局变量 | 实现说明 |
|---|---|
| `WebAssembly` | stub，`instantiate/compile` 返回 rejected Promise |
| `performance` | `now()` → `Date.now()`，`timeOrigin = 0` |
| `setTimeout` / `clearTimeout` | 用 `Promise.resolve().then(fn)` 实现 delay=0，非零 delay 也立即执行 |
| `queueMicrotask` | `Promise.resolve().then(fn)` |
| `btoa` / `atob` | 完整 Base64 实现 |
| `navigator` | `userAgent: 'Node.js'` |
| `location` | `href: 'http://localhost/'` |
| `URL` | 完整 URL 解析，支持绝对/相对 URL，含 `searchParams` |
| `URLSearchParams` | 完整实现，支持 `get/set/append/delete/forEach` |

### intlStub

QJS 无 `Intl` API。提供 `DateTimeFormat`、`NumberFormat`、`Collator` 的最小实现：
- `DateTimeFormat.format(d)` → `new Date(d).toISOString()`
- `NumberFormat.format(n)` → `String(n)`
- `Collator.compare(a, b)` → 字典序比较

### structuredCloneGuard

```javascript
if (!globalThis.structuredClone) {
    globalThis.structuredClone = v => JSON.parse(JSON.stringify(v));
}
```

QuickJS-NG 内置 `structuredClone`，此处为 fallback。

### consoleDef

```javascript
function fmtArg(a) {
    if (a instanceof Error || (a.message && a.stack))
        return `${a.name}: ${a.message}\n${a.stack}`;
    try { return JSON.stringify(a); } catch { return String(a); }
}
```

Error 对象特殊处理：显式提取 `name + message + stack`，避免 `JSON.stringify(error)` 返回 `{}` 导致错误信息丢失。

### fetchDef

```javascript
globalThis.fetch = async function(input, init) {
    // 构造 Headers，序列化为 {k:v} 对象
    // 调用 __goFetchRaw(url, method, headersJSON, body)
    // 解析返回的 JSON，构造 Response
}
```

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
  "context": { "ip": "127.0.0.1", "requestId": "mock-id", "geo": {...}, ... }
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
- 方法：`json(data)`, `log(...args)`
- Stub（抛出错误）：`next()`, `cookies`, `params`, `rewrite()`

---

## handler.go — 请求处理

### 函数签名
```go
func HandleSSR(pool *Pool, w http.ResponseWriter, r *http.Request)
```

### 流程

```
1. io.ReadAll(io.LimitReader(r.Body, 10MB)) → body string (非 GET/HEAD)
2. 收集 r.Header → [][2]string
3. json.Marshal(requestPayload) → payloadBytes
4. json.Marshal(string(payloadBytes)) → JS 字符串字面量（双重编码）
5. pool.Get() → rt
6. ctx.Eval("handle-request.js", "await __handleRequest("+jsLiteral+")", FlagAsync)
7. json.Unmarshal(resultVal.String()) → responsePayload
8. w.Header().Add 写入响应头
9. w.WriteHeader(resp.Status)
10. fmt.Fprint(w, resp.Body)
11. pool.Put(rt)  [defer]
```

双重 JSON 编码保证 payload 中含特殊字符时 JS 代码字符串仍然合法。

---

## server.go — HTTP 路由

### 路由优先级

Netlify `preferStatic: true` 的本地模拟：

```
GET /path
    │
    ├─ distDir/path 是文件？ → http.ServeFile
    ├─ distDir/path/index.html 存在？ → http.ServeFile
    └─ 否 → HandleSSR
```

### 静态缓存策略

`/_astro/` 前缀的资源（Astro 内容哈希文件）设置：
```
Cache-Control: public, max-age=31536000, immutable
```

其他静态文件使用 `http.ServeFile` 默认行为（支持 ETag 和 If-Modified-Since）。
