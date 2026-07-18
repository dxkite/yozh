import type { APIContext } from 'astro';
import { userCartItems } from '../../models/session';

export function GET({ cookies }: APIContext) {
  const userId = cookies.get('user-id')?.value;
  if (!userId || !userCartItems.has(userId)) return Response.json({ items: [] });
  return Response.json({ items: Array.from(userCartItems.get(userId)!.values()) });
}

export async function POST({ cookies, request }: APIContext) {
  const item: { id: number; name: string } = await request.json();
  const userId = cookies.get('user-id')?.value ?? '';

  if (!userCartItems.has(userId)) userCartItems.set(userId, new Map());
  const cart = userCartItems.get(userId)!;

  if (cart.has(item.id)) {
    cart.get(item.id)!.count++;
  } else {
    cart.set(item.id, { id: item.id, name: item.name, count: 1 });
  }

  return Response.json({ ok: true });
}
