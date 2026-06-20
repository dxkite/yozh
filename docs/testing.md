# 测试文档

## 测试环境

| 项目 | 值 |
|---|---|
| 操作系统 | Windows 11 Pro 10.0.22635 |
| Go 版本 | 1.22+ |
| Node.js | v20+ (用于 `astro build`) |
| pnpm | v10.26.0 |
| Astro | 5.18.2 |
| @astrojs/netlify | 6.6.5 |
| 测试日期 | 2026-06-20 |

## 测试应用

### testapp（基础功能验证）

位于 `testapp/`，用于基础功能验证。

**页面**：
- `src/pages/index.astro` — 首页，显示 URL/Method/UA/服务端时间
- `src/pages/greet/[name].astro` — 动态路由页
- `src/pages/api/time.ts` — JSON API endpoint

**构建**：
```bash
cd testapp
pnpm install --ignore-workspace
pnpm build   # Windows 会报 EPERM symlink 错误，可忽略
# .netlify/build/entry.mjs 已成功生成
```

### testapp-ssr（examples/ssr 内容测试）

位于 `testapp-ssr/`，基于 `D:\projects\mixed\astro\examples\ssr` 内容，
将 `@astrojs/node` 替换为 `@astrojs/netlify`，Svelte 组件替换为原生 Astro 组件。

**页面**：
- `src/pages/index.astro` — 商品列表（读取 models/db）
- `src/pages/products/[id].astro` — 商品详情动态路由（含表单）
- `src/pages/cart.astro` — 购物车页（读取 session）
- `src/pages/api/products.ts` — 商品列表 API
- `src/pages/api/products/[id].ts` — 单个商品 API
- `src/pages/api/cart.ts` — 购物车 GET/POST API（Cookie 会话）

**构建**：
```bash
cd testapp-ssr
pnpm install --ignore-workspace
pnpm build   # Windows EPERM 可忽略
```

---

## 启动服务器

```bash
# testapp-ssr
./netlify-runtime.exe \
  --ssr testapp-ssr/.netlify/build/entry.mjs \
  --dist testapp-ssr/dist \
  --port 8888
```

启动后日志：
```
2026/06/20 17:56:21 Bundling ...entry.mjs ...
2026/06/20 17:56:21 Bundle ready (1063 KB)
2026/06/20 17:56:21 Initializing QJS pool (8 runtimes) ...
2026/06/20 17:56:22 QJS pool ready
2026/06/20 17:56:22 Netlify SSR mock running at http://localhost:8888
```

---

## 测试用例

### TC-01：商品列表页

```bash
curl -s http://localhost:8888/
```

**预期**：HTTP 200，HTML 包含 `<h1>Online Store</h1>` 和商品链接

**实际**：
```html
<!DOCTYPE html><html lang="en">
<head><meta charset="UTF-8"><title>Online Store</title></head>
<body>
  <h1>Online Store</h1>
  <ul>
    <li><a href="/products/1">Cereal</a> — $3.99</li>
    <li><a href="/products/2">Yogurt</a> — $3.97</li>
    <li><a href="/products/3">Rolled Oats</a> — $2.89</li>
    <li><a href="/products/4">Muffins</a> — $4.39</li>
  </ul>
  <p><a href="/cart">View Cart</a></p>
</body>
</html>
```

**结果**：✅ PASS

---

### TC-02：商品详情动态路由

```bash
curl -s http://localhost:8888/products/1
```

**预期**：HTTP 200，显示 Cereal 商品信息，含 Add to Cart 表单

**实际**：
```html
<!DOCTYPE html>...
<h1>Cereal</h1>
<p>Price: $3.99</p>
<form method="POST" action="/cart">
  <input type="hidden" name="id" value="1">
  <input type="hidden" name="name" value="Cereal">
  <button type="submit">Add to Cart</button>
</form>
```

**结果**：✅ PASS

---

