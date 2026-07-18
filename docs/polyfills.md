# Polyfill 详解

astro-runtime 唯一的 JS 引擎是 goja（`github.com/grafana/sobek`，纯 Go 实现），它本身是一个
ECMAScript 引擎，缺少大量浏览器/Node.js 才有的运行时 API（Web API、Node 内建模块、Intl 等）。
本文档列出每个 polyfill 的存在原因、覆盖边界和已知局限。

## 评估顺序

```
webAPIPolyfill → cryptoPolyfill → filePolyfill → envAPIStub
→ intlStub → structuredCloneGuard → consoleDef → fetchDef
```

每一步都在前一步之上构建（如 `filePolyfill` 中 `Blob.arrayBuffer()` 调用 `TextEncoder`）。

---

## 1. webAPIPolyfill（js/web-api.js）

### TextEncoder

完整 UTF-8 编码，覆盖：
- ASCII（< 0x80）：1 字节
- Latin-1 扩展（< 0x800）：2 字节
- BMP（< 0x10000）：3 字节
- 补充字符（Emoji 等）：4 字节，正确处理 `codePointAt` / `i += 2`

`encode(str)` 调用 `__go_textEncodeUTF8` host function，Go 直接将字符串转为 `[]byte`（原生 UTF-8），
返回真实 ArrayBuffer，而非 JS 位运算手工构建。

`encodeInto(str, dest)` 写入到已有 TypedArray（Astro 渲染输出用到）。
当 dest 容量不足时，向前回退找到最后一个完整 UTF-8 序列边界（跳过 continuation bytes 0x80–0xBF），
避免写入截断的多字节字符。

### TextDecoder

仅支持 UTF-8（`encoding` 参数接受但忽略非 UTF-8）。
`decode(buf)` 先将字节数组序列化为 base64，再调用 `__go_textDecodeUTF8` host function。

### Headers

- 内部存储为 `Object.create(null)`，key 统一小写
- `append` 多值用 `, ` 连接（符合 HTTP/1.1 规范）
- `Set-Cookie` 单独存入 `_cookies[]` 数组，不参与 `, ` 合并，避免含逗号的 cookie value 被截断
- `getSetCookie()` 直接返回 `_cookies.slice()`，不做 split

### Request

- 支持 `new Request(url, init)` 和 `new Request(existingRequest)`
- `body` 存为字符串，`text()` / `json()` / `arrayBuffer()` 包装为 Promise
- `clone()` 复制全部字段

### Response

- `body` 支持：`null`、`string`、`Uint8Array`、`ReadableStream`（含 `getReader`）、`AsyncIterable`（含 `Symbol.asyncIterator`）
- 所有 body 类型均采用**全量字节收集 + 一次解码**策略：先将 chunk 字节追加到 `allBytes[]`，
  再用 `__go_textDecodeUTF8(__go_bufToB64(JSON.stringify(allBytes)))` 统一解码，
  避免跨 chunk 边界截断多字节 UTF-8 序列
- `Response.json(data, init)` / `Response.redirect(url, status)` / `Response.error()` 静态方法

---

## 2. cryptoPolyfill（js/crypto.js）

### `crypto.randomUUID()`

```javascript
// 16 随机字节 → UUID v4 格式（version 4，RFC 4122 variant）
bytes[6] = (bytes[6] & 0x0f) | 0x40;
bytes[8] = (bytes[8] & 0x3f) | 0x80;
```

### `crypto.getRandomValues(typedArray)`

按 typedArray 的 byteLength 调用 `__go_cryptoRandomBytes`，填充每个字节。
支持所有整数 TypedArray（Uint8Array、Uint32Array 等）。

### `crypto.subtle`

完整 Web Crypto API，由 JS 薄封装层调用 Go host functions（`__go_cryptoSubtle*`）实现。
参见 [components.md](./components.md) crypto_subtle.go 节。

支持的操作：
- `digest`：SHA-1、SHA-256、SHA-384、SHA-512
- `generateKey` / `importKey` / `exportKey`：HMAC（SHA-256/384/512）、AES-GCM、AES-CBC
- `sign` / `verify`：HMAC
- `encrypt` / `decrypt`：AES-GCM（12 字节 nonce）、AES-CBC（16 字节 IV + PKCS7）
- `deriveBits` / `deriveKey`：JS 层已定义接口，调用 `__go_cryptoSubtleDeriveBits` stub（P1，Go 端尚未实现，调用时抛出错误）
- `wrapKey` / `unwrapKey`：抛出 NotSupportedError

### 为何先于 bundle eval

Astro 的 `applyPolyfills()` 在 bundle 初始化时检查 `if (!globalThis.crypto)`，
先设置 `globalThis.crypto` 可防止被 `require('node:crypto').webcrypto` 覆盖（require 返回 `{ webcrypto: globalThis.crypto }` — 实际上是循环引用，不覆盖）。

---

## 3. filePolyfill（js/file.js）

### Blob

goja/sobek 无内置 Blob（`typeof Blob === 'undefined'`）。实现：
```javascript
class Blob {
    constructor(parts, opts) { this._parts = parts || []; ... }
    async text() { return this._parts.map(p => String(p)).join(''); }
    async arrayBuffer() { return new TextEncoder().encode(await this.text()).buffer; }
}
```

### File extends Blob

```javascript
class File extends globalThis.Blob {
    constructor(parts, name, opts) {
        super(parts, opts || {});
        this.name = name || '';
        this.lastModified = (opts && opts.lastModified) || Date.now();
    }
}
```

---

## 4. envAPIStub（js/env-api.js）

### WebAssembly

Stub，`instantiate/compile` 返回 rejected Promise，`validate` 返回 `false`。
Astro 的某些路径检查 `typeof WebAssembly`，不设置会抛 ReferenceError。

