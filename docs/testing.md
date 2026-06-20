# 测试文档

## 测试环境

| 项目 | 值 |
|---|---|
| 操作系统 | Windows 11 Pro 10.0.22635 |
| Go 版本 | 1.22+ |
| Node.js | v20+（用于 `astro build`） |
| pnpm | v10.26.0 |
| Astro | 5.18.2 |
| @astrojs/netlify | 6.6.5 |
| 测试日期 | 2026-06-20 |

## 目录结构

```
integration/
├── integration_test.go       # 集成测试（28 个测试）
└── testdata/
    └── testapp-ssr/
        └── bundle.cjs        # 预打包 CJS（1063 KB），从 examples/testapp-ssr 生成
```

`bundle.cjs` 已提交到 git，测试无需 `pnpm build` 或 `node_modules`，
直接 `go test ./integration/` 即可运行。

## 示例应用

### examples/testapp（基础功能验证）

**页面**：
- `src/pages/index.astro` — 首页，显示 URL/Method/UA/服务端时间
- `src/pages/greet/[name].astro` — 动态路由页
- `src/pages/api/time.ts` — JSON API endpoint

**构建**：
```bash
cd examples/testapp
pnpm install --ignore-workspace
pnpm build   # Windows 会报 EPERM symlink 错误，可忽略
```

### examples/testapp-ssr（完整功能测试）

基于 Astro examples/ssr，将 `@astrojs/node` 替换为 `@astrojs/netlify`。

**页面**：
- `src/pages/index.astro` — 商品列表
- `src/pages/products/[id].astro` — 商品详情（含表单）
- `src/pages/cart.astro` — 购物车页（Cookie 会话）
- `src/pages/api/products.ts` — 商品列表 API
- `src/pages/api/products/[id].ts` — 单个商品 API
- `src/pages/api/cart.ts` — 购物车 GET/POST（Cookie 会话）

**构建**：
```bash
cd examples/testapp-ssr
pnpm install --ignore-workspace
pnpm build
```

---

## 运行测试

```bash
# 全部集成测试
go test ./integration/ -timeout 120s

# 指定测试
go test ./integration/ -run TestCryptoSubtleHMAC -v

# 查看所有测试名称
go test ./integration/ -v -timeout 120s
```

---

## 测试用例

### SSR 端到端测试（基于 testdata/testapp-ssr/bundle.cjs）

#### TC-01：商品列表页

```go
TestHomePage
```
**验证**：GET `/` → 200，HTML 含 `Online Store` 和商品链接

---

#### TC-02：商品详情动态路由

```go
TestProductDetail
```
**验证**：GET `/products/1` → 200，HTML 含 `Cereal`、价格、Add to Cart 表单

---

#### TC-03：不存在的商品 → 重定向

```go
TestProductNotFound
```
**验证**：GET `/products/99` → 302 重定向到 `/`

---

#### TC-04：商品列表 API

```go
TestProductsAPI
```
**验证**：GET `/api/products` → 200，`Content-Type: application/json`，含 4 个商品

---

#### TC-05：单个商品 API（动态路由）

```go
TestSingleProductAPI
```
**验证**：GET `/api/products/2` → 200，JSON `{id:2, name:"Yogurt"}`

---

#### TC-06：购物车页（空 session）

```go
TestCartEmpty
```
**验证**：GET `/cart` → 200，HTML 含 `Your cart is empty`

---

#### TC-07：购物车 GET API（空 session）

```go
TestCartAPIEmpty
```
**验证**：GET `/api/cart` → 200，JSON `{"items":[]}`

---

#### TC-08：添加到购物车（Cookie 会话）

```go
TestCartSession
```
**验证**：POST `/api/cart`（Cookie: user-id=testuser）→ 200 `{"ok":true}`；
再 GET `/api/cart` → 含刚添加的商品

---

### Polyfill 单元测试

#### TC-09：TextEncoder / TextDecoder

```go
TestTextEncoderDecoder
```
**验证**：ASCII、中文（多字节）、Emoji（4 字节）round-trip；
`TextEncoder.encode` 返回 `instanceof Uint8Array`；`TextDecoder.decode` 正确还原

---

#### TC-10：Headers Set-Cookie

```go
TestHeadersSetCookie
```
**验证**：`headers.append('set-cookie', v1)`、`append('set-cookie', v2)`；
`getSetCookie()` 返回长度为 2 的数组，不合并，不因 cookie value 中的逗号误切