### TC-03：不存在的商品 → 重定向

```bash
curl -s -L http://localhost:8888/products/99
```

**预期**：重定向到 `/`，最终返回商品列表页

**实际**：返回 200 + 商品列表页 HTML（`Astro.redirect('/')` 正常工作）

**结果**：✅ PASS

---

### TC-04：商品列表 API

```bash
curl -s http://localhost:8888/api/products
```

**预期**：HTTP 200，JSON 数组，含 4 个商品

**实际**：
```json
[
  {"id":1,"name":"Cereal","price":3.99,"image":"/images/products/cereal.jpg"},
  {"id":2,"name":"Yogurt","price":3.97,"image":"/images/products/yogurt.jpg"},
  {"id":3,"name":"Rolled Oats","price":2.89,"image":"/images/products/oats.jpg"},
  {"id":4,"name":"Muffins","price":4.39,"image":"/images/products/muffins.jpg"}
]
```

**结果**：✅ PASS

---

### TC-05：单个商品 API（动态路由）

```bash
curl -s http://localhost:8888/api/products/2
```

**预期**：HTTP 200，JSON 对象，id=2 Yogurt

**实际**：
```json
{"id":2,"name":"Yogurt","price":3.97,"image":"/images/products/yogurt.jpg"}
```

**结果**：✅ PASS

---

### TC-06：购物车页（空 session）

```bash
curl -s http://localhost:8888/cart
```

**预期**：HTTP 200，显示"Your cart is empty."

**实际**：
```html
<h1>Your Cart</h1>
<p>Your cart is empty.</p>
```

**结果**：✅ PASS

---

### TC-07：购物车 GET API（空 session）

```bash
curl -s http://localhost:8888/api/cart
```

**预期**：HTTP 200，`{"items":[]}`

**实际**：`{"items":[]}`

**结果**：✅ PASS

---

### TC-08：添加到购物车（Cookie 会话）

```bash
curl -s -X POST http://localhost:8888/api/cart \
  -H "Content-Type: application/json" \
  -H "Cookie: user-id=testuser123" \
  -d '{"id":1,"name":"Cereal"}'
```

**预期**：HTTP 200，`{"ok":true}`

**实际**：`{"ok":true}`

**结果**：✅ PASS

---

### TC-09：购物车 GET API（有数据）

```bash
curl -s http://localhost:8888/api/cart \
  -H "Cookie: user-id=testuser123"
```

**前提**：先执行 TC-08

**预期**：返回包含 Cereal x1 的 JSON

**实际**：
```json
{"items":[{"id":1,"name":"Cereal","count":1}]}
```

**结果**：✅ PASS

---

### TC-10：购物车页（有数据）

```bash
curl -s http://localhost:8888/cart \
  -H "Cookie: user-id=testuser123"
```

**前提**：先执行 TC-08

**预期**：HTML 页面显示 Cereal x1

**实际**：
```html
<h1>Your Cart</h1>
<ul><li>Cereal x1</li></ul>
```

**结果**：✅ PASS

---

### TC-11：基础测试（testapp）

```bash
# 启动 testapp
./netlify-runtime.exe --ssr testapp/.netlify/build/entry.mjs --dist testapp/dist

curl -s http://localhost:8888/
curl -s http://localhost:8888/greet/Claude
curl -s http://localhost:8888/api/time
```

| 路由 | 预期 | 结果 |
|---|---|---|
| `GET /` | 200 HTML，含 URL/Method/Server time | ✅ PASS |
| `GET /greet/Claude` | 200 HTML，"Hello, Claude!" | ✅ PASS |
| `GET /api/time` | 200 JSON `{"time":"...","url":"..."}` | ✅ PASS |

---

## 调试问题记录

### 问题一：bundle eval 失败 — `process` 未 external

**错误**：`bundle eval: ...`（esbuild 未将裸 `process` externalize）

**根因**：esbuild External 只有 `node:*`，不含裸 `process`

