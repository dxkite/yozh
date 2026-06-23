import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ request }) =>
  Response.json({ time: new Date().toISOString(), url: request.url });
