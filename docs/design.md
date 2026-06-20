# astro-runtime 设计文档

## 项目目标

在不依赖任何云平台 CLI 的情况下，直接运行 `@astrojs/netlify` 适配器编译的 Astro SSR 函数。
面向两个场景：**网站模板 SSR**（本地/私有服务器部署）和 **BFF Render**（Go 服务按需渲染 Astro 页面）。
详见 [adapter-selection.md](./adapter-selection.md)。

## 背景

`@astrojs/netlify` 适配器将 Astro SSR 项目编译为一个 Netlify Functions 入口文件（`.netlify/build/entry.mjs`）。
该入口 export 一个 `default` 工厂函数，签名为：

```typescript
// createExports 返回 { default: createHandler }
// createHandler(integrationConfig) 返回 async handler(request, context)
async function handler(request: Request, context: NetlifyContext): Promise<Response>
```

Netlify 平台在运行时提供 Node.js 环境并注入 `Context` 对象。本项目在 Go 端模拟这套机制。

## 架构概览

```
HTTP 请求
    │
    ▼
server.go — 静态文件优先路由（Netlify preferStatic 模拟）
    │ (未命中静态文件)
    ▼
handler.go — 序列化请求 → JSON
    │
    ▼
runtime.go (Pool) — 从池中取出 QJS 运行时
    │
    ▼
QJS (dxkite/qjs → QuickJS-NG via wazero)
  ├── js/         — Web API polyfills（8 个 JS 文件，//go:embed 嵌入）
  ├── bundle CJS  — Astro SSR bundle（esbuild 打包，内存加载）
  └── glue.js     — __handleRequest: JSON → Request → __ssrHandler → JSON
    │
    ▼
Go: 解析 JSON 响应 → 写入 HTTP 响应
```

## 核心组件

| 文件 | 职责 |
|---|---|
| `cmd/main.go` | CLI 入口，串联所有组件 |
| `bundle.go` | esbuild 打包 `.mjs` → CJS 内存字节 |
| `runtime.go` | QJS Pool 初始化，注入 host functions，eval polyfills + bundle + glue |
| `polyfills.go` | `//go:embed` 声明，将 `js/` 下的 JS 文件嵌入二进制 |
| `crypto_subtle.go` | Web Crypto API Go 实现（digest、HMAC、AES-GCM/CBC、JWK 导入导出） |
| `glue.js` | Go↔QJS 桥接，定义 `globalThis.__handleRequest` |
| `handler.go` | 单次请求处理：序列化、调用 QJS、反序列化 |
| `server.go` | HTTP 路由：静态文件优先，fallback SSR |

## QJS 运行时初始化顺序

每个 QJS 运行时（Runtime）按以下顺序初始化，顺序严格：

```
1. injectHostFunctions()
   ├── __processEnv / process（含 Symbol.toStringTag = 'process'）
   ├── __cryptoRandomBytes(n) → Go crypto/rand → ArrayBuffer
   ├── __consoleWrite(level, msg) → Go stderr
   ├── __goFetchRaw(url, method, headers, body) → Go http.Client（async）
   │
   ├── injectBinaryOps()
   │   ├── __textEncodeUTF8(str) → ArrayBuffer
   │   ├── __textDecodeUTF8(b64) → string
   │   ├── __bufToB64(jsonNumArray) → base64 string
   │   └── __b64ToBuf(b64) → ArrayBuffer
   │
   ├── injectURLParser()
   │   └── __urlParse(input, base) → JSON（Go net/url 实现）
   │
   └── injectCryptoSubtle()
       ├── __cryptoSubtleDigest(algo, dataB64) → resultB64
       ├── __cryptoSubtleImportKey(format, data, algoJSON, extractable, usagesJSON) → keyId
       ├── __cryptoSubtleGenerateKey(algoJSON, extractable, usagesJSON) → keyId
       ├── __cryptoSubtleExportKey(format, keyId) → b64 或 JWK JSON
       ├── __cryptoSubtleSign(algoJSON, keyId, dataB64) → sigB64
       ├── __cryptoSubtleVerify(algoJSON, keyId, sigB64, dataB64) → "true"/"false"
       ├── __cryptoSubtleEncrypt(algoJSON, keyId, plainB64) → cipherB64
       └── __cryptoSubtleDecrypt(algoJSON, keyId, cipherB64) → plainB64

2. webAPIPolyfill（js/web-api.js）
   └── TextEncoder, TextDecoder, Headers, Request, Response

3. cryptoPolyfill（js/crypto.js）
   └── globalThis.crypto.randomUUID / getRandomValues / subtle（JS 薄封装层）

4. filePolyfill（js/file.js）
   └── Blob, File

5. envAPIStub（js/env-api.js）
   └── WebAssembly, performance, setTimeout/clearTimeout, queueMicrotask,
       atob/btoa, navigator, location, URL, URLSearchParams

6. intlStub（js/intl.js）
   └── Intl.DateTimeFormat / NumberFormat / Collator

7. structuredCloneGuard（js/structured-clone.js）
   └── structuredClone（fallback）

8. consoleDef（js/console.js）
   └── console.log/info/warn/error/debug → __consoleWrite

9. fetchDef（js/fetch.js）
   └── globalThis.fetch → __goFetchRaw

10. CJS bundle（esbuild 打包的 Astro SSR）
    └── 包装在 (function(module, exports){ ... }) 中，结尾提取 __ssrHandler

11. glue.js
    └── globalThis.__handleRequest(requestJSON) → string
```

