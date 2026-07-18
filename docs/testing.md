# 测试文档

## 测试环境

| 项目 | 值 |
|---|---|
| 操作系统 | macOS Darwin 25.4.0 |
| Go 版本 | 1.25+ |
| Node.js | v20+（用于 `astro build`） |
| pnpm | v10+ |
| Astro | 5.x |
| @astrojs/netlify | 6.x |
| JS 引擎（QJS） | github.com/dxkite/qjs（QuickJS/WASM） |
| JS 引擎（goja） | github.com/grafana/sobek（goja Grafana fork） |
| 更新日期 | 2026-06-29 |

## 目录结构

```
asyncfunc_test.go             # SetGoAsyncFunc 单元测试（3 个）
goja_test.go                  # goja/sobek 引擎单元测试（2 个）
pack_rebuild_test.go          # pack 重建测试（需 UPDATE_TESTDATA=1）
rebuild_testdata_test.go      # testdata 重建（需 UPDATE_TESTDATA=1）
shim_test.go                  # Node.js 内建模块 shim 测试（14 个）

integration/
├── integration_test.go       # SSR + polyfill + BFF + pack + context + trace（56 个）
├── images_test.go            # 图像 CDN 测试（11 个）
├── bench_http_test.go        # HTTP 端到端 benchmark（6 个 Benchmark）
└── testdata/
    └── example/
        ├── bundle.mjs        # 预打包 ESM（从 examples/example 生成）
        └── example.pack      # 预打包 pack（bundle.bc + bundle-goja.mjs + dist/）
```

`bundle.mjs` 和 `example.pack` 已提交到 git，
直接 `go test ./...` 即可运行，无需 `pnpm build`。

重新生成 testdata：
```bash
cd examples/example && pnpm install && pnpm build && cd ../..
UPDATE_TESTDATA=1 go test -run TestRebuildTestdata -v -timeout 120s
```

## 示例应用

### examples/example — 完整功能验证

覆盖所有 runtime 功能：SSR 页面、动态路由、API 路由、Cookie 会话、
HMAC token、AES-GCM 加密、BFF 聚合、Image 组件（图像 CDN）。

**页面与路由**：
- `src/pages/index.astro` — 商品列表（含 `<Image>` 组件）
- `src/pages/products/[id].astro` — 商品详情
- `src/pages/cart.astro` — 购物车页（AES-GCM Cookie 会话）
- `src/pages/api/products.ts` — 商品列表 JSON
- `src/pages/api/products/[id].ts` — 单个商品 JSON
- `src/pages/api/cart.ts` — 购物车 GET/POST（Cookie 会话）
- `src/pages/api/token.ts` — HMAC sign/verify
- `src/pages/api/summary.ts` — BFF 聚合（并发 fetch）

---

## 运行测试

```bash
# 全部测试
go test ./... -timeout 120s

# 指定测试
go test ./integration/ -run TestCryptoSubtleHMAC -v

# 只跑 goja 引擎测试
go test . -run TestGoja -v

# 只跑图像 CDN 测试
go test ./integration/ -run TestImageCDN -v

# 重建 testdata（需先 pnpm build）
UPDATE_TESTDATA=1 go test -run TestRebuildTestdata -v -timeout 120s
```

---

## 测试用例

### goja/sobek 引擎测试（根模块）

#### TC-G01：Pool 初始化
```go
TestGojaPoolInit
```
**验证**：`WithEngineKind(EngineGoja)` 创建 Pool（size=1）不报错；polyfills + IIFE bundle + bootstrap 加载成功。

---

#### TC-G02：请求处理
```go
TestGojaRequest
```
**验证**：goja Pool 处理 GET `/hello` → 200，body 为 `hello world`。

---

### Node.js 内建模块 Shim 测试（根模块）

`shim_test.go` 验证每个 Node.js 内建模块的 ESM stub 能被 QJS 正确加载和执行。

| 测试 | 模块 |
|---|---|
| TestShimPath | `node:path` |
| TestShimNet | `node:net` |
| TestShimEvents | `node:events` |
| TestShimAsyncHooks | `node:async_hooks` |
| TestShimStream | `node:stream` |
| TestShimUtil | `node:util` |
| TestShimFS | `node:fs` |
| TestShimModule | `node:module` |
| TestShimTTY | `node:tty` |
| TestShimHTTP2 | `node:http2` |
| TestShimURL | `node:url` |
| TestShimCrypto | `node:crypto` |
| TestShimBuffer | `node:buffer` |
| TestShimProcess | `node:process` / `process` |

各测试：加载对应 shim ESM stub → 断言 `default export` 存在（不为 null/undefined）。

