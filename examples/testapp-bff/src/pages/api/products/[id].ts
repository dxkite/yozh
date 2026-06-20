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

  // NOTE: astro-runtime 的 fetch() 通过 Go goroutine 实现异步；
  // wazero WASM 模块单线程，Promise.allSettled 产生的并发回调会竞争。
  // 使用顺序 await，各服务依次调用，降级用 try/catch 包裹。
  let product: Product | null = null;
  let inventory: Inventory | null = null;
  let reviews: Reviews | null = null;

  try { product   = await upstreamGet<Product>(`${CATALOG}/products/${id}`);   } catch {}
  try { inventory = await upstreamGet<Inventory>(`${INVENTORY}/stock/${id}`);  } catch {}
  try { reviews   = await upstreamGet<Reviews>(`${REVIEW}/reviews/${id}`);     } catch {}

  if (!product) return Response.json({ error: 'not found' }, { status: 404 });

  return Response.json({ product, inventory, reviews });
};