## 关键设计决策

### 1. `isNode = true` via `Symbol.toStringTag`

Astro 用以下代码检测是否在 Node.js 中运行：
```javascript
const isNode = typeof process !== "undefined" &&
               Object.prototype.toString.call(process) === "[object process]";
```

当 `isNode = true` 时，Astro 使用 `renderToAsyncIterable`（异步生成器）渲染页面；
当 `isNode = false` 时，使用 `renderToReadableStream`（ReadableStream + setTimeout）。

QJS 没有原生 `setTimeout`，ReadableStream 路径会静默失败。
解决方案：在 process 对象上设置 `Symbol.toStringTag = 'process'`，强制走 AsyncIterable 路径。

### 2. `node:stream/web` 主动抛出

esbuild 打包后的 bundle 中包含以下逻辑：
```javascript
if (!globalThis.ReadableStream) try {
    Object.assign(globalThis, require("node:stream/web"));
} catch {
    Object.assign(globalThis, Ns());  // 激活 web-streams-polyfill
}
```

require shim 对 `node:stream/web` 主动 `throw`，使 bundle 激活内置的 web-streams-polyfill。

### 3. Netlify adapter 二级工厂模式

`@astrojs/netlify` 的 `createExports` 返回：
```javascript
{ default: createHandler }
// createHandler(integrationConfig) 才返回真正的 handler
```

CJS wrapper 末尾必须调用一次工厂：
```javascript
var __rawExport = module.exports.default || module.exports;
return typeof __rawExport === 'function' ? __rawExport({}) : __rawExport;
```

### 4. 双重 JSON 编码传参

Go 调用 `ctx.Eval("...", qjs.Code(code))` 传入 JS 代码字符串。
请求 payload 先 `json.Marshal(payload)` 得到 JSON 字符串，再 `json.Marshal(string)` 得到 JSON 字符串字面量，
最终拼接成 `await __handleRequest("...{escaped JSON}...")` 的 JS 代码片段，
确保 payload 中任意字节（含引号、换行、Unicode）都能安全传入 QJS。

### 5. AsyncIterable body 消费（流式收集）

当 `isNode = true`，Astro 的 `renderPage` 返回的 Response body 是 `AsyncIterable<Uint8Array>`。
`Response.text()` 将全部 chunk 的字节收集到 `allBytes[]`，一次性 UTF-8 解码，
避免跨 chunk 边界截断多字节 UTF-8 序列：

```javascript
var allBytes = [];
for await (var chunk of b) {
  var u8 = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk.buffer, ...);
  for (var j = 0; j < u8.length; j++) allBytes.push(u8[j]);
}
return __textDecodeUTF8(__bufToB64(JSON.stringify(allBytes)));
```

### 6. 二进制数据跨边界传输（base64 + JSON）

Go 与 QJS 之间传递二进制数据（密钥、密文、摘要）通过两种路径：

- **ArrayBuffer 直传**（`ctx.NewArrayBuffer`）：用于 `__cryptoRandomBytes`、`__textEncodeUTF8`、`__b64ToBuf`
- **base64 字符串**（JSON 编码）：用于 `__cryptoSubtle*` 系列函数（加密 API 的参数和返回值）

JS 侧调用前用 `_toB64(typedArray)` 把 ArrayBuffer/TypedArray 序列化为 JSON 字节数组再转 base64，
返回值用 `__b64ToBuf(b64)` 还原为 ArrayBuffer。

### 7. 常量时间 PKCS7 填充验证（防 padding oracle）

AES-CBC 解密的填充验证使用 XOR 累积方式，不提前退出：

