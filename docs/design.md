# netlify-runtime 设计文档

## 项目目标

在不依赖 Netlify CLI 的情况下，本地运行 `@astrojs/netlify` 适配器编译出的 SSR 函数。
开发者执行 `astro build` 后，可直接使用本工具启动本地服务器，无需 `netlify dev` 或任何云端部署。

## 背景

`@astrojs/netlify` 适配器将 Astro SSR 项目编译为一个 Netlify Functions 入口文件（`.netlify/build/entry.mjs`）。
该入口 export 一个 `default` 工厂函数，签名为：

```typescript
// createExports 返回 { default: createHandler }
// createHandler(integrationConfig) 返回 async handler(request, context)
async function handler(request: Request, context: NetlifyContext): Promise<Response>
```

Netlify 平台在运行时提供 Node.js 环境并注入 `Context` 对象。本工具在 Go 端模拟这套机制。

## 架构概览

```
HTTP 请求
    │
    ▼
server.go — 静态文件优先路由
    │ (未命中静态文件)
    ▼
handler.go — 序列化请求 → JSON
    │
    ▼
runtime.go (Pool) — 从池中取出 QJS 运行时
    │
    ▼
QJS (fastschema/qjs → QuickJS-NG via wazero)
  ├── polyfills.go  — Web API polyfills (Headers/Request/Response/crypto/…)
  ├── bundle (esbuild CJS) — Astro SSR bundle
  └── glue.js — __handleRequest: JSON → Request → __ssrHandler → JSON
    │
    ▼
Go: 解析 JSON 响应 → 写入 HTTP 响应
```

## 核心组件

| 文件 | 职责 |
|---|---|
| `main.go` | CLI 入口，串联所有组件 |
| `bundle.go` | esbuild 打包 `.mjs` → CJS 内存字节 |
| `runtime.go` | QJS Pool 初始化，注入 host functions，eval polyfills + bundle + glue |
| `polyfills.go` | JS polyfill 字符串常量（Web API、crypto、Intl、URL、setTimeout 等） |
| `glue.js` | Go↔QJS 桥接，定义 `globalThis.__handleRequest` |
| `handler.go` | 单次请求处理：序列化、调用 QJS、反序列化 |
| `server.go` | HTTP 路由：静态文件优先，fallback SSR |

## QJS 运行时初始化顺序

每个 QJS 运行时（Runtime）按以下顺序初始化，顺序严格：

```
1. injectHostFunctions()
   ├── __processEnv / process (含 Symbol.toStringTag = 'process')
   ├── __cryptoRandomBytes(n) → Go crypto/rand
   ├── __consoleWrite(level, msg) → Go stderr
   └── __goFetchRaw(url, method, headers, body) → Go http.Client (async)

2. webAPIPolyfill
   └── TextEncoder, TextDecoder, Headers, Request, Response

3. cryptoPolyfill
   └── globalThis.crypto.randomUUID / getRandomValues

4. filePolyfill
   └── Blob, File

5. envAPIStub
   └── WebAssembly, performance, setTimeout/clearTimeout, queueMicrotask,
       atob/btoa, navigator, location

6. intlStub
   └── Intl.DateTimeFormat / NumberFormat / Collator

7. structuredCloneGuard
   └── structuredClone (fallback)

8. consoleDef
   └── console.log/info/warn/error/debug → __consoleWrite

9. fetchDef
   └── globalThis.fetch → __goFetchRaw

10. CJS bundle (esbuild 打包的 Astro SSR)
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

require shim 对 `node:stream/web` 主动 `throw`，使 bundle 激活内置的 web-streams-polyfill（同时我们也用 AsyncIterable 路径，双重保险）。

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

### 5. AsyncIterable body 消费

当 `isNode = true`，Astro 的 `renderPage` 返回一个 `Response`，其 `body` 是异步生成器（`AsyncIterable<Uint8Array>`）。
`Response.text()` 需要用 `for await...of` 迭代并用 `TextDecoder` 拼接：
```javascript
for await (var chunk of b) {
    parts.push(dec2.decode(chunk, { stream: true }));
}
```

## 数据流

```
Go HTTP Request
    │ io.ReadAll (≤10MB)
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
QJS: response.text() → for await of asyncIterable → string
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
| 状态共享 | QJS Pool 的每个 runtime 持有独立 JS heap，`session` / `userCartItems` 等模块级变量跨请求保留但不跨 runtime 共享 |
| 流式响应 | 当前实现收集全部 body 再返回，不支持真正的 HTTP 流式传输 |
| WebAssembly | QJS 中 WebAssembly stub 永远返回不支持，依赖 WASM 的功能会失败 |
| Svelte/Vue/React | 客户端 hydration 需要静态资源正确服务，SSR 部分可工作 |
| `Astro.redirect` | 通过 3xx Response 返回，Go 端正确写入 Location 头 |
| Windows symlink | `astro build` 在非开发者模式 Windows 上 EPERM，用 `.netlify/build/entry.mjs` 绕过 |

## 依赖说明

| 依赖 | 版本 | 用途 |
|---|---|---|
| `github.com/fastschema/qjs` | v0.0.6 | QuickJS-NG via wazero（纯 Go，无 CGO） |
| `github.com/tetratelabs/wazero` | v1.9.0 | WebAssembly 运行时（被 qjs 依赖） |
| `github.com/evanw/esbuild` | v0.25.0 | in-process JS 打包 |

## 使用方式

```bash
# 1. 先构建 Astro 项目
cd your-astro-project
astro build

# 2. 启动 netlify-runtime
netlify-runtime \
  --ssr .netlify/build/entry.mjs \
  --dist dist \
  --port 8888
```

CLI 参数：

| 参数 | 默认值 | 说明 |
|---|---|---|
| `--ssr` | `.netlify/v1/functions/ssr/ssr.mjs` | SSR entry 路径 |
| `--dist` | `dist` | Astro 静态输出目录 |
| `--port` | `8888` | 监听端口 |