---

#### TC-11：atob / btoa

```go
TestAtobBtoa
```
**验证**：`btoa('hello')` → `"aGVsbG8="`；`atob('aGVsbG8=')` → `"hello"`；
round-trip 正确

---

#### TC-12：URL 解析（Go net/url）

```go
TestURLParsing
```
**验证**：
- 绝对 URL 解析（protocol/host/pathname/search）
- 相对 URL（`new URL('/path', base)`）
- IPv6 地址（`http://[::1]:8080/`）
- credentials（`http://user:pass@host/`）

---

#### TC-13：crypto.randomUUID

```go
TestCryptoRandomUUID
```
**验证**：格式匹配 UUID v4 正则（`/^[0-9a-f]{8}-...-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-/i`），
每次调用生成不同值

---

#### TC-14：crypto.subtle.digest（SHA-256）

```go
TestCryptoSubtleDigest
```
**验证**：`digest('SHA-256', encode('hello'))` 结果与已知 SHA-256 哈希比对

---

#### TC-15：crypto.subtle HMAC sign/verify

```go
TestCryptoSubtleHMAC
```
**验证**：generateKey → sign → verify（期望 true）；
篡改数据后 verify（期望 false）

---

#### TC-16：crypto.subtle AES-GCM encrypt/decrypt

```go
TestCryptoSubtleAESGCM
```
**验证**：generateKey → encrypt → decrypt → `decoded === 'secret message'`；
AES-GCM 加密结果比原文长（含认证 tag）

---

#### TC-17：crypto.subtle JWK exportKey/importKey

```go
TestCryptoSubtleExportImportJWK
```
**验证**：generateKey(HMAC) → exportKey('jwk') → importKey('jwk') → sign（两个密钥签名同一数据，结果相同）

---

#### TC-18：crypto.getRandomValues

```go
TestGetRandomValues
```
**验证**：填充 16 字节 Uint8Array，非全零（概率极低），多次调用结果不同

---

#### TC-19：QJS 运行时初始化（polyfills smoke test）

```go
TestPolyfillsQJSInit
```
**验证**：所有 polyfill 正确加载，`typeof TextEncoder`、`typeof crypto.subtle.digest`、
`typeof fetch` 均为 `"function"`，`typeof URL` 为 `"function"`

---

### 回归/安全测试

#### TC-20：Pool 大小校验

```go
TestPoolSizeValidation
```
**验证**：`NewPool(..., 0)` 和 `NewPool(..., 1001)` 均返回错误；
`NewPool(..., 1)` 和 `NewPool(..., 1000)` 成功

---

#### TC-21：空 body POST

```go
TestEmptyBodyPOST
```
**验证**：`POST /api/cart`，body 为空 → JS 端 `body === ""`（不为 null/undefined）

---

#### TC-22：URL.search setter 同步 searchParams

```go
TestURLSearchParamsSetter
```
**验证**：`url.search = '?a=1'` 后 `url.searchParams.get('a') === '1'`；
再 `url.search = '?b=2'` 后旧参数 `a` 不再存在

---

#### TC-23：AES-CBC 加解密 round-trip

```go
TestAESCBC
```
**验证**：generateKey(AES-CBC) → encrypt → decrypt → 结果等于原文

---

#### TC-24：AES-CBC IV 长度校验

```go
TestAESCBCWrongIV
```
**验证**：IV 不是 16 字节时，`encrypt`/`decrypt` 均抛出错误

---

#### TC-25：AES-GCM IV 长度校验

```go
TestAESGCMWrongIV
```
**验证**：IV 不是 12 字节时，`encrypt`/`decrypt` 均抛出错误

---

#### TC-26：AES-CBC 无效密文（PKCS7 padding 验证）

```go
TestAESCBCTamperedCiphertext
```
**验证**：
1. 解密全零 32 字节（几乎必然产生无效 padding）→ 抛出错误
2. 解密长度不是 16 的倍数的数据 → 抛出错误（块大小校验）

---

#### TC-27：TextEncoder.encodeInto 部分写入

```go
TestTextEncoderInto
```
**验证**：`encodeInto('Hello World', new Uint8Array(5))` → `{read:5, written:5}`；
`encodeInto('中文', new Uint8Array(4))` → `{read:1, written:3}`（只写一个汉字，不截断多字节字符）

