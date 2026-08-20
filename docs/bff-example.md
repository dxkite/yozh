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

运行时：单个 Go 二进制（yozh），上游服务为独立 HTTP 服务。

---

## 1. 环境变量（上游服务地址）

在 `astro.config.mjs` 或启动时通过 `--env` 注入：

```bash
CATALOG_URL=http://catalog:3001
INVENTORY_URL=http://inventory:3002
REVIEW_URL=http://review:3003
HMAC_SECRET=your-signing-secret
```

Astro API Routes 通过 `import.meta.env` 或 `process.env` 读取（两者在 yozh 中均可用）。

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

> **yozh 说明**：`crypto.subtle` 由 Go 实现（`crypto_subtle.go`），`fetch()` 通过
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
handler.go → goja/Astro middleware.ts（验证 session cookie）
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
| **无共享内存** | 多个 goja runtime 实例不共享内存，跨请求的共享状态（计数、缓存）需外部存储（Redis、DB） |
| **CPU 密集任务** | 大量 JSON 处理、加解密建议移到 Go 层；goja runtime 单线程执行，长时间占用会阻塞同一 runtime 的其他请求 |
| **fetch 并发** | `Promise.allSettled([fetch(a), fetch(b)])` 是多上游调用做失败隔离的正确写法，且真正并发发起（见下文） |

---

## Pool 的 runtime 独占模型

### 原理

yozh 现在唯一的 JS 引擎是 goja（`github.com/grafana/sobek`），纯 Go 实现，没有 WASM 边界。
但和大多数 JS 引擎一样，一个 `sobek.Runtime` **不是并发安全的** — 不能有两个 goroutine 同时对同一个
`Runtime` 调用 `RunScript` / 触发 JS 执行，否则会破坏其内部状态。

`Pool` 通过"每个请求独占一个 runtime"解决这个约束：

- `Pool` 预热并持有 `size` 个 `sobek.Runtime`（`pool chan *pooledRuntime`）。
- 请求进来时 `Pool.Get()` 从 channel 取出一个空闲 runtime；`Get()` 会阻塞直到有 runtime 可用（有界阻塞语义，见 `pool.go`）。
- 该 runtime 的 JS 执行（`ctx.Eval(...)`）被提交给一个 worker goroutine（`Pool.submit`），由这一个 goroutine
  独占持有该 runtime，直到本次请求的整个 JS 调用（包括其中所有 `await`）返回。
- 请求结束后 `Pool.Put()` 把 runtime 放回 channel，供下一个请求复用。

这样，任意时刻每个 `sobek.Runtime` 至多被一个 goroutine 访问，天然满足"一个 JS runtime、一次只能一个
goroutine"的约束，且不需要任何 WASM/wazero 相关的线程隔离机制。

### fetch() 的执行模型

sobek 本身没有内置事件循环，`SetGoAsyncFunc`（用于注册 `__go_fetchRaw`）自建了一个最小事件循环来
支持真正的并发：调用宿主函数时不会同步阻塞——`__go_fetchRaw` 立即返回一个 pending 状态的 Promise，
真正的网络请求（`fetchClient.Do(req)`）放到独立 goroutine 里执行；该 goroutine 完成后把
"resolve/reject 这个 Promise"作为一个待执行任务投递回持有该 `sobek.Runtime` 的 goroutine（通过
`gojaContext.pending` channel），由后者在自己的 `Eval` 调用里排空执行（`pumpUntilSettled`），因为
sobek 明确要求 Promise 的 resolve/reject 只能在 Runtime 的"所有权 goroutine"上调用。

```typescript
// Promise.allSettled 是失败隔离的正确写法：任一上游失败不影响其它上游的结果；
// 三次 fetch 会各自在独立 goroutine 里真正并发发起
const [product, inventory, reviews] = await Promise.allSettled([
  upstreamGet<Product>(`${base.catalog}/products/${id}`),
  upstreamGet<Inventory>(`${base.inventory}/stock/${id}`),
  upstreamGet<Review>(`${base.review}/reviews/${id}`),
]);
```

同一请求内的多次 fetch 总耗时约等于最慢的那一个上游请求，而不是各请求耗时之和。
