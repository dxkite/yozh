export function parse(str, options) {
  const obj = {};
  for (const pair of String(str || '').split(';')) {
    const idx = pair.indexOf('=');
    if (idx < 0) continue;
    let key = pair.slice(0, idx).trim();
    if (!key) continue;
    let val = pair.slice(idx + 1).trim();
    if (val[0] === '"') val = val.slice(1, -1);
    try { obj[key] = decodeURIComponent(val); } catch { obj[key] = val; }
  }
  return obj;
}
export function serialize(name, val, opts) {
  opts = opts || {};
  let str = encodeURIComponent(name) + '=' + encodeURIComponent(val);
  if (opts.maxAge != null) str += '; Max-Age=' + Math.floor(opts.maxAge);
  if (opts.domain) str += '; Domain=' + opts.domain;
  if (opts.path != null) str += '; Path=' + opts.path;
  if (opts.expires) str += '; Expires=' + opts.expires.toUTCString();
  if (opts.httpOnly) str += '; HttpOnly';
  if (opts.secure) str += '; Secure';
  if (opts.sameSite) str += '; SameSite=' + opts.sameSite;
  return str;
}
export default { parse, serialize };