**修复**：`bundle.go` External 列表加入 `"process"`

---

### 问题二：`Blob is not defined`

**错误**：`polyfill file-polyfill.js: ReferenceError: Blob is not defined`

**根因**：`class File extends Blob` 在 QJS 中 Blob 未定义

**修复**：`filePolyfill` 先定义 `Blob` 再定义 `File`

---

### 问题三：`TextEncoder is not defined`

**错误**：bundle eval 阶段，Astro 的 `encryption.js` 在模块初始化时调用 `new TextEncoder()`

**修复**：`webAPIPolyfill` 最前面加 `TextEncoder` / `TextDecoder` 实现

---

### 问题四：`URL is not defined`

**错误**：bundle eval 阶段 `createDefaultRoutes` 调用 `new URL(...)`

**修复**：`envAPIStub` 中加入完整 `URL` + `URLSearchParams` 实现

---

### 问题五：SSR 返回 500，`renderToReadableStream` 静默失败

**错误**：每次请求均 500，日志：
```
[ERROR] [router] Error while trying to render the route /
    at renderToReadableStream (ssr-bundle.js:21559:14)
```

**根因分析**：
1. Astro 通过 `isNode = typeof process !== "undefined" && Object.prototype.toString.call(process) === "[object process]"` 判断是否在 Node.js 运行。
2. QJS 中 `process` 为普通对象，`toString.call(process)` 返回 `[object Object]`，故 `isNode = false`。
3. `isNode = false` 时 Astro 使用 `renderToReadableStream`，该路径在错误时调用 `setTimeout(() => controller.error(e), 0)`。
4. QJS 无内置 `setTimeout`，调用抛出 `ReferenceError`，错误被 ReadableStream 内部吞掉，路由器只看到渲染失败。

**修复**：
```javascript
Object.defineProperty(globalThis.process, Symbol.toStringTag, { value: 'process' });
```
使 `isNode = true`，Astro 改用 `renderToAsyncIterable`（异步生成器），不依赖 `setTimeout` 和 `ReadableStream`。

同时补充：
- `Response.text()` 增加 `AsyncIterable` 消费路径（`for await...of`）
- `envAPIStub` 加入 `setTimeout`/`queueMicrotask` polyfill（防御性）
- `consoleDef` 修复 Error 对象格式化（`JSON.stringify(error)` 返回 `{}`）

---

### 问题六：`@astrojs/netlify` 二级工厂

**错误**：`typeof response === 'function'`（response 是函数而非 Response 对象）

**根因**：`createExports` 返回 `{ default: createHandler }`，`createHandler` 是工厂函数，
不是 handler 本身。我们之前直接用了 `createHandler` 当 handler。

**修复**：CJS wrapper 末尾改为：
```javascript
var __rawExport = module.exports.default || module.exports;
return typeof __rawExport === 'function' ? __rawExport({}) : __rawExport;
```

---

## 测试总结

| 测试用例 | 类别 | 结果 |
|---|---|---|
| TC-01 商品列表页 | SSR 页面 | ✅ |
| TC-02 商品详情 | 动态路由 SSR | ✅ |
| TC-03 不存在商品 → 重定向 | Astro.redirect | ✅ |
| TC-04 商品列表 API | API endpoint | ✅ |
| TC-05 单个商品 API | 动态 API endpoint | ✅ |
| TC-06 购物车页（空） | SSR + 模块状态 | ✅ |
| TC-07 购物车 API GET（空） | API endpoint | ✅ |
| TC-08 添加购物车 POST | POST + Cookie | ✅ |
| TC-09 购物车 API GET（有数据） | Cookie 会话持久化 | ✅ |
| TC-10 购物车页（有数据） | Cookie + SSR | ✅ |
| TC-11 基础路由（testapp） | 基础 SSR + 动态路由 + JSON API | ✅ |

**所有 11 个用例全部通过。**