---

### SSR 端到端测试（sharedPool，examples/example bundle）

#### TC-01：商品列表页
```go
TestHomePage
```
**验证**：GET `/` → 200，HTML 含 `Online Store`

---

#### TC-02：商品详情动态路由
```go
TestProductDetail
```
**验证**：GET `/products/1` → 200，HTML 含 `Cereal`

---

#### TC-03：不存在的商品 → 重定向
```go
TestProductNotFound
```
**验证**：GET `/products/99` → 301/302/200

---

#### TC-04：商品列表 API
```go
TestProductsAPI
```
**验证**：GET `/api/products` → 200，JSON 数组非空

---

#### TC-05：单个商品 API
```go
TestSingleProductAPI
```
**验证**：GET `/api/products/2` → 200，JSON 含 `Yogurt`

---

#### TC-06：购物车页（空 session）
```go
TestCartEmpty
```
**验证**：GET `/cart` → 200，含 `empty`

---

#### TC-07：购物车 GET API（空 session）
```go
TestCartAPIEmpty
```
**验证**：GET `/api/cart` → 200，JSON 含 `items`

---

#### TC-08：购物车 Cookie 会话（sessionPool size=1）
```go
TestCartSession
```
**验证**：POST `/api/cart` 添加商品 → GET `/api/cart` 含 `Cereal` → GET `/cart` 页面含 `Cereal`。
使用 size=1 的 Pool，保证所有请求打到同一 QJS runtime（保留 in-memory session state）。

---

### Polyfill 单元测试（minPool，eval-based）

#### TC-09：TextEncoder / TextDecoder
```go
TestTextEncoderDecoder
```
**验证**：ASCII、中文多字节 round-trip；`encode` → `Uint8Array`；`decode` 正确还原

---

#### TC-10：TextEncoder.encodeInto 部分写入
```go
TestTextEncoderInto
```
**验证**：full fit（`written=5, read=5`）；multi-byte 截断不越界；ASCII+多字节混合部分写

---

#### TC-11：Headers Set-Cookie
```go
TestHeadersSetCookie
```
**验证**：`getSetCookie()` 返回数组长度 2，不因 cookie value 中的逗号误切

---

#### TC-12：atob / btoa
```go
TestAtobBtoa
```
**验证**：`btoa('hello world')` 结果正确；round-trip 无损

---

#### TC-13：URL 解析
```go
TestURLParsing
```
**验证**：绝对 URL、相对 URL、IPv6 地址解析正确；`URL.canParse` 可用

---

#### TC-14：URL.search setter 同步 searchParams
```go
TestURLSearchParamsSetter
```
**验证**：`url.search = '?a=1'` 后 `searchParams.get('a') === '1'`；再赋值后旧参数消失；`url.search = ''` 后 searchParams 清空

---

#### TC-15：crypto.randomUUID
```go
TestCryptoRandomUUID
```
**验证**：36 字符，5 个 `-` 分隔组

---

#### TC-16：crypto.subtle.digest
```go
TestCryptoSubtleDigest
```
**验证**：SHA-256（32 字节）、SHA-512（64 字节）摘要长度正确

---

#### TC-17：crypto.subtle HMAC sign/verify
```go
TestCryptoSubtleHMAC
```
**验证**：generateKey → sign → verify（true）；篡改数据 verify（false）；importKey raw；exportKey raw

---

#### TC-18：crypto.subtle AES-GCM
```go
TestCryptoSubtleAESGCM
```
**验证**：AES-256-GCM 和 AES-128-GCM encrypt/decrypt round-trip

---

#### TC-19：crypto.subtle JWK export/import
```go
TestCryptoSubtleExportImportJWK
```
**验证**：generateKey(HMAC) → exportKey('jwk') → importKey('jwk') → sign/verify 一致

---

#### TC-20：crypto.getRandomValues
```go
TestGetRandomValues
```
**验证**：16 字节非全零

---

#### TC-21：Polyfills 初始化 smoke test
```go
TestPolyfillsQJSInit
```
**验证**：最小 bundle 创建 Pool（size=2）不报错，即 polyfills 正确加载

---

### 回归 / 安全测试

#### TC-22：Pool 大小校验
```go
TestPoolSizeValidation
```
**验证**：size=-1 / 1001 返回错误；size=0/1/1000 成功

---

#### TC-23：空 body POST
```go
TestEmptyBodyPOST
```
**验证**：POST 空 body → JS `typeof body === "string"`（不为 null）

---

#### TC-24：AES-CBC round-trip
```go
TestAESCBC
```
**验证**：AES-256-CBC encrypt/decrypt round-trip

