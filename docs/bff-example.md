# BFF 示例：用 Astro API Routes 实现 Backend for Frontend

本文以一个商品详情页为例，演示如何在 Astro SSR 项目中用 API Routes 承担 BFF 职责：
聚合多个上游服务、签名验证、会话鉴权，最终渲染出完整页面。

## 目录结构

```
src/
├── middleware.ts                  # 全局鉴权 / 会话注入
├── pages/
│   ├── products/
│   │   └── [id].astro            # 商品详情页（消费 BFF API）
│   └── api/
│       ├── products/
│       │   └── [id].ts           # BFF：聚合商品数据
│       └── cart.ts               # BFF：购物车操作
└── lib/
    └── upstream.ts               # 上游服务调用工具
```

运行时：单个 Go 二进制（astro-runtime），上游服务为独立 HTTP 服务。

---

## 1. 环境变量（上游服务地址）

在 `astro.config.mjs` 或启动时通过 `--env` 注入：

```bash
CATALOG_URL=http://catalog:3001
INVENTORY_URL=http://inventory:3002
REVIEW_URL=http://review:3003
HMAC_SECRET=your-signing-secret
```

Astro API Routes 通过 `import.meta.env` 或 `process.env` 读取（两者在 astro-runtime 中均可用）。

---

## 2. 上游服务调用工具（src/lib/upstream.ts）

封装带 HMAC 签名的请求，确保 BFF → 上游服务的调用可验证身份。

```typescript
// src/lib/upstream.ts

const SECRET = import.meta.env.HMAC_SECRET ?? process.env.HMAC_SECRET ?? '';

/**
 * 对请求体做 HMAC-SHA256 签名，结果附在 X-Signature 头。
 * 上游服务验证此签名，拒绝非法调用。
 */
async function sign(body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

/**
 * 调用上游服务，自动附加签名头。
 * 超时 / 非 2xx 均抛出错误，由调用方决定如何降级。
 */
export async function upstreamGet<T>(url: string): Promise<T> {
  const ts = Date.now().toString();
  const sig = await sign(ts);
  const res = await fetch(url, {
    headers: {
      'X-Timestamp': ts,
      'X-Signature': sig,
    },
  });
  if (!res.ok) throw new Error(`upstream ${url} → ${res.status}`);
  return res.json() as Promise<T>;
}
```

> **astro-runtime 说明**：`crypto.subtle` 由 Go 实现（`crypto_subtle.go`），`fetch()` 通过
> `__go_fetchRaw` 调用 Go 的 `http.Client`（30 秒超时）。两者均对 TypeScript 透明。

---

## 3. BFF API Route：聚合商品数据

```typescript
// src/pages/api/products/[id].ts
import type { APIRoute } from 'astro';
import { upstreamGet } from '../../../lib/upstream';

interface Product   { id: number; name: string; price: number; image: string }
interface Inventory { stock: number; warehouse: string }
interface Review    { rating: number; count: number; summary: string }

export const GET: APIRoute = async ({ params, locals }) => {
  // locals.userId 由 middleware 注入（见第 5 节）
  if (!locals.userId) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const id = params.id;
  const base = {
    catalog:   import.meta.env.CATALOG_URL   ?? 'http://localhost:3001',
    inventory: import.meta.env.INVENTORY_URL ?? 'http://localhost:3002',
    review:    import.meta.env.REVIEW_URL    ?? 'http://localhost:3003',
  };

  // 并发调用三个上游服务，任一失败不阻断其他
  const [product, inventory, reviews] = await Promise.allSettled([
    upstreamGet<Product>(`${base.catalog}/products/${id}`),
    upstreamGet<Inventory>(`${base.inventory}/stock/${id}`),
    upstreamGet<Review>(`${base.review}/reviews/${id}`),
  ]);

  if (product.status === 'rejected') {
    return Response.json({ error: 'product not found' }, { status: 404 });
  }

  return Response.json({
    product:   product.value,
    inventory: inventory.status === 'fulfilled' ? inventory.value : null,
    reviews:   reviews.status   === 'fulfilled' ? reviews.value   : null,
  });
};
```