### setTimeout / clearTimeout

```javascript
globalThis.setTimeout = function(fn, delay) {
    var id = __timerId++;
    if (!delay) {
        Promise.resolve().then(function() {
            if (__timerMap[id] !== false) fn();
        });
    }
    return id;
};
```

- 仅用 microtask 实现"延迟"，不是真正的宏任务调度
- 非零 delay 同样立即执行（goja/sobek 没有原生 `setTimeout`/`clearTimeout`/`setInterval`，
  也没有 OS 定时器或事件循环可以真正延迟；SSR 中 delay 值通常无意义）

### queueMicrotask

```javascript
globalThis.queueMicrotask = function(fn) { Promise.resolve().then(fn); };
```

goja/sobek 没有原生 `queueMicrotask`；web-streams-polyfill 内部用到此 API。

### btoa / atob

通过 `__go_bufToB64` / `__go_b64ToBuf` host functions 实现，Go `encoding/base64` 处理，
严格校验输入，不会静默损坏非法字符。

### URL / URLSearchParams

`URL` 构造时调用 `__go_urlParse` host function，由 Go `net/url` 解析，支持：
- 绝对 URL 和相对 URL（base 参数）
- IPv6 地址、credentials（`username:password@host`）
- `%` percent-encoding 规范化
- 完整的 `searchParams`（URLSearchParams 实例）

`search` 属性通过 `Object.defineProperty` getter/setter 实现与 `searchParams` 的双向同步：
设置 `url.search = '?foo=1'` 会重建对应的 `URLSearchParams` 对象。

---

## 5. intlStub（js/intl.js）

goja/sobek 完全不包含 ECMA-402（Internationalization API）——不是"可能不支持某些 IANA 时区名称"，
而是 `typeof Intl === 'undefined'`，整个 `Intl` 命名空间都不存在。
Astro 的日志模块和某些日期格式化路径调用 `new Intl.DateTimeFormat()`。

| API | 实现 |
|---|---|
| `Intl.DateTimeFormat` | `format(d)` → `toISOString()`，`formatToParts` → `[]` |
| `Intl.NumberFormat` | `format(n)` → `String(n)` |
| `Intl.Collator` | `compare(a,b)` → 字典序 |
| `Intl.getCanonicalLocales` | 原样返回输入 |
| `Intl.supportedValuesOf` | 返回空数组 |

locale 参数被接受但忽略，不支持本地化格式。

---

## 6. structuredCloneGuard（js/structured-clone.js）

goja/sobek 没有内置 `structuredClone`（`typeof structuredClone === 'undefined'`）。
这里用 JSON 往返实现兜底：`JSON.parse(JSON.stringify(v))`，不支持循环引用、`Date`、`Map`、`Set`、
`RegExp` 等 JSON 不能表示的特殊类型。

---

## 7. consoleDef（js/console.js）

### Error 对象格式化

```javascript
if (a instanceof Error || (a && typeof a.message === 'string' && typeof a.stack === 'string')) {
    return (a.name ? a.name + ': ' : '') + a.message + '\n' + a.stack;
}
```

**为何需要特殊处理**：goja/sobek 中 Error 的 `message` 和 `stack` 属性同样为不可枚举
（`Object.getOwnPropertyDescriptor(err, 'message').enumerable === false`），
`JSON.stringify(error)` 返回 `{}`，错误信息完全丢失，因此需要在 `fmtArg` 里对 `Error` 特殊处理。

另外，console.js 顶部还有一段 `patchStack` 逻辑，用于确保 `err.stack` 以 `Name: message` 开头。
实测 goja/sobek 抛出的 Error 的 `stack` 已经原生带有这个前缀（例如 `"Error: boom\n\tat ..."`），
所以这段逻辑在 goja 下是无操作的空跑（no-op）；保留它是为了防御性兼容——万一某个 Error 子类或
自定义 Error 的 `stack` 不带前缀，仍能被正确修正。

### 输出格式

```
[JS error] <message>
[JS warn]  <message>
[JS log]   <message>
```

输出到 Go 的 `os.Stderr`，与 Go 日志混合显示。

---

## 8. fetchDef（js/fetch.js）

### 实现路径

```
globalThis.fetch(input, init)
  → __go_fetchRaw(url, method, headersJSON, body)  [async host function]
  → Go: fetchClient.Do(req)（30 秒超时）
  → Go: JSON { status, headers, body }
  → new Response(body, { status, headers })
```

### 已知局限

- 不支持 `credentials: 'include'`（cookie jar 未实现，cookie 通过 init.headers 手动传递）
- 不支持 `ReadableStream` 作为 `init.body`
- 响应 body 限制 10MB（`io.LimitReader`）
- 不支持 `AbortSignal` / `AbortController`
- `mode`、`cache`、`redirect` 等选项被忽略

---

## Polyfill 缺失说明

以下 API 未实现，若 SSR bundle 在服务端渲染路径中用到会抛错：

| API | 说明 |
|---|---|
| `WebSocket` | SSR 路径不需要 |
| `EventSource` | SSR 路径不需要 |
| `Worker` | goja/sobek 无原生线程支持，也没有 Worker/postMessage 的运行时基础 |
| `IndexedDB` / `localStorage` | SSR 路径不需要 |
| `Canvas` / `WebGL` | SSR 路径不需要 |
| `Intl` 本地化格式 | stub 忽略 locale |
| `Response.formData()` | 未实现 |
| `Request.formData()` | 未实现 |
| `crypto.subtle.deriveBits` / `deriveKey` | JS 层接口已定义，Go 端 stub 尚未实现（P1），调用时抛出 OperationError |
| ECDSA / RSA-OAEP | 未实现 |
