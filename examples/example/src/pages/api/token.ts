import type { APIRoute } from 'astro';
import { signToken, verifyToken } from '../../lib/hmac';

// GET  /api/token?user=<id>  — sign a session token for userId
// POST /api/token             — verify token from body { token }
export const GET: APIRoute = async ({ url }) => {
  const userId = url.searchParams.get('user') ?? 'anonymous';
  const token = await signToken(userId);
  return Response.json({ token, userId });
};

export const POST: APIRoute = async ({ request }) => {
  const { token } = await request.json() as { token: string };
  const userId = await verifyToken(token);
  if (!userId) return Response.json({ error: 'invalid token' }, { status: 401 });
  return Response.json({ userId });
};
