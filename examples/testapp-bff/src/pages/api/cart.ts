import type { APIRoute } from 'astro';

interface CartItem { id: number; name: string; price: number; count: number }

const KEY_B64 = import.meta.env.CART_KEY ?? process.env['CART_KEY'] ?? '';

async function cartKey() {
  return crypto.subtle.importKey(
    'raw', Uint8Array.from(atob(KEY_B64), c => c.charCodeAt(0)),
    { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'],
  );
}

const b64 = (u8: Uint8Array) => btoa(String.fromCharCode(...u8));
const fromb64 = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0));

async function encryptCart(items: CartItem[]): Promise<string> {
  const key  = await cartKey();
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const enc  = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key,
    new TextEncoder().encode(JSON.stringify(items)),
  );
  return `${b64(iv)}.${b64(new Uint8Array(enc))}`;
}

async function decryptCart(token: string): Promise<CartItem[]> {
  if (!token) return [];
  try {
    const [ivB64, ctB64] = token.split('.');
    const key = await cartKey();
    const dec = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromb64(ivB64) }, key, fromb64(ctB64),
    );
    return JSON.parse(new TextDecoder().decode(dec));
  } catch {
    return [];
  }
}

export const GET: APIRoute = async ({ cookies }) => {
  const items = await decryptCart(cookies.get('cart')?.value ?? '');
  return Response.json({ items });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const body: Partial<CartItem> = await request.json();
  if (!body.id || !body.name) return Response.json({ error: 'bad request' }, { status: 400 });

  const items = await decryptCart(cookies.get('cart')?.value ?? '');
  const existing = items.find(i => i.id === body.id);
  if (existing) existing.count++;
  else items.push({ id: body.id!, name: body.name!, price: body.price ?? 0, count: 1 });

  cookies.set('cart', await encryptCart(items), { httpOnly: true, path: '/', sameSite: 'lax' });
  return Response.json({ ok: true });
};
