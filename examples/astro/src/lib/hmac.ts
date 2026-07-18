// HMAC-SHA-256 helpers for signing and verifying session tokens.
// Demonstrates Web Crypto API usage within the astro-runtime JS runtime.
const SECRET = import.meta.env.SESSION_SECRET ?? 'dev-secret';

async function importKey(usage: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    usage,
  );
}

export async function signToken(userId: string): Promise<string> {
  const payload = btoa(userId);
  const key = await importKey(['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return `${payload}.${btoa(String.fromCharCode(...new Uint8Array(sig)))}`;
}

export async function verifyToken(token: string): Promise<string | null> {
  try {
    const [payload, sig] = token.split('.');
    const key = await importKey(['verify']);
    const ok = await crypto.subtle.verify(
      'HMAC',
      key,
      Uint8Array.from(atob(sig), c => c.charCodeAt(0)),
      new TextEncoder().encode(payload),
    );
    return ok ? atob(payload) : null;
  } catch {
    return null;
  }
}
