import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ request }) => {
  return new Response(
    JSON.stringify({
      time: new Date().toISOString(),
      url: request.url,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