---

#### TC-25：AES-CBC IV 长度校验
```go
TestAESCBCWrongIV
```
**验证**：IV 不是 16 字节时 encrypt 抛出错误

---

#### TC-26：AES-GCM IV 长度校验
```go
TestAESGCMWrongIV
```
**验证**：IV 不是 12 字节时 encrypt 抛出错误

---

#### TC-27：AES-CBC 无效密文（PKCS7 padding 验证）
```go
TestAESCBCTamperedCiphertext
```
**验证**：解密全零 32 字节 → error；长度非 16 倍数 → error

---

### Netlify Adapter 格式兼容测试

#### TC-28：多种 handler 导出格式
```go
TestNetlifyAdapterFormats
```
子测试：
- `default_export_factory` — `export default function(config) { return handler }` 格式
- `default_export_handler` — `export default async function handler(req, ctx)` 格式（直接导出 handler）
- `named_createHandler_v6` — `export { createHandler }` 具名导出格式（@astrojs/netlify v6）

---

### BFF 集成测试（minPool）

#### TC-29：单次上游 fetch
```go
TestBFFUpstreamFetch
```
**验证**：`fetch(upstreamURL)` → `res.json()` 返回正确数据

---

#### TC-30：多服务聚合（Promise.allSettled）
```go
TestBFFAggregation
```
**验证**：并发调用两个服务，合并结果 `{ name, stock }` 正确

---

#### TC-31：优雅降级（上游 503）
```go
TestBFFGracefulDegradation
```
**验证**：`Promise.allSettled` 不崩溃，成功服务返回数据，失败服务返回 null

---

#### TC-32：并发 fetch 耗时验证
```go
TestBFFConcurrentFetch
```
**验证**：3×80ms 并发请求总耗时 < 240ms（非顺序执行；实测 ~81ms）

---

#### TC-33：BFF 会话中间件（HMAC token）
```go
TestBFFSessionMiddleware
```
**验证**：`btoa(userId)` → HMAC-SHA256 sign → token → verify → decode userId 正确

---

#### TC-34：购物车 Cookie AES-GCM round-trip
```go
TestBFFCartCookieRoundTrip
```
**验证**：`generateKey(AES-GCM)` → encrypt(items) → base64(iv+ct) → decrypt → 相同 items

---

#### TC-35：上游 HMAC 签名请求（端到端）
```go
TestBFFUpstreamHMACAuth
```
**验证**：JS 用 `crypto.subtle.sign` 计算签名，Go HTTP mock 用 `crypto/hmac` 验证，通过返回 200

---

### Pack Runtime 冒烟测试（packRT，example.pack）

#### TC-36：Pack 首页
```go
TestPackHomePage
```
**验证**：`packRT.ServeHTTP` GET `/` → 200，HTML 含 `Online Store`

---

#### TC-37：Pack 商品列表 API
```go
TestPackProductsAPI
```
**验证**：GET `/api/products` → 200，JSON 数组非空

---

#### TC-38：Pack 商品详情
```go
TestPackSingleProduct
```
**验证**：GET `/products/1` → 200，HTML 含 `Cereal`

---

### Context 提取测试

#### TC-39：默认字段提取
```go
TestContextDefaultExtraction
```
**验证**：`Netlify-Context-Source` header 携带 base64 JSON；JS `__go_getContext()` 正确解码 `country`、`ip` 等字段

---

#### TC-40：X-Real-IP fallback
```go
TestContextXRealIPFallback
```
**验证**：无 Context header 时，`ip` 从 `X-Real-IP` header 回退

---

#### TC-41：自定义 ContextProvider
```go
TestContextWithProvider
```
**验证**：`WithContextProvider(fn)` 注入自定义 context，JS 可读取

---

#### TC-42：Provider 覆盖 header
```go
TestContextProviderOverridesHeaders
```
**验证**：provider 返回值优先于 header 中的 context

---

#### TC-43：默认字段回退
```go
TestContextDefaultFallbacks
```
**验证**：header context 为空时各字段回退为合理默认值

---

#### TC-44：JS 侧 Provider Hook
```go
TestContextJSProviderHook
```
**验证**：通过 JS bundle 中的 `__go_getContext` 钩子注入 context 字段，可被 SSR 页面读取

---

### 请求链路追踪测试（RequestTrace）

#### TC-45：追踪 Hook 触发
```go
TestRequestTraceHooks
```
**验证**：`WithRequestTraceHook(fn)` 注册的 hook 在请求完成后被调用，携带正确的 `RequestTrace`

---

