/**
 * HMAC-signed upstream fetch.
 * BFF → upstream service 的出向请求附带签名头，
 * 上游服务验证签名以拒绝非法来源调用。
 */

const SECRET = import.meta.env.UPSTREAM_SECRET ?? process.env['UPSTREAM_SECRET'] ?? '';

async function sign(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

export async function upstreamGet<T>(url: string): Promise<T> {
  const ts  = String(Date.now());
  const sig = await sign(ts);
  const res = await fetch(url, {
    headers: { 'X-Timestamp': ts, 'X-Signature': sig },
  });
  if (!res.ok) throw new Error(`upstream ${url} → ${res.status}`);
  return res.json() as Promise<T>;
}