`Promise.allSettled` 保证：即使库存服务或评论服务挂掉，商品信息仍能正常返回。

---

## 4. 商品详情页（消费 BFF API）

```astro
---
// src/pages/products/[id].astro
import type { GetServerSideProps } from 'astro';

const { id } = Astro.params;

// 调用本页面自己的 BFF API（同进程内 fetch，走 Go HTTP client loopback）
const res = await fetch(new URL(`/api/products/${id}`, Astro.url));

if (res.status === 401) return Astro.redirect('/login');
if (res.status === 404) return Astro.redirect('/');

const { product, inventory, reviews } = await res.json();
---

<html lang="zh">
<head><title>{product.name}</title></head>
<body>
  <h1>{product.name}</h1>
  <p>价格：¥{product.price}</p>

  {inventory
    ? <p>库存：{inventory.stock > 0 ? `${inventory.stock} 件` : '暂时缺货'}</p>
    : <p>库存信息暂不可用</p>
  }

  {reviews
    ? <p>评分：{reviews.rating} / 5（{reviews.count} 条评价）</p>
    : null
  }

  <form method="POST" action="/api/cart">
    <input type="hidden" name="id"    value={product.id} />
    <input type="hidden" name="name"  value={product.name} />
    <input type="hidden" name="price" value={product.price} />
    <button type="submit">加入购物车</button>
  </form>
</body>
</html>
```

---

## 5. 中间件：会话鉴权（src/middleware.ts）

```typescript
// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';

const PUBLIC_PATHS = ['/', '/login', /^\/api\/auth/];

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, cookies, locals, redirect } = context;
  const path = new URL(request.url).pathname;

  // 公开路径跳过鉴权
  const isPublic = PUBLIC_PATHS.some(p =>
    typeof p === 'string' ? path === p : p.test(path),
  );
  if (isPublic) return next();

  const token = cookies.get('session')?.value;
  if (!token) {
    // API 请求返回 401，页面请求重定向
    if (path.startsWith('/api/')) {
      return Response.json({ error: 'unauthorized' }, { status: 401 });
    }
    return redirect('/login');
  }

  // 验证 session token（HMAC 签名）
  const userId = await verifySessionToken(token);
  if (!userId) return redirect('/login');

  // 将 userId 注入 locals，供所有 API Routes 和页面使用
  locals.userId = userId;
  return next();
});

async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const [payload, sig] = token.split('.');
    const secret = import.meta.env.HMAC_SECRET ?? process.env.HMAC_SECRET ?? '';
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const ok = await crypto.subtle.verify(
      'HMAC',
      key,
      Uint8Array.from(atob(sig), c => c.charCodeAt(0)),
      new TextEncoder().encode(payload),
    );
    return ok ? atob(payload) : null;  // payload 为 base64(userId)
  } catch {
    return null;
  }
}
```

---

## 6. 购物车 API（带 AES-GCM 加密存储）

```typescript
// src/pages/api/cart.ts
import type { APIRoute } from 'astro';

// 购物车数据加密存储在 cookie 中，不依赖外部 session 服务
const CART_KEY_RAW = import.meta.env.CART_KEY ?? process.env.CART_KEY ?? '';

async function getCartKey() {
  return crypto.subtle.importKey(
    'raw',
    Uint8Array.from(atob(CART_KEY_RAW), c => c.charCodeAt(0)),
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function encryptCart(items: unknown[]): Promise<string> {
  const key  = await getCartKey();
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(items));
  const enc  = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  // 格式：base64(iv).base64(ciphertext)
  const b64  = (buf: Uint8Array) => btoa(String.fromCharCode(...buf));
  return `${b64(iv)}.${b64(new Uint8Array(enc))}`;
}

async function decryptCart(token: string): Promise<unknown[]> {
  try {
    const [ivB64, ctB64] = token.split('.');
    const key    = await getCartKey();
    const iv     = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
    const ct     = Uint8Array.from(atob(ctB64), c => c.charCodeAt(0));
    const plain  = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    return JSON.parse(new TextDecoder().decode(plain));
  } catch {
    return [];
  }
}

export const GET: APIRoute = async ({ cookies }) => {
  const token = cookies.get('cart')?.value ?? '';
  const items = await decryptCart(token);
  return Response.json({ items });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const body  = await request.json();
  const token = cookies.get('cart')?.value ?? '';
  const items = await decryptCart(token);

  const existing = items.find((i: any) => i.id === body.id);
  if (existing) {
    (existing as any).count++;
  } else {
    items.push({ id: body.id, name: body.name, price: body.price, count: 1 });
  }

  const newToken = await encryptCart(items);
  cookies.set('cart', newToken, { httpOnly: true, path: '/', sameSite: 'lax' });
  return Response.json({ ok: true });
};
```

