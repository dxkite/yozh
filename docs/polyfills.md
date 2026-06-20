# Polyfill 详解

QuickJS-NG（通过 wazero 运行）缺少大量浏览器/Node.js API。
本文档列出每个 polyfill 的存在原因、覆盖边界和已知局限。

## 评估顺序

```
webAPIPolyfill → cryptoPolyfill → filePolyfill → envAPIStub
→ intlStub → structuredCloneGuard → consoleDef → fetchDef
```

每一步都在前一步之上构建（如 `filePolyfill` 中 `Blob.arrayBuffer()` 调用 `TextEncoder`）。

---

## 1. webAPIPolyfill

### TextEncoder

完整 UTF-8 编码，覆盖：
- ASCII（< 0x80）：1 字节
- Latin-1 扩展（< 0x800）：2 字节
- BMP（< 0x10000）：3 字节
- 补充字符（Emoji 等）：4 字节，正确处理 `codePointAt` / `i += 2`

`encodeInto(str, dest)` 写入到已有 TypedArray（Astro 渲染输出用到）。

### TextDecoder

仅支持 UTF-8（`encoding` 参数接受但忽略非 UTF-8）。
不支持 `stream: true` 的跨块 boundary 处理（对 SSR 够用，不做流式解码）。

### Headers

- 内部存储为 `Object.create(null)`，key 统一小写
- `append` 多值用 `, ` 连接（符合 HTTP/1.1 规范）
- `getSetCookie()` 返回数组（Set-Cookie 不能合并）
- **已知局限**：多值 Set-Cookie 合并后再 `split(', ')` 可能在 cookie value 含逗号时误切

### Request

- 支持 `new Request(url, init)` 和 `new Request(existingRequest)`
- `body` 存为字符串，`text()` / `json()` / `arrayBuffer()` 同步返回（包装为 Promise）
- `clone()` 复制全部字段

### Response

- `body` 支持：`null`、`string`、`Uint8Array`、`ReadableStream`（含 `getReader`）、`AsyncIterable`（含 `Symbol.asyncIterator`）
- `Response.json(data, init)` 静态方法
- `Response.redirect(url, status)` 静态方法
- **已知局限**：`body instanceof Uint8Array` 在存为 body 时直接 `TextDecoder.decode()`，不保留二进制数据

---

## 2. cryptoPolyfill

### `crypto.randomUUID()`

```javascript
// 16 随机字节 → UUID v4 格式
var bytes = JSON.parse(__cryptoRandomBytes(16));
bytes[6] = (bytes[6] & 0x0f) | 0x40;  // version 4
bytes[8] = (bytes[8] & 0x3f) | 0x80;  // variant RFC 4122
```

### `crypto.getRandomValues(typedArray)`

按 typedArray 的 byteLength 调用 `__cryptoRandomBytes`，填充每个字节。
支持 `Uint8Array`, `Int8Array`, `Uint16Array`, `Uint32Array` 等（实际按字节填充）。

### 为何先于 bundle eval

Astro 的 `applyPolyfills()` 在 bundle 初始化时检查 `if (!globalThis.crypto)`，
先设置 `globalThis.crypto` 可防止被 `require('node:crypto').webcrypto` 覆盖（require 返回 `{}`）。

---

## 3. filePolyfill

### Blob

QJS 无内置 Blob。实现：
```javascript
class Blob {
    constructor(parts, opts) {
        this._parts = parts || [];
        this.type = (opts && opts.type) || '';
        this.size = this._parts.reduce((n, p) => n + (p && p.length != null ? p.length : 0), 0);
    }
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

`Date.now()` 在 QJS 中可用（非 `new Date()` 无参数构造）。

---

## 4. envAPIStub

### WebAssembly

```javascript
globalThis.WebAssembly = {
    validate() { return false; },
    instantiate() { return Promise.reject(new Error('WebAssembly not supported')); },
    compile() { return Promise.reject(new Error('WebAssembly not supported')); },
}
```

Astro 的某些路径检查 `typeof WebAssembly`，不设置会抛 ReferenceError。

### setTimeout / clearTimeout

```javascript
var __timerMap = Object.create(null);
var __timerId = 1;
globalThis.setTimeout = function(fn, delay) {
    var id = __timerId++;
    if (!delay) {
        Promise.resolve().then(function() {
            if (__timerMap[id] !== false) {
                delete __timerMap[id];
                if (typeof fn === 'function') fn();
            }
        });
    }
    __timerMap[id] = true;
    return id;
};
globalThis.clearTimeout = function(id) { __timerMap[id] = false; };
```

- 仅用 microtask 实现"延迟"，不是真正的宏任务调度
- 非零 delay 同样立即执行（QJS 无 OS 定时器，SSR 中 delay 值通常无意义）
- `clearTimeout` 通过标记 `false` 防止执行（先设置 id 再调度，否则 `clearTimeout` 的竞争条件处理不了——实际上单线程无问题）

### queueMicrotask

```javascript
globalThis.queueMicrotask = function(fn) { Promise.resolve().then(fn); };
```

web-streams-polyfill 内部用到此 API。

### URL

完整实现，处理：
- 绝对 URL：`protocol://host:port/path?search#hash`
- 相对路径（相对于 `base`）
- `URL.canParse(url, base)` 静态方法
- `searchParams`（URLSearchParams 实例）
- `toString()` / `toJSON()` 返回 `href`

