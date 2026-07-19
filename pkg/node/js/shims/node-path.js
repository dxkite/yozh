export const sep = '/';

export const normalize = (p) => {
  var abs = p[0] === '/';
  var out = [];
  var leading = 0; // leading ".." count that couldn't be resolved (relative paths only)
  var segs = p.split('/');
  for (var i = 0; i < segs.length; i++) {
    var s = segs[i];
    if (s === '' || s === '.') continue;
    if (s === '..') {
      if (out.length > 0) out.pop();
      else if (!abs) leading++;
    } else {
      out.push(s);
    }
  }
  var r = (leading ? Array(leading).fill('..').concat(out) : out).join('/');
  return abs ? '/' + r : (r || '.');
};

export const join = (...parts) => normalize(parts.filter(Boolean).join('/'));

export const resolve = (...parts) => {
  var resolved = '';
  for (var i = parts.length - 1; i >= 0; i--) {
    var p = String(parts[i] || '');
    if (!p) continue;
    resolved = resolved ? p + '/' + resolved : p;
    if (p[0] === '/') break;
  }
  return normalize(resolved || '/');
};

export const dirname = (p) => {
  var i = p.lastIndexOf('/');
  return i <= 0 ? (i === 0 ? '/' : '.') : p.slice(0, i);
};

export const basename = (p, ext) => {
  var b = p.split('/').pop() || '';
  return ext && b.endsWith(ext) ? b.slice(0, -ext.length) : b;
};

export const extname = (p) => {
  var b = p.split('/').pop() || '';
  var i = b.lastIndexOf('.');
  return i > 0 ? b.slice(i) : '';
};

export const isAbsolute = (p) => p[0] === '/';

export const relative = (from, to) => {
  var f = from.split('/').filter(Boolean);
  var t = to.split('/').filter(Boolean);
  var common = 0;
  while (common < f.length && common < t.length && f[common] === t[common]) common++;
  var ups = Array(f.length - common).fill('..');
  return ups.concat(t.slice(common)).join('/') || '.';
};

export const parse = (p) => {
  const ext = extname(p);
  const base = basename(p);
  return { root: isAbsolute(p) ? '/' : '', dir: dirname(p), base, ext, name: base.slice(0, -ext.length || undefined) };
};

export const format = ({ dir, root, base, name, ext }) =>
  (dir || root || '') + (dir ? '/' : '') + (base || (name + (ext || '')));

export const posix = { sep, join, resolve, normalize, dirname, basename, extname, isAbsolute, relative, parse, format };
export default { sep, join, resolve, normalize, dirname, basename, extname, isAbsolute, relative, parse, format, posix };