---

## 数据流总览

```
浏览器 GET /products/1
    │
    ▼
server.go — 静态文件未命中
    │
    ▼
handler.go → QJS/Astro middleware.ts（验证 session cookie）
    │ locals.userId = "user123"
    ▼
pages/products/[id].astro
    │ fetch('/api/products/1')          ← 同进程 loopback fetch
    ▼
pages/api/products/[id].ts
    │ Promise.allSettled([
    │   fetch(CATALOG_URL/products/1),  ← 通过 Go fetchClient
    │   fetch(INVENTORY_URL/stock/1),   ← 通过 Go fetchClient
    │   fetch(REVIEW_URL/reviews/1),    ← 通过 Go fetchClient
    │ ])
    │ → 聚合 JSON
    ▼
pages/products/[id].astro 渲染 HTML
    │
    ▼
Go HTTP Response → 浏览器
```

---

## 关键约束

| 约束 | 说明 |
|---|---|
| **无原生 Node 模块** | `fs`、`child_process` 不可用；文件操作需通过上游 HTTP 服务 |
| **fetch 超时 30 秒** | 上游服务应有独立超时控制，避免单服务超时阻塞全页 |
| **无共享内存** | 多个 QJS runtime 实例不共享内存，跨请求的共享状态（计数、缓存）需外部存储（Redis、DB） |
| **CPU 密集任务** | 大量 JSON 处理、加解密建议移到 Go 层；QJS 单线程，长时间占用会阻塞同一 runtime 的其他请求 |
| **fetch 并发** | `Promise.allSettled([fetch(a), fetch(b)])` 支持真正并发，3×80ms ≈ 83ms（见 `TestBFFConcurrentFetch`） |

---

## fetch 并发实现

### 原理

astro-runtime 使用 [wazero](https://wazero.io/) 将 QuickJS 编译为 WASM 运行。wazero 的 WASM 实例**不是线程安全的** — 所有对 WASM 实例的调用必须来自同一 goroutine。

`fetch()` 通过 `SetGoAsyncFunc` 实现并发，核心机制为 `pendingCallbacks chan func()`：

```
QJS goroutine（持有 WASM 实例）            Go 工作 goroutine（不接触 WASM）
─────────────────────────────            ──────────────────────────────
fetch(url) 被 JS 调用
  → 提取参数字符串
  → 创建 JS Promise
  → 启动 goroutine ──────────────────►  执行 HTTP 请求（fetchClient.Do）
  → 立即返回 undefined                   完成后将 resolve/reject 写入
                                         pendingCallbacks channel

JS: Promise.allSettled([...]) 挂起
  → 调用 Await() 轮询循环：
    drain channel → 在 QJS goroutine 上调用 resolve/reject（WASM 安全）
    运行 QJS microtasks（QJS_ExecutePendingJob）
    检查 Promise 是否已 settled
```

所有 WASM 调用始终在 QJS goroutine 上发生，满足 wazero 单线程要求；HTTP 请求在独立 goroutine 中并发执行。

### 并发效果

```typescript
// ✅ 真正并发：三个请求同时发出，总耗时 ≈ 最慢单个请求的时间
const [product, inventory, reviews] = await Promise.allSettled([
  upstreamGet<Product>(`${base.catalog}/products/${id}`),
  upstreamGet<Inventory>(`${base.inventory}/stock/${id}`),
  upstreamGet<Review>(`${base.review}/reviews/${id}`),
]);
```

实测（`TestBFFConcurrentFetch`）：3 个各 80ms 的请求，总耗时 ≈ 83ms，而非 240ms。