**已知局限**：
- URL 解析用正则，不是完整的 WHATWG URL 规范解析器
- 不支持 `username:password@host` 格式（解析后 username/password 为空字符串）
- `pathname` 不做 percent-encoding 规范化

### URLSearchParams

```
get / getAll / has / set / append / delete / forEach / toString / [Symbol.iterator]
```

`toString()` 使用 `encodeURIComponent` 编码 key 和 value。

---

## 5. intlStub

### 为何需要

QuickJS-NG 不包含 ECMA-402（Internationalization API）。
Astro 的日志模块和某些日期格式化路径调用 `new Intl.DateTimeFormat()`。

### 实现范围

| API | 实现 |
|---|---|
| `Intl.DateTimeFormat` | `format(d)` → `toISOString()`，`formatToParts` → `[]` |
| `Intl.NumberFormat` | `format(n)` → `String(n)` |
| `Intl.Collator` | `compare(a,b)` → 字典序 |
| `Intl.getCanonicalLocales` | 原样返回输入 |
| `Intl.supportedValuesOf` | 返回空数组 |

不支持本地化格式（locale 参数被接受但忽略）。

---

## 6. structuredCloneGuard

QuickJS-NG 已内置 `structuredClone`，此处仅为 fallback。
JSON 往返实现不支持循环引用、`Date`、`Map`、`Set`、`RegExp` 等特殊类型。

---

## 7. consoleDef

### Error 对象格式化

```javascript
if (a instanceof Error || (a && typeof a.message === 'string' && typeof a.stack === 'string')) {
    var s = a.name ? a.name + ': ' : '';
    if (a.message) s += a.message;
    if (a.stack) s += '\n' + a.stack;
    return s;
}
```

**为何需要特殊处理**：QuickJS 中 Error 的 `message` 和 `stack` 属性为不可枚举，
`JSON.stringify(error)` 返回 `{}`，错误信息完全丢失。

### 输出格式

```
[JS error] <message>
[JS warn]  <message>
[JS log]   <message>
```

输出到 Go 的 `os.Stderr`，与 Go 日志混合显示。

---

## 8. fetchDef

### 实现路径

```
globalThis.fetch(input, init)
  → __goFetchRaw(url, method, headersJSON, body)   [async host function]
  → Go: http.DefaultClient.Do(req)
  → Go: JSON { status, headers, body }
  → new Response(body, { status, headers })
```

### 已知局限

- 不支持 `credentials: 'include'`（cookie jar 未实现，cookie 通过 init.headers 手动传递）
- 不支持 `ReadableStream` 作为 `init.body`
- 响应 body 限制 10MB（`io.LimitReader`）
- 不支持 `AbortSignal` / `AbortController`
- `mode`, `cache`, `redirect` 等选项被忽略

---

## Polyfill 缺失说明

以下 API 未实现，若 SSR bundle 在服务端渲染路径中用到会抛错：

| API | 说明 |
|---|---|
| `WebSocket` | SSR 路径不需要 |
| `EventSource` | SSR 路径不需要 |
| `Worker` | QJS 无线程 |
| `IndexedDB` / `localStorage` | SSR 路径不需要 |
| `Canvas` / `WebGL` | SSR 路径不需要 |
| `crypto.subtle` | 仅 `randomUUID`/`getRandomValues` |
| `Intl` 本地化格式 | stub 忽略 locale |
| `Response.formData()` | 未实现 |
| `Request.formData()` | 未实现 |
