package astroruntime

import (
	"fmt"
	"strings"

	"github.com/evanw/esbuild/pkg/api"
)

// BundleSSR bundles the Netlify SSR .mjs entry to a self-contained ESM bundle.
//
// Strategy: bundle all relative (pre-built .netlify/build/) chunks normally; intercept
// every bare specifier (node: builtins and third-party packages) with a plugin that
// provides inline stubs. This avoids trying to follow pnpm directory junctions for
// packages that are either client-side-only or can be replaced with thin shims, while
// still allowing top-level await via ESM format + ES2023 target.
func BundleSSR(entryPath string) ([]byte, error) {
	result := api.Build(api.BuildOptions{
		EntryPoints: []string{entryPath},
		Bundle:      true,
		Write:       false,
		Format:   api.FormatESModule,
		Platform: api.PlatformNeutral,
		Target:   api.ES2023,
		// Force "require" export condition first so esbuild picks the CJS distribution
		// of node_modules packages. CJS distributions (dist/index.js) are typically
		// self-contained; ESM distributions (dist/index.mjs) import from sibling
		// packages that pnpm stores under .pnpm/ and are not reachable from root
		// node_modules/ (e.g. @radix-ui/react-dialog/.mjs imports @radix-ui/primitive
		// which is not hoisted). With "require" first, those sibling packages are never
		// visited. "node" and "import" as fallbacks cover ESM-only packages (nanostores)
		// and packages without a require condition.
		Conditions: []string{"require", "node", "import", "default"},
		// PlatformNeutral ignores main/module fields by default. Explicitly set them
		// so packages without an exports map (e.g. type:module packages with only a
		// "main" field) are still resolved. "main" first prefers CJS distributions.
		MainFields: []string{"main", "module", "browser"},
		Plugins:    []api.Plugin{nodeShimPlugin()},
		Define: map[string]string{
			"process.env.NODE_ENV": `"production"`,
		},
		LogLevel:  api.LogLevelSilent,
		Sourcemap: api.SourceMapNone,
	})

	if len(result.Errors) > 0 {
		msgs := api.FormatMessages(result.Errors, api.FormatMessagesOptions{
			Kind: api.ErrorMessage,
		})
		return nil, fmt.Errorf("esbuild errors:\n%s", strings.Join(msgs, "\n"))
	}

	if len(result.OutputFiles) == 0 {
		return nil, fmt.Errorf("esbuild produced no output files")
	}

	return result.OutputFiles[0].Contents, nil
}

// nodeShimPlugin provides inline ESM stubs for every bare specifier.
//
// Two-level approach:
//  1. Specific handlers (registered first) — node: builtins and known packages with
//     real implementations so SSR rendering works correctly.
//  2. Catch-all (registered last) — any other bare specifier that doesn't start with
//     '.' or '/' gets an empty stub. This covers client-side-only packages
//     (@radix-ui/*, @floating-ui/*, react-remove-scroll, …) that pnpm stores under
//     .pnpm/ junction trees that esbuild can't reliably traverse on Windows.
func nodeShimPlugin() api.Plugin {
	return api.Plugin{
		Name: "node-shim",
		Setup: func(build api.PluginBuild) {
			// ── Level 1: Node builtins and known packages ────────────────────────
			build.OnResolve(api.OnResolveOptions{
				Filter: `^(node:|process$|fs$|fs/|path$|path/|url$|crypto$|buffer$|stream$|http$|https$|http2$|os$|async_hooks$|worker_threads$|perf_hooks$|events$|util$|assert$|net$|tls$|zlib$|child_process$|dns$|dgram$|readline$|cookie$|html-escaper$|cssesc$|reading-time$|sanitize-html$|@astrojs/internal-helpers/|@oslojs/encoding$|devalue$|unstorage$|piccolore$|es-module-lexer$|deterministic-object-hash$|client-only$|fast-xml-parser$)`,
			}, func(args api.OnResolveArgs) (api.OnResolveResult, error) {
				return api.OnResolveResult{Path: args.Path, Namespace: "node-shim"}, nil
			})

			// No catch-all: let esbuild resolve unmatched packages normally through
			// node_modules. With Conditions:["require",...] most packages use their
			// self-contained CJS distributions, so pnpm-isolated transitive deps are
			// never visited. Only the packages listed in Level 1 need explicit stubs.

			// ── Load handler: return stub ESM code ───────────────────────────────
			build.OnLoad(api.OnLoadOptions{
				Filter:    `.*`,
				Namespace: "node-shim",
			}, func(args api.OnLoadArgs) (api.OnLoadResult, error) {
				code := nodeShimCode(args.Path)
				return api.OnLoadResult{Contents: &code, Loader: api.LoaderJS}, nil
			})
		},
	}
}

