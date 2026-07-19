export const URL = globalThis.URL;
export const URLSearchParams = globalThis.URLSearchParams;
export const fileURLToPath = (u) => String(u).replace(/^file:\/\//, '');
export const pathToFileURL = (p) => new globalThis.URL('file://' + p);
export const format = (u) => (typeof u === 'string' ? u : (u && u.href) || String(u));
export const parse = (u) => {
  try {
    const x = new globalThis.URL(u);
    return { href: x.href, protocol: x.protocol, host: x.host, pathname: x.pathname, search: x.search, hash: x.hash };
  } catch {
    return { href: u };
  }
};
export default { URL, URLSearchParams, fileURLToPath, pathToFileURL, format, parse };
