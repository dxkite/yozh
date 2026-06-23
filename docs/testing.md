# 测试文档

## 测试环境

| 项目 | 值 |
|---|---|
| 操作系统 | macOS Darwin 25.4.0 |
| Go 版本 | 1.24+ |
| Node.js | v20+（用于 `astro build`） |
| pnpm | v10+ |
| Astro | 5.x |
| @astrojs/netlify | 6.x |
| 更新日期 | 2026-06-23 |

## 目录结构

```
integration/
├── integration_test.go       # SSR + polyfill + BFF + pack 集成测试（48 个）
├── images_test.go            # 图像 CDN 测试（11 个）
└── testdata/
    └── example/
        ├── bundle.mjs        # 预打包 ESM（从 examples/example 生成）
        └── example.pack      # 预打包 pack（bundle.bc + dist/）

asyncfunc_test.go             # SetGoAsyncFunc 单元测试（3 个，根模块）
```

`bundle.mjs` 和 `example.pack` 已提交到 git，
直接 `go test ./...` 即可运行，无需 `pnpm build`。

## 示例应用

### examples/example — 完整功能验证

覆盖所有 runtime 功能：SSR 页面、动态路由、API 路由、Cookie 会话、
HMAC token、AES-GCM 加密、BFF 聚合、Image 组件（图像 CDN）。

**页面与路由**：
- `src/pages/index.astro` — 商品列表（含 `<Image>` 组件）
- `src/pages/products/[id].astro` — 商品详情
- `src/pages/cart.astro` — 购物车页（AES-GCM Cookie 会话）
- `src/pages/greet/[name].astro` — 动态路由
- `src/pages/api/time.ts` — 服务端时间 JSON
- `src/pages/api/products.ts` — 商品列表 JSON
- `src/pages/api/products/[id].ts` — 单个商品 JSON
- `src/pages/api/cart.ts` — 购物车 GET/POST（Cookie 会话）
- `src/pages/api/token.ts` — HMAC sign/verify
- `src/pages/api/summary.ts` — BFF 聚合（并发 fetch）

**构建**：
```bash
cd examples/example
pnpm install
pnpm build

# 生成集成测试用 bundle 和 pack
cd ../../
astro-runtime build --plain --entry examples/example/.netlify/build/entry.mjs \
  --out integration/testdata/example/bundle.mjs
astro-runtime build --pack --entry examples/example/.netlify/build/entry.mjs \
  --dist examples/example/dist --out integration/testdata/example/example.pack
```

---

## 运行测试

```bash
# 全部测试
go test ./... -timeout 120s

# 指定测试
go test ./integration/ -run TestCryptoSubtleHMAC -v

# 只跑 pack 测试
go test ./integration/ -run TestPack -v

# 只跑图像 CDN 测试
go test ./integration/ -run TestImageCDN -v
```

---

## 测试用例

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

#### TC-03：不存在的商品 → 重定向或 200
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

#### TC-10：Headers Set-Cookie
```go
TestHeadersSetCookie
```
**验证**：`getSetCookie()` 返回数组长度 2，不因 cookie value 中的逗号误切

---

#### TC-11：atob / btoa
```go
TestAtobBtoa
```
**验证**：`btoa('hello world')` 结果正确；round-trip 无损

---

#### TC-12：URL 解析
```go
TestURLParsing
```
**验证**：绝对 URL、相对 URL、IPv6 地址解析正确；`URL.canParse` 可用

---

#### TC-13：crypto.randomUUID
```go
TestCryptoRandomUUID
```
**验证**：36 字符，5 个 `-` 分隔组

---

#### TC-14：crypto.subtle.digest
```go
TestCryptoSubtleDigest
```
**验证**：SHA-256（32 字节）、SHA-512（64 字节）摘要长度正确

---

#### TC-15：crypto.subtle HMAC sign/verify
```go
TestCryptoSubtleHMAC
```
**验证**：generateKey → sign → verify（true）；篡改数据 verify（false）；
importKey raw；exportKey raw；JWK export/import（TC-17 单独测试）

---

#### TC-16：crypto.subtle AES-GCM
```go
TestCryptoSubtleAESGCM
```
**验证**：AES-256-GCM 和 AES-128-GCM encrypt/decrypt round-trip

---

#### TC-17：crypto.subtle JWK export/import
```go
TestCryptoSubtleExportImportJWK
```
**验证**：generateKey(HMAC) → exportKey('jwk') → importKey('jwk') → sign/verify 一致

---

#### TC-18：crypto.getRandomValues
```go
TestGetRandomValues
```
**验证**：16 字节非全零

---

#### TC-19：Polyfills 初始化 smoke test
```go
TestPolyfillsQJSInit
```
**验证**：最小 bundle 创建 Pool（size=2）不报错，即 polyfills 正确加载

---

### 回归 / 安全测试

#### TC-20：Pool 大小校验
```go
TestPoolSizeValidation
```
**验证**：size=-1 / 1001 返回错误；size=0/1/1000 成功

