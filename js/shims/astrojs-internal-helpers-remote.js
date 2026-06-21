export function isRemoteAllowed(src, remotePatterns, domains) {
  try { new globalThis.URL(src); return true; } catch { return false; }
}
export function matchHostname(url, hostname, allowWildcard) {
  if (!hostname) return true;
  if (allowWildcard && hostname.startsWith('*')) return url.hostname.endsWith(hostname.slice(1));
  return url.hostname === hostname;
}
export function matchPathname(url, pathname, allowWildcard) {
  if (!pathname) return true;
  if (allowWildcard && pathname.endsWith('*')) return url.pathname.startsWith(pathname.slice(0, -1));
  return url.pathname === pathname;
}
export function matchPattern(url, pattern) {
  try {
    const u = typeof url === 'string' ? new globalThis.URL(url) : url;
    if (pattern.hostname && !matchHostname(u, pattern.hostname, true)) return false;
    if (pattern.pathname && !matchPathname(u, pattern.pathname, true)) return false;
    if (pattern.protocol && u.protocol !== pattern.protocol + ':') return false;
    if (pattern.port && u.port !== String(pattern.port)) return false;
    return true;
  } catch { return false; }
}
export function matchPort(url, port) { return !port || url.port === String(port); }
export function matchProtocol(url, protocol) { return !protocol || url.protocol === protocol + ':'; }
export default { isRemoteAllowed, matchHostname, matchPathname, matchPattern, matchPort, matchProtocol };
