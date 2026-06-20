import { defineMiddleware } from 'astro:middleware';

const PUBLIC = ['/', /^\/api\/auth/];

export const onRequest = defineMiddleware(async (ctx, next) => {
  const path = new URL(ctx.request.url).pathname;
  const isPublic = PUBLIC.some(p => typeof p === 'string' ? path === p : p.test(path));
  if (isPublic) return next();

  const token = ctx.cookies.get('session')?.value;
  const userId = token ? await verifyToken(token) : null;

  if (!userId) {
    if (path.startsWith('/api/')) return Response.json({ error: 'unauthorized' }, { status: 401 });
    return ctx.redirect('/');
  }

  ctx.locals.userId = userId;
  return next();
});

const SECRET = import.meta.env.SESSION_SECRET ?? process.env['SESSION_SECRET'] ?? 'dev-secret';

async function verifyToken(token: string): Promise<string | null> {
  try {
    const [payload, sig] = token.split('.');
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(SECRET),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'],
    );
    const ok = await crypto.subtle.verify(
      'HMAC', key,
      Uint8Array.from(atob(sig), c => c.charCodeAt(0)),
      new TextEncoder().encode(payload),
    );
    return ok ? atob(payload) : null;
  } catch {
    return null;
  }
}
