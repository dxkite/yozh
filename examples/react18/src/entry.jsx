import { renderToReadableStream } from 'react-dom/server.browser';

const ITEMS = [
  { name: 'Apple MacBook Pro M4', price: 14999 },
  { name: 'Sony WH-1000XM5', price: 2699 },
  { name: 'Logitech MX Master 3S', price: 699 },
  { name: 'Samsung T7 Shield 2TB', price: 549 },
];

function ProductList({ items }) {
  return (
    <ul>
      {items.map((item, i) => (
        <li key={i}>{item.name} — ¥{item.price}</li>
      ))}
    </ul>
  );
}

function Page() {
  return (
    <html lang="zh">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>React 18 SSR Demo</title>
        <style>{`
          body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; color: #333; }
          h1 { color: #0070f3; }
          ul { line-height: 2; }
          .badge { background: #0070f3; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8em; }
        `}</style>
      </head>
      <body>
        <h1>React 18 SSR Demo</h1>
        <p>
          Powered by <strong>astro-runtime</strong> · goja engine ·{' '}
          <span className="badge">react18 bootstrap</span>
        </p>
        <h2>商品列表</h2>
        <ProductList items={ITEMS} />
        <hr />
        <p>渲染时间: {new Date().toISOString()}</p>
      </body>
    </html>
  );
}

export default async function handler(request) {
  const url = new URL(request.url);

  if (url.pathname === '/health') {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (url.pathname === '/api/products') {
    return new Response(JSON.stringify({ items: ITEMS }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  const stream = await renderToReadableStream(<Page />, {
    onError: (err) => console.error('React SSR error:', String(err)),
  });

  return new Response(stream, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
