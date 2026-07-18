import { defineMiddleware } from 'astro:middleware';
import { verifyToken } from './lib/hmac';

// Only /admin/* requires authentication. All other routes are public.
export const onRequest = defineMiddleware(async (ctx, next) => {
  const path = new URL(ctx.request.url).pathname;
  if (!path.startsWith('/admin/')) return next();

  const token = ctx.cookies.get('session')?.value;
  const userId = token ? await verifyToken(token) : null;

  if (!userId) {
    if (path.startsWith('/admin/api/')) {
      return Response.json({ error: 'unauthorized' }, { status: 401 });
    }
    return ctx.redirect('/');
  }

  ctx.locals.userId = userId;
  return next();
});