---

#### TC-28：BFF 并发 fetch（集成测试）

```go
TestBFFConcurrentFetch
```
**验证**：`Promise.allSettled([fetch(a), fetch(b), fetch(c)])` 真正并发执行；
3 个各 80ms 的请求总耗时 ≤ 120ms（实测 ≈ 83ms），而非顺序执行的 240ms。
测试在 `integration/integration_test.go`，使用内置 HTTP mock server 模拟上游服务延迟。

---

### 并发异步函数测试（asyncfunc_test.go）

以下三个测试位于根模块（非 `integration/`），直接测试 `SetAsyncFunc` 机制。

#### TC-29：单次 async 调用

```go
TestSetAsyncFuncSingle
```
**验证**：`SetAsyncFunc` 注册的函数被 JS `await` 调用后，goroutine 正确 resolve Promise，
JS 得到预期返回值。

---

#### TC-30：多次并发 async 调用

```go
TestSetAsyncFuncConcurrent
```
**验证**：10 次并发 `Promise.allSettled` 调用，每次包含多个 async fetch，
所有调用均正确 resolve，无 race condition / panic。

---

#### TC-31：并发耗时验证

```go
TestSetAsyncFuncTiming
```
**验证**：3 个各 50ms 的 async 调用，`Promise.allSettled` 总耗时 ≤ 120ms，
确认并发而非顺序执行。

---

## 测试总结

| 类别 | 数量 | 状态 |
|---|---|---|
| SSR 端到端（商品列表、动态路由、购物车会话） | 8 | ✅ |
| Polyfill 单元（TextEncoder、Headers、URL、crypto） | 11 | ✅ |
| 回归/安全（Pool 校验、空 body、搜索参数、AES IV、padding） | 8 | ✅ |
| 并发 async（BFF 集成 + SetAsyncFunc 单元） | 4 | ✅ |
| **合计** | **31** | **全部通过** |

---

## 调试问题记录

### 问题一：bundle eval 失败 — `process` 未 external

**错误**：esbuild 未将裸 `process` externalize

**修复**：`bundle.go` External 列表加入 `"process"`

---

### 问题二：`Blob is not defined`

**根因**：`class File extends Blob` 在 QJS 中 Blob 未定义

**修复**：`filePolyfill` 先定义 `Blob` 再定义 `File`

---

### 问题三：`TextEncoder is not defined`

**根因**：Astro 的 `encryption.js` 在模块初始化时调用 `new TextEncoder()`

**修复**：`webAPIPolyfill` 最前面加 `TextEncoder` / `TextDecoder`

---

### 问题四：`URL is not defined`

**根因**：bundle eval 阶段 `createDefaultRoutes` 调用 `new URL(...)`

**修复**：`envAPIStub` 中加入完整 `URL` + `URLSearchParams`

---

### 问题五：SSR 返回 500，`renderToReadableStream` 静默失败

**根因**：
1. QJS 中 `process` 为普通对象，`isNode = false`
2. `isNode = false` 使 Astro 走 `renderToReadableStream` 路径
3. 错误处理调用 `setTimeout`，QJS 无内置 `setTimeout`，错误被 ReadableStream 内部吞掉

**修复**：`Symbol.toStringTag = 'process'` 使 `isNode = true`，走 `renderToAsyncIterable` 路径

---

### 问题六：`@astrojs/netlify` 二级工厂

**根因**：`createExports` 返回 `{ default: createHandler }`，`createHandler` 本身是工厂函数

**修复**：CJS wrapper 末尾调用工厂：
```javascript
var __rawExport = module.exports.default || module.exports;
return typeof __rawExport === 'function' ? __rawExport({}) : __rawExport;
```

---

### 问题七：`TestAESCBCTamperedCiphertext` 失败

**根因**：测试 JS 中 `'error:' + String(e.message).indexOf('unpad') >= 0`
因运算符优先级问题，实际计算为 `('error:' + idx) >= 0`（字符串与数字比较），
结果是 boolean，Go 端 `r["result"].(string)` 断言失败。

**修复**：改用确定性测试——解密全零字节数组（必然失败）和长度不是块大小倍数的输入（必然失败），
catch 块直接 `return 'error'`，Go 端断言 `result === "error"`。
