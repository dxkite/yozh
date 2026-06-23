import type { APIRoute } from 'astro';

// Demonstrates parallel fetching with Promise.allSettled
export const GET: APIRoute = async ({ request }) => {
  const base = new URL(request.url).origin;
  const [timeResult, productsResult] = await Promise.allSettled([
    fetch(`${base}/api/time`).then(r => r.json()),
    fetch(`${base}/api/products`).then(r => r.json()),
  ]);

  return Response.json({
    time: timeResult.status === 'fulfilled' ? timeResult.value : null,
    products: productsResult.status === 'fulfilled' ? productsResult.value : [],
  });
};