---

#### TC-21：空 body POST
```go
TestEmptyBodyPOST
```
**验证**：POST 空 body → JS `typeof body === "string"`（不为 null）

---

#### TC-22：URL.search setter 同步 searchParams
```go
TestURLSearchParamsSetter
```
**验证**：`url.search = '?a=1'` 后 `searchParams.get('a') === '1'`；
再赋值后旧参数消失；`url.search = ''` 后 searchParams 清空

---

#### TC-23：AES-CBC round-trip
```go
TestAESCBC
```
**验证**：AES-256-CBC encrypt/decrypt round-trip

---

#### TC-24：AES-CBC IV 长度校验
```go
TestAESCBCWrongIV
```
**验证**：IV 不是 16 字节时 encrypt 抛出错误

---

#### TC-25：AES-GCM IV 长度校验
```go
TestAESGCMWrongIV
```
**验证**：IV 不是 12 字节时 encrypt 抛出错误

---

#### TC-26：AES-CBC 无效密文（PKCS7 padding 验证）
```go
TestAESCBCTamperedCiphertext
```
**验证**：解密全零 32 字节 → error；长度非 16 倍数 → error

---

#### TC-27：TextEncoder.encodeInto 部分写入
```go
TestTextEncoderInto
```
**验证**：full fit（`written=5, read=5`）；multi-byte 截断不越界；ASCII+多字节混合部分写

---

### BFF 集成测试（minPool）

#### TC-28：单次上游 fetch
```go
TestBFFUpstreamFetch
```
**验证**：`fetch(upstreamURL)` → `res.json()` 返回正确数据

---

#### TC-29：多服务聚合（Promise.allSettled）
```go
TestBFFAggregation
```
**验证**：并发调用两个服务，合并结果 `{ name, stock }` 正确

---

#### TC-30：优雅降级（上游 503）
```go
TestBFFGracefulDegradation
```
**验证**：`Promise.allSettled` 不崩溃，成功服务返回数据，失败服务返回 null

---

#### TC-31：并发 fetch 耗时验证
```go
TestBFFConcurrentFetch
```
**验证**：3×80ms 并发请求总耗时 < 240ms（非顺序执行）

---

#### TC-32：BFF 会话中间件（HMAC token）
```go
TestBFFSessionMiddleware
```
**验证**：`btoa(userId)` → HMAC-SHA256 sign → token → verify → decode userId 正确

---

#### TC-33：购物车 Cookie AES-GCM round-trip
```go
TestBFFCartCookieRoundTrip
```
**验证**：`generateKey(AES-GCM)` → encrypt(items) → base64(iv+ct) → decrypt → 相同 items

---

#### TC-34：上游 HMAC 签名请求（端到端）
```go
TestBFFUpstreamHMACAuth
```
**验证**：JS 用 `crypto.subtle.sign` 计算签名，Go HTTP mock 用 `crypto/hmac` 验证，通过返回 200

---

### Pack Runtime 冒烟测试（packRT，example.pack）

#### TC-35：Pack 首页
```go
TestPackHomePage
```
**验证**：`packRT.ServeHTTP` GET `/` → 200，HTML 含 `Online Store`

---

#### TC-36：Pack 商品列表 API
```go
TestPackProductsAPI
```
**验证**：GET `/api/products` → 200，JSON 数组非空

---

#### TC-37：Pack 商品详情
```go
TestPackSingleProduct
```
**验证**：GET `/products/1` → 200，HTML 含 `Cereal`

---

### 图像 CDN 测试（images_test.go）

distFS 指向 `examples/example/dist`，含 `images/test.png`（public/）和 `_astro/test.*.png`（`<Image>` 组件生成）。

#### TC-38：缺少 url 参数
```go
TestImageCDNMissingURL
```
**验证**：GET `/.netlify/images?w=32` → 400

---

#### TC-39：图片不存在
```go
TestImageCDNNotFound
```
**验证**：GET `/.netlify/images?url=/images/nonexistent.png` → 404

---

#### TC-40：public 图片直出
```go
TestImageCDNPublicServe
```
**验证**：GET `/.netlify/images?url=/images/test.png` → 200，`Content-Type: image/*`

---

#### TC-41：public 图片缩宽
```go
TestImageCDNPublicResizeWidth
```
**验证**：`&w=16` → 解码图片宽度 === 16

---

#### TC-42：public 图片 fill 缩放
```go
TestImageCDNPublicResizeBoth
```
**验证**：`&w=20&h=10&fit=fill` → 解码图片 20×10

---

#### TC-43：PNG 格式输出
```go
TestImageCDNPublicFormatPNG
```
**验证**：`&fm=png` → `Content-Type: image/png`

---

#### TC-44：JPEG 格式输出
```go
TestImageCDNPublicFormatJPEG
```
**验证**：`&fm=jpg` → `Content-Type: image/jpeg`

---