#### TC-46：Hook 触发顺序
```go
TestRequestTraceHookOrder
```
**验证**：多个 hook 按注册顺序串行调用

---

#### TC-47：JS Call 计时顺序
```go
TestRequestTraceJSCallOrder
```
**验证**：`JSCallDone` 按调用顺序记录 `__go_fetchRaw`、`__go_sendHeaders`、`__go_sendChunk` 各阶段耗时，时间戳单调递增

---

#### TC-48：多 Hook 组合
```go
TestRequestTraceCompose
```
**验证**：`ComposeRequestTraceHooks` 组合两个 hook，两者均被调用

---

#### TC-49：Pool 等待时间记录
```go
TestRequestTracePoolWaiting
```
**验证**：Pool size=1 时并发请求，第二个请求 `PoolWait > 0`，记录正确排队时间

---

#### TC-50：Fetch 完成追踪
```go
TestRequestTraceFetchDone
```
**验证**：`FetchDone` 回调携带 method、path、status、开始/结束时间

---

#### TC-51：Fetch 错误追踪
```go
TestRequestTraceFetchError
```
**验证**：上游 error 时 `FetchDone` 携带非 nil error

---

#### TC-52：JS Checkpoint 记录
```go
TestRequestTraceJSCheckpointsDone
```
**验证**：bootstrap 中的 `__trace_checkpoint` 调用被正确记录到 `JSCheckpoints`

---

#### TC-53：Nil-safe Hook
```go
TestRequestTraceNilSafe
```
**验证**：不注册 hook 时请求正常完成，无 nil pointer panic

---

### 图像 CDN 测试（images_test.go）

distFS 指向 `examples/example/dist`，含 `images/test.png`（public/）和 `_astro/test.*.png`（`<Image>` 组件生成）。

#### TC-54：缺少 url 参数
```go
TestImageCDNMissingURL
```
**验证**：GET `/.netlify/images?w=32` → 400

---

#### TC-55：图片不存在
```go
TestImageCDNNotFound
```
**验证**：GET `/.netlify/images?url=/images/nonexistent.png` → 404

---

#### TC-56：public 图片直出
```go
TestImageCDNPublicServe
```
**验证**：GET `/.netlify/images?url=/images/test.png` → 200，`Content-Type: image/*`

---

#### TC-57：public 图片缩宽
```go
TestImageCDNPublicResizeWidth
```
**验证**：`&w=16` → 解码图片宽度 === 16

---

#### TC-58：public 图片 fill 缩放
```go
TestImageCDNPublicResizeBoth
```
**验证**：`&w=20&h=10&fit=fill` → 解码图片 20×10

---

#### TC-59：PNG 格式输出
```go
TestImageCDNPublicFormatPNG
```
**验证**：`&fm=png` → `Content-Type: image/png`

---

#### TC-60：JPEG 格式输出
```go
TestImageCDNPublicFormatJPEG
```
**验证**：`&fm=jpg` → `Content-Type: image/jpeg`

---

#### TC-61：Astro `<Image>` 组件生成的哈希图片
```go
TestImageCDNAstroAsset
```
**验证**：动态查找 `_astro/test.*.png`，`/.netlify/images?url=/_astro/test.*.png` → 200，图片宽度 > 0

---

#### TC-62：Astro 资产 cover 缩放
```go
TestImageCDNAstroAssetResize
```
**验证**：`&w=16&h=16&fit=cover` → 解码图片 16×16

---

#### TC-63：Pack 内嵌 distFS 图片
```go
TestImageCDNFromPack
```
**验证**：`HandleImageCDN(packRT.DistFS(), ...)` GET `?url=/images/test.png&w=8&fm=png` → 200，`Content-Type: image/png`

---

#### TC-64：绝对 URL 上游图片
```go
TestImageCDNAbsoluteURL
```
**验证**：上游 HTTP mock server 提供 PNG，`url=http://...` → 200，解码后 8×8（contain 缩放）

---

### 并发异步函数测试（asyncfunc_test.go，根模块）

#### TC-65：单次 async 调用
```go
TestSetAsyncFuncSingle
```
**验证**：`SetGoAsyncFunc` 注册的函数被 `await` 调用，goroutine 正确 resolve Promise

---

#### TC-66：多次并发 async 调用
```go
TestSetAsyncFuncConcurrent
```
**验证**：10 次并发 `Promise.allSettled`，所有调用均正确 resolve，无 race condition

---

#### TC-67：并发耗时验证
```go
TestSetAsyncFuncTiming
```
**验证**：3 个各 50ms 的 async 调用，总耗时 ≤ 120ms（并发执行；实测 ~100ms）

---

