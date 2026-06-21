export const sep = '/';
export const join = (...parts) => parts.filter(Boolean).join('/').replace(/\/+/g, '/');
export const resolve = (...parts) => parts[parts.length - 1] || '/';
export const dirname = (p) => p.split('/').slice(0, -1).join('/') || '/';
export const basename = (p, ext) => {
  const b = p.split('/').pop() || '';
  return ext && b.endsWith(ext) ? b.slice(0, -ext.length) : b;
};
export const extname = (p) => {
  const b = p.split('/').pop() || '';
  const i = b.lastIndexOf('.');
  return i > 0 ? b.slice(i) : '';
};
export const normalize = (p) => p.replace(/\/+/g, '/');
export const isAbsolute = (p) => p.startsWith('/');
export const relative = (_from, to) => to;
export const parse = (p) => {
  const ext = extname(p);
  const base = basename(p);
  return { root: '', dir: dirname(p), base, ext, name: base.slice(0, base.length - ext.length) };
};
export const format = ({ dir, base, name, ext }) =>
  [dir, base || (name + (ext || ''))].filter(Boolean).join('/');
export const posix = { sep, join, resolve, dirname, basename, extname, normalize, isAbsolute, relative, parse, format };
export default { sep, join, resolve, dirname, basename, extname, normalize, isAbsolute, relative, parse, format, posix };