```go
var invalid byte
for i := len(data) - pad; i < len(data); i++ {
    invalid |= data[i] ^ byte(pad)
}
if invalid != 0 {
    return nil, fmt.Errorf("invalid padding")
}
```

条件分支（提前 return）会产生可测量的时序差异，可被 padding oracle 攻击利用。

### 8. fetch 超时保护

`http.DefaultClient` 无超时，fetch() 调用可能永久阻塞并泄漏 goroutine。
使用独立的 `fetchClient`：

```go
var fetchClient = &http.Client{Timeout: 30 * time.Second}
```

### 9. 并发 fetch via `pendingCallbacks` channel

wazero 的 WASM 实例非线程安全，所有 WASM 调用必须来自同一 goroutine。
为让 `Promise.allSettled([fetch(a), fetch(b)])` 真正并发，`__goFetchRaw` 使用 `SetAsyncFunc`：

```
JS: fetch(url)
  → SetAsyncFunc goroutine 启动，执行 HTTP 请求（不接触 WASM）
  → 完成后写入 Context.pendingCallbacks chan func()

JS: Await() 轮询循环（在 QJS goroutine 上）：
  drain pendingCallbacks → 调用 promise.Resolve/Reject（WASM 安全）
  运行 QJS_ExecutePendingJob 直到返回 ≤ 0
  检查 QJS_IsPromisePending → settled 则退出
```

`dxkite/qjs` 在上游基础上增加了：
- `Context.pendingCallbacks chan func()`（容量 64）
- `SetAsyncFunc(name string, fn func(*This))` / `RunAsync(promise *Value, fn func() (*Value, error))`
- C 导出 `QJS_ExecutePendingJob` / `QJS_IsPromisePending`（`qjswasm/helpers.c`）
- `eval.c` 中移除 `js_std_await`，由 Go 端 `Await()` 统一驱动 Promise 解析

## 数据流

```
Go HTTP Request
    │ io.ReadAll（≤10MB）
    │ json.Marshal → requestPayload{method, url, headers, body}
    │ json.Marshal(string) → JS 字符串字面量
    ▼
QJS: __handleRequest(jsonStr)
    │ JSON.parse → {method, url, headers, body, context}
    │ new Request(url, {method, headers, body})
    │ buildNetlifyContext(d.context)
    ▼
QJS: __ssrHandler(request, context)
    │ Astro router → renderContext.render()
    │ renderToAsyncIterable → AsyncGenerator<Uint8Array>
    │ new Response(asyncIterable, {status, headers})
    ▼
QJS: response.text() → 收集全部字节 → __textDecodeUTF8 → string
    │ JSON.stringify({status, headers, body})
    ▼
Go: json.Unmarshal → responsePayload
    │ w.Header().Add / w.WriteHeader / fmt.Fprint
    ▼
Go HTTP Response
```

## 限制与已知问题

| 项目 | 说明 |
|---|---|
| 状态共享 | Pool 中每个 runtime 持有独立 JS heap，模块级变量跨请求保留但不跨 runtime 共享 |
| 流式响应 | 当前收集全部 body 再返回，不支持 HTTP 流式传输（Chunked Transfer） |
| WebAssembly | QJS 中 WebAssembly stub 永远返回不支持 |
| setTimeout 精度 | 非零 delay 的 setTimeout 立即执行（用 microtask 模拟），SSR 路径通常无影响 |
| 二进制响应 | Response body 为字符串，图片/PDF 等二进制资源应走静态文件路由，不经 SSR |

## 依赖说明

| 依赖 | 版本 | 用途 |
|---|---|---|
| `github.com/dxkite/qjs` | v0.0.0-20260621001741-4363bef2dab5 | QuickJS-NG via wazero（纯 Go，无 CGO）；增加 `pendingCallbacks` channel、`SetAsyncFunc`、`RunAsync`、`QJS_ExecutePendingJob` / `QJS_IsPromisePending` WASM 导出 |
| `github.com/tetratelabs/wazero` | v1.9.0 | WebAssembly 运行时（qjs 间接依赖） |
| `github.com/evanw/esbuild` | v0.25.0 | in-process JS 打包 |

## CLI 使用方式

```bash
astro-runtime \
  --ssr .netlify/build/entry.mjs \
  --dist dist \
  --port 8888
```

| 参数 | 默认值 | 说明 |
|---|---|---|
| `--ssr` | `.netlify/v1/functions/ssr/ssr.mjs` | SSR entry 路径 |
| `--dist` | `dist` | Astro 静态输出目录 |
| `--port` | `8888` | 监听端口 |
