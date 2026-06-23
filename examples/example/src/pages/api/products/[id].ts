import type { APIRoute } from 'astro';
import { productMap } from '../../../models/db';

export const prerender = false;
export const GET: APIRoute = ({ params }) => {
  const product = productMap.get(Number(params.id));
  if (!product) return new Response(null, { status: 404, statusText: 'Not found' });
  return Response.json(product);
};
