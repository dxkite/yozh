import type { APIRoute } from 'astro';
import { upstreamGet } from '../../../lib/upstream';

interface Product   { id: number; name: string; price: number }
interface Inventory { stock: number }
interface Reviews   { rating: number; count: number }

const CATALOG   = import.meta.env.CATALOG_URL   ?? process.env['CATALOG_URL']   ?? 'http://localhost:3001';
const INVENTORY = import.meta.env.INVENTORY_URL ?? process.env['INVENTORY_URL'] ?? 'http://localhost:3002';
const REVIEW    = import.meta.env.REVIEW_URL    ?? process.env['REVIEW_URL']    ?? 'http://localhost:3003';

export const GET: APIRoute = async ({ params, locals }) => {
  if (!locals.userId) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const id = params.id;

  // 三个上游请求并发执行：goroutine 各自完成 HTTP 后通过 channel 回调，
  // QJS 事件循环依次 resolve Promise，总耗时 ≈ 最慢单个请求（而非三者之和）。
  const [productResult, inventoryResult, reviewsResult] = await Promise.allSettled([
    upstreamGet<Product>(`${CATALOG}/products/${id}`),
    upstreamGet<Inventory>(`${INVENTORY}/stock/${id}`),
    upstreamGet<Reviews>(`${REVIEW}/reviews/${id}`),
  ]);

  if (productResult.status === 'rejected') {
    return Response.json({ error: 'not found' }, { status: 404 });
  }

  return Response.json({
    product:   productResult.value,
    inventory: inventoryResult.status === 'fulfilled' ? inventoryResult.value : null,
    reviews:   reviewsResult.status   === 'fulfilled' ? reviewsResult.value   : null,
  });
};
