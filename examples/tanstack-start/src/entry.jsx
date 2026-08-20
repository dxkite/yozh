import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import React from 'react';
import { renderToReadableStream } from 'react-dom/server.browser';

const ITEMS = [
  { id: 1, name: 'Apple MacBook Pro M4', price: 14999 },
  { id: 2, name: 'Sony WH-1000XM5', price: 2699 },
  { id: 3, name: 'Logitech MX Master 3S', price: 699 },
  { id: 4, name: 'Samsung T7 Shield 2TB', price: 549 },
];

function RootLayout() {
  return (
    <html lang="zh">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>TanStack Router SSR Demo</title>
        <style>{`
          body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; color: #333; }
          h1 { color: #e85d04; }
          nav { margin-bottom: 1.5rem; padding: 0.75rem 0; border-bottom: 1px solid #eee; }
          nav a { margin-right: 1.5rem; color: #e85d04; text-decoration: none; font-weight: 500; }
          ul { line-height: 2; }
          .badge { background: #e85d04; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8em; }
        `}</style>
      </head>
      <body>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
        </nav>
        <Outlet />
      </body>
    </html>
  );
}

function HomePage() {
  return (
    <div>
      <h1>TanStack Router SSR Demo</h1>
      <p>
        Powered by <strong>yozh</strong> · goja engine ·{' '}
        <span className="badge">react bootstrap</span>
      </p>
      <h2>商品列表</h2>
      <ul>
        {ITEMS.map((item) => (
          <li key={item.id}>
            {item.name} — ¥{item.price}
          </li>
        ))}
      </ul>
      <hr />
      <p>渲染时间: {new Date().toISOString()}</p>
    </div>
  );
}

function AboutPage() {
  return (
    <div>
      <h1>About</h1>
      <p>
        This demo uses <strong>TanStack Router</strong> for SSR routing inside{' '}
        <strong>yozh</strong> (goja engine).
      </p>
      <p>No Vinxi, no Node.js — pure Go + goja.</p>
    </div>
  );
}

const rootRoute = createRootRoute({ component: RootLayout });
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomePage });
const aboutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/about', component: AboutPage });
const routeTree = rootRoute.addChildren([indexRoute, aboutRoute]);

export default async function handler(req) {
  const url = new URL(req.url);

  if (url.pathname === '/health') {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  if (url.pathname === '/api/products') {
    return new Response(JSON.stringify({ items: ITEMS }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  const history = createMemoryHistory({ initialEntries: [url.pathname + url.search] });
  const router = createRouter({ routeTree, history });
  await router.load();

  const stream = await renderToReadableStream(<RouterProvider router={router} />, {
    onError: (err) => console.error('SSR error:', String(err)),
  });
  // Wait for all Suspense boundaries to resolve before streaming.
  // TanStack Router uses Suspense internally; without allReady the shell
  // contains only placeholder comments and the content never arrives.
  await stream.allReady;

  return new Response(stream, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