## 测试总结

| 类别 | 测试数 | 状态 |
|---|---|---|
| goja/sobek 引擎（Pool 初始化、请求处理） | 2 | ✅ |
| Node.js shim（14 个内建模块 ESM stub） | 14 | ✅ |
| SSR 端到端（商品列表、动态路由、购物车会话） | 8 | ✅ |
| Polyfill 单元（TextEncoder、Headers、URL、crypto） | 13 | ✅ |
| 回归/安全（Pool 校验、空 body、AES IV/padding） | 6 | ✅ |
| Netlify Adapter 格式兼容（3 种 export 格式） | 1 (+3 subtests) | ✅ |
| BFF 集成（fetch、聚合、降级、并发、HMAC、AES-GCM） | 7 | ✅ |
| Pack Runtime 冒烟（NewRuntime from pack，ServeHTTP） | 3 | ✅ |
| Context 提取（默认/fallback/provider/JS hook） | 6 | ✅ |
| 请求链路追踪（hooks、计时、fetch、checkpoint） | 9 | ✅ |
| 图像 CDN（public/Astro asset/pack FS/绝对 URL/格式/缩放） | 11 | ✅ |
| 并发 async（SetGoAsyncFunc 单元） | 3 | ✅ |
| **合计（Test 函数）** | **83** | **全部通过** |

最后运行时间：2026-06-29 10:05，`go test ./... -timeout 120s`，耗时约 5.6s。

---

## 调试问题记录

### 问题一：`renderToReadableStream` 静默失败

**根因**：QJS 中 `isNode = false`，Astro 走 `renderToReadableStream` → 调用 `setTimeout`（QJS 无内置），错误被 ReadableStream 吞掉。

**修复**：`Symbol.toStringTag = 'process'` 使 `isNode = true`，走 `renderToAsyncIterable` 路径。

---

### 问题二：`@astrojs/netlify` 二级工厂

**根因**：`createExports` 返回 `{ default: createHandler }`，需再调用工厂。

**修复**：bootstrap 末尾：`var __rawExport = ...; return typeof __rawExport === 'function' ? __rawExport({}) : __rawExport;`

---

### 问题三：TestCartSession 会话丢失

**根因**：Pool `Get()` 在前一请求的 `Put()` 未完成时创建新 runtime，导致 size=1 的 Pool 不保证复用同一 runtime。

**修复**：Pool 有界阻塞语义——预热所有 `size` 个 runtime；`Get()` 阻塞直到有空闲 runtime。

---

### 问题四：TestImageCDNAbsoluteURL → 415

**根因**：`openSource` 对 HTTP URL 返回 `name=""`；`filepath.Ext("")=""` → `ext=""` → `errUnsupportedFormat`。

**修复**：`ext` 从 `rawURL` 路径中提取（去掉 query string 后 `filepath.Ext`）。

---

### 问题五：goja bundle 中 `for await` 语法错误

**根因**：Astro bundle 使用 `for await...of`（ES2018），goja/sobek 不支持该语法，导致解析失败。

**修复**：`ConvertBundleToIIFE` 使用 `Target: api.ES2017`，esbuild 将 `for await` 和 `async function*` 降级为 ES2017 兼容的 Promise 链。

---

### 问题六：goja bundle 中动态 `import()` 语法错误

**根因**：esbuild 无法静态分析 `import(driverName)` 中的变量路径，将其原样输出；goja 不支持 `import()` 表达式（ES2020），导致解析失败。

**修复**：`ConvertBundleToIIFE` 输出后替换所有 `import(` 为 `__gojaImport_(` 并在头部注入 stub：
```js
var __gojaImport_=function(){return Promise.reject(new Error('dynamic import not supported'));};
```
session driver 的加载代码有 try/catch 保护，运行时优雅降级。

---

### 问题七：重建 testdata 与集成测试并发写文件

**根因**：`go test ./...` 并行运行根模块测试和集成测试；根模块的 rebuild 测试写入 `example.pack`，集成测试同时读取，导致 `TestImageCDNFromPack` 随机失败。

**修复**：rebuild 测试默认 Skip，需 `UPDATE_TESTDATA=1` 环境变量显式激活。

---

### 问题八：`ReferenceError: could not load module filename 'entry.mjs'`

**根因**：`example.pack` 中的 `bundle.bc` 由旧版 QJS WASM 二进制编译，新版无法识别字节码格式，bootstrap 的 `import * from 'entry.mjs'` 找不到模块。

**修复**：`UPDATE_TESTDATA=1 go test -run TestRebuildTestdata` 用当前二进制重新编译字节码并写回 pack。
