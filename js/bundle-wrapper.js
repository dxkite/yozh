// bundle-wrapper.js — wraps the esbuild CJS bundle so it runs in QJS.
//
// The Go runtime replaces the BUNDLE_INJECTION marker below with the actual
// bundle contents before this script is evaluated.
//
// On completion globalThis.__ssrHandler holds async function(request, context).
var __ssrHandler = (function(module, exports) {
  var require = function(id) {
    if (id === 'process' || id === 'node:process')
      return { env: __processEnv };
    if (id === 'node:crypto' || id === 'crypto')
      return { webcrypto: globalThis.crypto };
    if (id === 'node:buffer' || id === 'buffer')
      return { File: globalThis.File };
    if (id === 'node:path' || id === 'path')
      return {
        join: function() { return Array.prototype.slice.call(arguments).join('/'); },
        resolve: function(p) { return p; },
        dirname: function(p) { return p.split('/').slice(0,-1).join('/'); },
        basename: function(p) { return p.split('/').pop(); },
      };
    // node:stream/web must throw so the bundle activates its bundled web-streams-polyfill
    // fallback: try { Object.assign(globalThis, require('node:stream/web')) } catch { usePolyfill() }
    if (id === 'node:stream/web' || id === 'stream/web') throw new Error(id + ' not available in QJS');
    return {};
  };
  __BUNDLE_CODE__
  // Detect whether the export is a factory or already the handler.
  // @astrojs/netlify v7+ generates "export default createHandler({...})" in the
  // entry, so module.exports.default is the already-bound async handler(request,
  // context). Older factory-style bundles export function(config) that returns
  // the handler -- detectable because factory.length < 2.
  var __rawExport = module.exports.default || module.exports;
  if (typeof __rawExport === 'function' && __rawExport.length < 2) {
    var __candidate = __rawExport({});
    if (typeof __candidate === 'function') return __candidate;
  }
  return __rawExport;
}({ exports: {} }, {}));