// nodeShimCode returns inline ESM stub code for a given module path.
// Packages critical for SSR rendering get real (or near-real) implementations;
// client-side-only or unused packages get an empty default export.
func nodeShimCode(path string) string {
	// ── Node built-ins ───────────────────────────────────────────────────────
	switch path {
	case "node:process", "process":
		return `
export const env = globalThis.__processEnv || {};
export const version = 'v20.0.0';
export const versions = {};
export const platform = 'linux';
export const stdout = { write: () => {} };
export const stderr = { write: () => {} };
export default globalThis.process || { env, version, versions, platform };
`
	case "node:crypto", "crypto":
		return `
export const webcrypto = globalThis.crypto;
export const randomBytes = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n));
export default { webcrypto, randomBytes };
`
	case "node:buffer", "buffer":
		return `
export const File = globalThis.File;
export const Blob = globalThis.Blob;
export function Buffer() {}
Buffer.from = (data, enc) => {
  if (typeof data === 'string') return new TextEncoder().encode(data);
  return new Uint8Array(data);
};
Buffer.alloc = (n) => new Uint8Array(n);
Buffer.isBuffer = () => false;
export default { File, Blob, Buffer };
`
	case "node:path", "path", "node:path/posix", "path/posix":
		return `
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
`
	case "node:url", "url":
		return `
export const URL = globalThis.URL;
export const URLSearchParams = globalThis.URLSearchParams;
export const fileURLToPath = (u) => String(u).replace(/^file:\/\//, '');
export const pathToFileURL = (p) => new globalThis.URL('file://' + p);
export const format = (u) => (typeof u === 'string' ? u : (u && u.href) || String(u));
export const parse = (u) => { try { const x = new globalThis.URL(u); return { href: x.href, protocol: x.protocol, host: x.host, pathname: x.pathname, search: x.search, hash: x.hash }; } catch { return { href: u }; } };
export default { URL, URLSearchParams, fileURLToPath, pathToFileURL, format, parse };
`
	case "node:stream", "stream":
		return `
function PassThrough() { this._chunks = []; this._listeners = {}; }
PassThrough.prototype.write = function(c) { this._chunks.push(c); return true; };
PassThrough.prototype.end = function(c) { if (c) this.write(c); (this._listeners['end'] || []).forEach(fn => fn()); };
PassThrough.prototype.on = function(e, fn) { (this._listeners[e] = this._listeners[e] || []).push(fn); return this; };
PassThrough.prototype.pipe = function(dest) { this._listeners['end'] = this._listeners['end'] || []; this._listeners['end'].push(() => { this._chunks.forEach(c => dest.write(c)); dest.end(); }); return dest; };
export { PassThrough };
export const pipeline = (...args) => { const cb = args[args.length - 1]; Promise.resolve().then(() => cb && cb(null)); };
export const Readable = PassThrough;
export const Writable = PassThrough;
export const Transform = PassThrough;
export const Stream = PassThrough;
export default { PassThrough, Readable, Writable, Transform, Stream, pipeline };
`
	case "node:stream/web", "stream/web":
		// Empty — bundled packages detect absence and activate their own polyfill.
		return `export default {};`
	case "node:events", "events":
		return `
function EventEmitter() { this._events = {}; }
EventEmitter.prototype.on = function(e, fn) { (this._events[e] = this._events[e] || []).push(fn); return this; };
EventEmitter.prototype.off = function(e, fn) { if (this._events[e]) this._events[e] = this._events[e].filter(f => f !== fn); return this; };
EventEmitter.prototype.emit = function(e, ...args) { (this._events[e] || []).forEach(fn => fn(...args)); return true; };
EventEmitter.prototype.once = function(e, fn) { const w = (...a) => { this.off(e, w); fn(...a); }; return this.on(e, w); };
EventEmitter.prototype.removeAllListeners = function(e) { if (e) delete this._events[e]; else this._events = {}; return this; };
export { EventEmitter };
export default { EventEmitter };
`
	case "node:async_hooks", "async_hooks":
		return `
class AsyncLocalStorage {
  constructor() { this._store = undefined; }
  run(store, fn, ...args) { const prev = this._store; this._store = store; try { return fn(...args); } finally { this._store = prev; } }
  getStore() { return this._store; }
  enterWith(store) { this._store = store; }
  disable() {}
  static bind(fn) { return fn; }
}
class AsyncResource {
  constructor(type) { this._type = type; }
  runInAsyncScope(fn, thisArg, ...args) { return fn.apply(thisArg, args); }
  emitDestroy() { return this; }
  asyncId() { return 0; }
  triggerAsyncId() { return 0; }
  bind(fn) { return fn.bind(this); }
  static bind(fn, type, thisArg) { return fn.bind(thisArg); }
}
export { AsyncLocalStorage, AsyncResource };
export function createHook() { return { enable() {}, disable() {} }; }
export function executionAsyncId() { return 0; }
export function triggerAsyncId() { return 0; }
export default { AsyncLocalStorage, AsyncResource, createHook, executionAsyncId, triggerAsyncId };
`
	case "node:util", "util":
		return `
export const promisify = (fn) => (...args) => new Promise((res, rej) => fn(...args, (e, v) => e ? rej(e) : res(v)));
export const inspect = (v) => JSON.stringify(v);
export const inherits = (ctor, superCtor) => { ctor.super_ = superCtor; Object.setPrototypeOf(ctor.prototype, superCtor.prototype); };
export const deprecate = (fn, msg) => fn;
export const types = { isNativeError: (v) => v instanceof Error, isPromise: (v) => v && typeof v.then === 'function', isRegExp: (v) => v instanceof RegExp };
export const format = (fmt, ...args) => { let i = 0; return String(fmt).replace(/%[sdjifoO%]/g, (m) => m === '%%' ? '%' : String(args[i++])); };
export const TextEncoder = globalThis.TextEncoder;
export const TextDecoder = globalThis.TextDecoder;
export default { promisify, inspect, inherits, deprecate, types, format, TextEncoder, TextDecoder };
`
	case "node:net", "net":
		return `
export const isIP = (s) => { if (/^(\d{1,3}\.){3}\d{1,3}$/.test(s)) return 4; if (s.includes(':')) return 6; return 0; };
export const isIPv4 = (s) => isIP(s) === 4;
export const isIPv6 = (s) => isIP(s) === 6;
export default { isIP, isIPv4, isIPv6 };
`
	case "node:fs", "fs", "node:fs/promises":
		return `
const noop = () => Promise.resolve(null);
export const promises = { readFile: noop, writeFile: noop, readdir: noop, stat: noop, mkdir: noop, rm: noop, access: noop, readlink: noop };
export const statSync = () => { throw new Error('statSync not supported in SSR'); };
export const createReadStream = () => { throw new Error('createReadStream not supported in SSR'); };
export const existsSync = () => false;
export const readFileSync = () => { throw new Error('readFileSync not supported in SSR'); };
export default { promises, statSync, createReadStream, existsSync, readFileSync };
`
	case "node:http2", "http2":
		return `
export function createServer() { return { listen: () => {}, close: () => {} }; }
export function createSecureServer() { return { listen: () => {}, close: () => {} }; }
export class Http2ServerResponse {}
export class Http2ServerRequest {}
export default { createServer, createSecureServer, Http2ServerResponse, Http2ServerRequest };
`
	// ── SSR-critical third-party packages ────────────────────────────────────
	case "cookie":
		return `
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
`
	case "html-escaper":
		return `
const _esc = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
const _unesc = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#x27;': "'" };
export const escape = (s) => String(s).replace(/[&<>"']/g, c => _esc[c]);
export const unescape = (s) => String(s).replace(/&(?:amp|lt|gt|quot|#x27);/g, m => _unesc[m] || m);
export default { escape, unescape };
`
	case "cssesc":
		return `
function cssesc(str, opts) {
  opts = opts || {};
  return str.replace(/[^\x20-\x7E]|[!"#$%&'()*+,./:;<=>?@\[\\\]^{|}~]/g, function(c) {
    var code = c.codePointAt(0);
    return '\\' + code.toString(16) + ' ';
  });
}
cssesc.default = cssesc;
export default cssesc;
`
	case "@astrojs/internal-helpers/path":
		return `
export const joinPaths = (...ps) => ps.filter(Boolean).join('/').replace(/\/+/g, '/');
export const removeTrailingForwardSlash = (p) => p !== '/' ? p.replace(/\/$/, '') : p;
export const appendForwardSlash = (p) => p.endsWith('/') ? p : p + '/';
export const prependForwardSlash = (p) => p.startsWith('/') ? p : '/' + p;
export const removeLeadingForwardSlash = (p) => p.startsWith('/') ? p.slice(1) : p;
export const isRemotePath = (p) => /^https?:\/\//.test(p) || p.startsWith('//');
export const slash = (p) => p.replace(/\\/g, '/');
export const trimSlashes = (p) => p.replace(/^\/|\/$/g, '');
export const collapseDuplicateTrailingSlashes = (p) => p.replace(/\/{2,}$/, '/');
export const hasFileExtension = (p) => /\.[^./]+$/.test(p.split('?')[0].split('#')[0]);
export const isInternalPath = (p) => p.startsWith('/_') || p === '/_astro' || p.startsWith('/_astro/');
export const removeQueryString = (p) => p.split('?')[0];
export const fileExtension = (p) => { const b = p.split('/').pop() || ''; const i = b.lastIndexOf('.'); return i > 0 ? b.slice(i) : ''; };
export default { joinPaths, removeTrailingForwardSlash, appendForwardSlash, prependForwardSlash, removeLeadingForwardSlash, isRemotePath, slash, trimSlashes, collapseDuplicateTrailingSlashes, hasFileExtension, isInternalPath, removeQueryString, fileExtension };
`
	case "@astrojs/internal-helpers/remote":
		return `
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
`
	case "@oslojs/encoding":
		return `
export function decodeHex(hex) {
  const arr = new Uint8Array(hex.length >>> 1);
  for (let i = 0; i < arr.length; i++) arr[i] = parseInt(hex.slice(i*2, i*2+2), 16);
  return arr;
}
export function encodeBase64(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
export function decodeBase64(b64) {
  const s = atob(b64);
  const arr = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) arr[i] = s.charCodeAt(i);
  return arr;
}
export function encodeBase64url(bytes) {
  return encodeBase64(bytes).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
export function decodeBase64url(b64url) {
  return decodeBase64(b64url.replace(/-/g,'+').replace(/_/g,'/'));
}
export function encodeHex(bytes) {
  return Array.from(bytes, b => b.toString(16).padStart(2,'0')).join('');
}
export function encodeHexUpperCase(bytes) {
  return Array.from(bytes, b => b.toString(16).padStart(2,'0').toUpperCase()).join('');
}
export default { decodeHex, encodeBase64, decodeBase64, encodeBase64url, decodeBase64url, encodeHex, encodeHexUpperCase };
`
	case "devalue":
		// Astro uses devalue for session/actions serialization.
		// Provide stringify/parse/unflatten stubs — returns JSON for simple values.
		return `
export const stringify = (v) => JSON.stringify(v);
export const parse = (v) => JSON.parse(v);
export const unflatten = (v) => v;
export const flattened = (v) => v;
export default { stringify, parse, unflatten, flattened };
`
	case "reading-time":
		// Simplified reading-time v1.5 compatible implementation.
		return `
function readingTime(text, options) {
  options = options || {};
  var wpm = options.wordsPerMinute || 200;
  var words = (text || '').trim().split(/\s+/g).filter(Boolean).length;
  var minutes = words / wpm;
  var time = Math.round(minutes * 60 * 1000);
  var displayed = Math.max(1, Math.ceil(minutes));
  return { text: displayed + ' min read', minutes: minutes, time: time, words: words };
}
export default readingTime;
`
	case "sanitize-html":
		// Pass-through stub — SSR content is author-controlled markdown.
		return `
function sanitizeHtml(dirty, _options) { return dirty == null ? '' : String(dirty); }
sanitizeHtml.defaults = { allowedTags: [], allowedAttributes: {}, allowedSchemes: [] };
export default sanitizeHtml;
`
	case "fast-xml-parser":
		// Minimal XMLBuilder for @astrojs/rss RSS feed generation.
		return `
export class XMLBuilder {
  constructor(opts) { this.opts = opts || {}; }
  build(obj) {
    function toXML(key, val, indent) {
      if (val === null || val === undefined) return '';
      if (Array.isArray(val)) return val.map(v => toXML(key, v, indent)).join('\n');
      if (typeof val === 'object') {
        const attrs = val['@_'] ? ' ' + Object.entries(val['@_']).map(([k,v]) => k+'="'+v+'"').join(' ') : '';
        const text = val['#text'] !== undefined ? escXml(val['#text']) : '';
        const children = Object.entries(val)
          .filter(([k]) => k !== '@_' && k !== '#text')
          .map(([k, v]) => toXML(k, v, indent + '  ')).join('\n');
        const inner = text + (children ? '\n' + children + '\n' + indent : '');
        return indent + '<' + key + attrs + '>' + inner + '</' + key + '>';
      }
      return indent + '<' + key + '>' + escXml(String(val)) + '</' + key + '>';
    }
    function escXml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    const root = Object.entries(obj)[0];
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + toXML(root[0], root[1], '');
  }
}
export class XMLParser {
  constructor(opts) {}
  parse(xml) { return {}; }
}
export default { XMLBuilder, XMLParser };
`
	case "piccolore":
		// Astro's terminal color library — only needed for CLI output, not SSR.
		return `
const id = (s) => s;
const c = new Proxy({}, { get: (t, k) => typeof k === 'string' && k !== 'default' ? id : id });
export default c;
`
	case "deterministic-object-hash":
		return `
export function deterministicString(obj) {
  return JSON.stringify(obj, Object.keys(obj||{}).sort());
}
export default { deterministicString };
`
	case "es-module-lexer":
		return `
export const parse = (s) => [[], [], false, ''];
export const init = Promise.resolve();
export default { parse, init };
`
	case "unstorage":
		return `
export function createStorage(opts) {
  const store = new Map();
  return {
    getItem: (k) => Promise.resolve(store.get(k) ?? null),
    setItem: (k, v) => { store.set(k, v); return Promise.resolve(); },
    removeItem: (k) => { store.delete(k); return Promise.resolve(); },
    clear: () => { store.clear(); return Promise.resolve(); },
    getKeys: (base) => Promise.resolve([...store.keys()].filter(k => !base || k.startsWith(base))),
    hasItem: (k) => Promise.resolve(store.has(k)),
    dispose: () => Promise.resolve(),
    mount: () => {},
    unmount: () => {},
  };
}
export const builtinDrivers = {};
export function defineDriver(factory) { return factory; }
export function prefixStorage(storage, prefix) { return storage; }
export default { createStorage, builtinDrivers, defineDriver, prefixStorage };
`
	case "client-only":
		return `export default {};`
	default:
		// Catch-all: packages that esbuild cannot resolve after the "require" condition
		// fix (pnpm-isolated transitive deps, missing peer deps, client-only libs).
		// We export a default {} AND re-export it as named exports via an __esModule
		// style shim so that `import { Foo } from 'pkg'` doesn't cause a link error.
		// Note: esbuild performs static named-export checking, so we cannot use a
		// runtime Proxy here. If a specific named import is needed, add a proper case
		// in the switch above. This stub covers packages that are either unused at SSR
		// time or whose output is intentionally discarded (client-side UI libs).
		return `export default {};`
	}
}