#### TC-45：Astro `<Image>` 组件生成的哈希图片
```go
TestImageCDNAstroAsset
```
**验证**：动态查找 `_astro/test.*.png`，`/.netlify/images?url=/_astro/test.*.png` → 200，图片宽度 > 0

---

#### TC-46：Astro 资产 cover 缩放
```go
TestImageCDNAstroAssetResize
```
**验证**：`&w=16&h=16&fit=cover` → 解码图片 16×16

---

#### TC-47：Pack 内嵌 distFS 图片
```go
TestImageCDNFromPack
```
**验证**：`HandleImageCDN(packRT.DistFS(), ...)` GET `?url=/images/test.png&w=8&fm=png` → 200，`Content-Type: image/png`

---

#### TC-48：绝对 URL 上游图片
```go
TestImageCDNAbsoluteURL
```
**验证**：上游 HTTP mock server 提供 PNG，`url=http://...` → 200，解码后 8×8（contain 缩放）

---

### 并发异步函数测试（asyncfunc_test.go，根模块）

#### TC-49：单次 async 调用
```go
TestSetAsyncFuncSingle
```
**验证**：`SetGoAsyncFunc` 注册的函数被 `await` 调用，goroutine 正确 resolve Promise

---

#### TC-50：多次并发 async 调用
```go
TestSetAsyncFuncConcurrent
```
**验证**：10 次并发 `Promise.allSettled`，所有调用均正确 resolve，无 race condition

---

#### TC-51：并发耗时验证
```go
TestSetAsyncFuncTiming
```
**验证**：3 个各 50ms 的 async 调用，总耗时 ≤ 120ms（并发执行）

---

## 测试总结

| 类别 | 数量 | 状态 |
|---|---|---|
| SSR 端到端（商品列表、动态路由、购物车会话） | 8 | ✅ |
| Polyfill 单元（TextEncoder、Headers、URL、crypto） | 11 | ✅ |
| 回归/安全（Pool 校验、空 body、URL setter、AES IV、padding） | 8 | ✅ |
| BFF 集成（fetch、聚合、降级、并发、HMAC、AES-GCM、签名认证） | 7 | ✅ |
| Pack Runtime 冒烟（NewRuntime from pack，ServeHTTP） | 3 | ✅ |
| 图像 CDN（public/Astro asset/pack FS/绝对 URL/格式/缩放） | 11 | ✅ |
| 并发 async（SetGoAsyncFunc 单元） | 3 | ✅ |
| **合计** | **51** | **全部通过** |

---

## 调试问题记录

### 问题一：`renderToReadableStream` 静默失败

**根因**：QJS 中 `isNode = false`，Astro 走 `renderToReadableStream` → 调用 `setTimeout`（QJS 无内置），错误被 ReadableStream 吞掉。

**修复**：`Symbol.toStringTag = 'process'` 使 `isNode = true`，走 `renderToAsyncIterable` 路径。

---

### 问题二：`@astrojs/netlify` 二级工厂

**根因**：`createExports` 返回 `{ default: createHandler }`，需再调用工厂。

**修复**：CJS wrapper 末尾：`var __rawExport = ...; return typeof __rawExport === 'function' ? __rawExport({}) : __rawExport;`

---

### 问题三：TestCartSession 会话丢失

**根因**：Pool `Get()` 在前一请求的 `Put()` 未完成时创建新 runtime（worker goroutine 仍在运行），导致 size=1 的 Pool 不保证复用同一 runtime。

**修复**：Pool 有界阻塞语义——预热所有 `size` 个 runtime；`Get()` 阻塞直到有空闲 runtime。

---

### 问题四：TestImageCDNAbsoluteURL → 415

**根因**：`openSource` 对 HTTP URL 返回 `name=""`；`filepath.Ext("")=""` → `ext=""` → `errUnsupportedFormat`。

**修复**：`ext` 从 `rawURL` 路径中提取（去掉 query string 后 `filepath.Ext`）。

---

### 问题五：AES-CBC tamper 测试断言失败

**根因**：测试 JS 中 `'error:' + String(e.message).indexOf(...)` 因运算符优先级产生非预期字符串，Go `.(string)` 断言失败。

**修复**：改用确定性测试——全零字节数组（必然填充错误）和非块大小倍数（必然块大小错误），catch 直接 `return 'error'`。

---

### 问题六：`sync/atomic` 未使用

**根因**：移除 `pooledRuntime.responseDoneNs atomic.Int64` 后未删除 import。

**修复**：删除 `"sync/atomic"` import。

---

### 问题七：`ReferenceError: could not load module filename 'renderers.mjs'`

**根因**：直接使用 `entry.mjs` 失败，因 Netlify adapter 输出多文件（`entry.mjs` 依赖 `renderers.mjs` 等）。

**修复**：使用 `astro-runtime build --plain --entry .netlify/build/entry.mjs` 生成自包含 bundle，esbuild 将所有依赖打包进单文件。
