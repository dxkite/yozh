package main

// webAPIPolyfill defines TextEncoder/TextDecoder, Headers, Request, Response in QJS global scope.
// Must run before the SSR bundle is evaluated.
// TextEncoder/TextDecoder delegate to Go host functions (__textEncodeUTF8, __bufToB64, __textDecodeUTF8)
// for correct, efficient UTF-8 handling. Headers stores Set-Cookie in a separate array to avoid
// the `, ` join/split bug that corrupts cookie values containing commas.
const webAPIPolyfill = `
(function() {
  // ── TextEncoder / TextDecoder ──────────────────────────────────────────────
  if (!globalThis.TextEncoder) {
    globalThis.TextEncoder = class TextEncoder {
      get encoding() { return 'utf-8'; }
      encode(str) {
        var buf = __textEncodeUTF8(String(str || ''));
        return new Uint8Array(buf);
      }
      encodeInto(str, dest) {
        var encoded = this.encode(str);
        var n = Math.min(encoded.length, dest.length);
        for (var i = 0; i < n; i++) dest[i] = encoded[i];
        return { read: str.length, written: n };
      }
    };
  }
  if (!globalThis.TextDecoder) {
    globalThis.TextDecoder = class TextDecoder {
      constructor(encoding, opts) { this.encoding = encoding || 'utf-8'; this.fatal = !!(opts && opts.fatal); }
      decode(buf) {
        if (!buf) return '';
        var bytes;
        if (buf instanceof Uint8Array) {
          bytes = buf;
        } else if (buf && buf.buffer instanceof ArrayBuffer) {
          bytes = new Uint8Array(buf.buffer, buf.byteOffset || 0, buf.byteLength);
        } else {
          bytes = new Uint8Array(buf);
        }
        if (bytes.length === 0) return '';
        var b64 = __bufToB64(JSON.stringify(Array.prototype.slice.call(bytes)));
        return __textDecodeUTF8(b64);
      }
    };
  }

  // ── Headers ────────────────────────────────────────────────────────────────
  // Set-Cookie stored separately in _cookies[] to avoid comma-join/split corruption.
  class Headers {
    constructor(init) {
      this._h = Object.create(null);
      this._cookies = [];
      if (init instanceof Headers) {
        init.forEach(function(v, k) { this.append(k, v); }, this);
      } else if (Array.isArray(init)) {
        for (var i = 0; i < init.length; i++) this.append(init[i][0], init[i][1]);
      } else if (init && typeof init === 'object') {
        for (var k in init) { if (Object.prototype.hasOwnProperty.call(init, k)) this.append(k, init[k]); }
      }
    }
    _key(n) { return String(n).toLowerCase(); }
    append(name, value) {
      var k = this._key(name);
      if (k === 'set-cookie') { this._cookies.push(String(value)); return; }
      this._h[k] = this._h[k] !== undefined ? this._h[k] + ', ' + value : String(value);
    }
    set(name, value) {
      var k = this._key(name);
      if (k === 'set-cookie') { this._cookies = [String(value)]; return; }
      this._h[k] = String(value);
    }
    get(name) {
      var k = this._key(name);
      if (k === 'set-cookie') return this._cookies.length ? this._cookies.join(', ') : null;
      var v = this._h[k]; return v !== undefined ? v : null;
    }
    has(name) {
      var k = this._key(name);
      if (k === 'set-cookie') return this._cookies.length > 0;
      return k in this._h;
    }
    delete(name) {
      var k = this._key(name);
      if (k === 'set-cookie') { this._cookies = []; return; }
      delete this._h[k];
    }
    forEach(cb, thisArg) {
      var h = this._h;
      for (var k in h) cb.call(thisArg, h[k], k, this);
      for (var i = 0; i < this._cookies.length; i++) cb.call(thisArg, this._cookies[i], 'set-cookie', this);
    }
    entries() {
      var arr = [];
      var h = this._h;
      for (var k in h) arr.push([k, h[k]]);
      for (var i = 0; i < this._cookies.length; i++) arr.push(['set-cookie', this._cookies[i]]);
      return arr[Symbol.iterator]();
    }
    keys() {
      var arr = [];
      var h = this._h;
      for (var k in h) arr.push(k);
      for (var i = 0; i < this._cookies.length; i++) arr.push('set-cookie');
      return arr[Symbol.iterator]();
    }
    values() {
      var arr = [];
      var h = this._h;
      for (var k in h) arr.push(h[k]);
      for (var i = 0; i < this._cookies.length; i++) arr.push(this._cookies[i]);
      return arr[Symbol.iterator]();
    }
    getSetCookie() { return this._cookies.slice(); }
    [Symbol.iterator]() { return this.entries(); }
  }

  // ── Request ─────────────────────────────────────────────────────────────────
  class Request {
    constructor(input, init) {
      init = init || {};
      var src = (typeof input !== 'string') ? input : null;
      this.url     = typeof input === 'string' ? input : input.url;
      this.method  = ((init.method) || (src && src.method) || 'GET').toUpperCase();
      this.headers = new Headers(init.headers || (src && src.headers) || {});
      this._body   = (init.body !== undefined) ? init.body : (src ? src._body : null);
      this.bodyUsed = false;
    }
    async text()  { this.bodyUsed = true; return this._body != null ? String(this._body) : ''; }
    async json()  { return JSON.parse(await this.text()); }
    async arrayBuffer() {
      var b = new TextEncoder().encode(await this.text());
      return b.buffer;
    }
    clone() { return new Request(this); }
  }

  // ── Response ─────────────────────────────────────────────────────────────────
  class Response {
    constructor(body, init) {
      init = init || {};
      this.status     = init.status !== undefined ? Number(init.status) : 200;
      this.statusText = init.statusText || '';
      this.headers    = new Headers(init.headers || {});
      this._body      = body !== undefined ? body : null;
      this.ok         = this.status >= 200 && this.status < 300;
      this.bodyUsed   = false;
      this.type       = 'default';
      this.url        = '';
      this.redirected = false;
    }
    async text() {
      this.bodyUsed = true;
      var b = this._body;
      if (b == null) return '';
      // ReadableStream bodies (streaming=true, !isNode path)
      if (b && typeof b === 'object' && typeof b.getReader === 'function') {
        var reader = b.getReader();
        var dec = new TextDecoder();
        var chunks = [];
        while (true) {
          var result = await reader.read();
          if (result.done) break;
          chunks.push(typeof result.value === 'string' ? result.value : dec.decode(result.value, { stream: true }));
        }
        return chunks.join('');
      }
      // AsyncIterable bodies (Astro renderToAsyncIterable, used when isNode=true)
      if (b && typeof b === 'object' && b[Symbol.asyncIterator] != null) {
        var dec2 = new TextDecoder();
        var parts = [];
        for await (var chunk of b) {
          if (chunk instanceof Uint8Array || ArrayBuffer.isView(chunk)) {
            parts.push(dec2.decode(chunk, { stream: true }));
          } else {
            parts.push(String(chunk));
          }
        }
        return parts.join('');
      }
      return String(b);
    }
    async json()  { return JSON.parse(await this.text()); }
    async arrayBuffer() {
      var b = new TextEncoder().encode(await this.text());
      return b.buffer;
    }
    clone() {
      return new Response(this._body, {
        status: this.status, statusText: this.statusText, headers: this.headers,
      });
    }
    static json(data, init) {
      var h = new Headers((init || {}).headers || {});
      h.set('content-type', 'application/json');
      return new Response(JSON.stringify(data), Object.assign({}, init || {}, { headers: h }));
    }
    static redirect(url, status) {
      return new Response(null, { status: status || 302, headers: { location: String(url) } });
    }
    static error() {
      var r = new Response(null, { status: 0 });
      r.type = 'error';
      return r;
    }
  }

  globalThis.Headers  = Headers;
  globalThis.Request  = Request;
  globalThis.Response = Response;
})();
`

// cryptoPolyfill provides the full crypto API: randomUUID, getRandomValues, and crypto.subtle.
// Depends on __cryptoRandomBytes, __bufToB64, __b64ToBuf host functions.
// Must run before the SSR bundle to prevent astro/app/node's applyPolyfills() from
// overwriting globalThis.crypto with a broken Node.js shim.
// crypto.subtle delegates all cryptographic operations to Go via __cryptoSubtle* host functions.
const cryptoPolyfill = `
(function() {
  // ── Binary transfer helpers ───────────────────────────────────────────────
  // _toB64: convert Uint8Array / ArrayBuffer → base64 string (via Go __bufToB64)
  function _toB64(buf) {
    if (!buf) return '';
    var bytes;
    if (buf instanceof Uint8Array) {
      bytes = buf;
    } else if (buf instanceof ArrayBuffer) {
      bytes = new Uint8Array(buf);
    } else if (buf && buf.buffer instanceof ArrayBuffer) {
      bytes = new Uint8Array(buf.buffer, buf.byteOffset || 0, buf.byteLength);
    } else {
      try { bytes = new Uint8Array(buf); } catch(e) { return ''; }
    }
    return __bufToB64(JSON.stringify(Array.prototype.slice.call(bytes)));
  }
  // _fromB64: decode base64 string → ArrayBuffer (via Go __b64ToBuf)
  function _fromB64(b64) { return __b64ToBuf(b64); }

  // _makeKey: create a JS CryptoKey-like object backed by a Go key registry ID
  function _makeKey(id, type, algorithm, extractable, usages) {
    return { __id: id, type: type, algorithm: algorithm, extractable: extractable, usages: usages };
  }

  // _algoToJSON: serialize algorithm to JSON, converting any binary iv fields to base64
  function _algoToJSON(algorithm) {
    if (typeof algorithm === 'string') return JSON.stringify({name: algorithm});
    var a = {name: algorithm.name};
    if (algorithm.hash !== undefined) {
      a.hash = typeof algorithm.hash === 'string' ? algorithm.hash : algorithm.hash.name;
    }
    if (algorithm.length !== undefined) a.length = algorithm.length;
    if (algorithm.iv !== undefined) a.iv = _toB64(algorithm.iv);
    if (algorithm.tagLength !== undefined) a.tagLength = algorithm.tagLength;
    if (algorithm.namedCurve !== undefined) a.namedCurve = algorithm.namedCurve;
    if (algorithm.label !== undefined) a.label = _toB64(algorithm.label);
    return JSON.stringify(a);
  }

  // ── crypto.subtle ─────────────────────────────────────────────────────────
  var subtle = {
    digest: async function(algorithm, data) {
      var algo = typeof algorithm === 'string' ? algorithm : algorithm.name;
      var res = __cryptoSubtleDigest(algo, _toB64(data));
      if (res.slice(0,6) === 'ERROR:') throw new DOMException(res.slice(6), 'OperationError');
      return _fromB64(res);
    },
    importKey: async function(format, keyData, algorithm, extractable, usages) {
      var algoJ = _algoToJSON(algorithm);
      var data = (format === 'jwk') ? JSON.stringify(keyData) : _toB64(keyData);
      var id = __cryptoSubtleImportKey(format, data, algoJ, String(extractable), JSON.stringify(usages));
      if (id.slice(0,6) === 'ERROR:') throw new DOMException(id.slice(6), 'DataError');
      var algoObj = typeof algorithm === 'string' ? {name: algorithm} : algorithm;
      return _makeKey(id, 'secret', algoObj, extractable, usages);
    },
    generateKey: async function(algorithm, extractable, usages) {
      var algoJ = _algoToJSON(algorithm);
      var res = __cryptoSubtleGenerateKey(algoJ, String(extractable), JSON.stringify(usages));
      if (res.slice(0,6) === 'ERROR:') throw new DOMException(res.slice(6), 'OperationError');
      var algoObj = typeof algorithm === 'string' ? {name: algorithm} : algorithm;
      // Asymmetric key pairs return JSON {priv:"id",pub:"id"}; symmetric returns a plain key ID
      try {
        var kp = JSON.parse(res);
        if (kp.priv && kp.pub) {
          return {
            privateKey: _makeKey(kp.priv, 'private', algoObj, extractable, usages),
            publicKey:  _makeKey(kp.pub,  'public',  algoObj, extractable, usages),
          };
        }
      } catch(e) {}
      return _makeKey(res, 'secret', algoObj, extractable, usages);
    },
    exportKey: async function(format, key) {
      var res = __cryptoSubtleExportKey(format, key.__id);
      if (res.slice(0,6) === 'ERROR:') throw new DOMException(res.slice(6), 'InvalidAccessError');
      if (format === 'jwk') return JSON.parse(res);
      return _fromB64(res);
    },
    sign: async function(algorithm, key, data) {
      var res = __cryptoSubtleSign(_algoToJSON(algorithm), key.__id, _toB64(data));
      if (res.slice(0,6) === 'ERROR:') throw new DOMException(res.slice(6), 'OperationError');
      return _fromB64(res);
    },
    verify: async function(algorithm, key, signature, data) {
      var res = __cryptoSubtleVerify(_algoToJSON(algorithm), key.__id, _toB64(signature), _toB64(data));
      return res === 'true';
    },
    encrypt: async function(algorithm, key, data) {
      var res = __cryptoSubtleEncrypt(_algoToJSON(algorithm), key.__id, _toB64(data));
      if (res.slice(0,6) === 'ERROR:') throw new DOMException(res.slice(6), 'OperationError');
      return _fromB64(res);
    },
    decrypt: async function(algorithm, key, data) {
      var res = __cryptoSubtleDecrypt(_algoToJSON(algorithm), key.__id, _toB64(data));
      if (res.slice(0,6) === 'ERROR:') throw new DOMException(res.slice(6), 'OperationError');
      return _fromB64(res);
    },
    deriveBits: async function(algorithm, key, length) {
      var res = __cryptoSubtleDeriveBits(_algoToJSON(algorithm), key.__id, String(length));
      if (res.slice(0,6) === 'ERROR:') throw new DOMException(res.slice(6), 'OperationError');
      return _fromB64(res);
    },
    deriveKey: async function(algorithm, baseKey, derivedAlgo, extractable, usages) {
      var bitLen = derivedAlgo.length || (derivedAlgo.name === 'AES-GCM' || derivedAlgo.name === 'AES-CBC' ? 256 : 128);
      var bits = await this.deriveBits(algorithm, baseKey, bitLen);
      return this.importKey('raw', bits, derivedAlgo, extractable, usages);
    },
    wrapKey:   async function() { throw new DOMException('Not implemented', 'NotSupportedError'); },
    unwrapKey: async function() { throw new DOMException('Not implemented', 'NotSupportedError'); },
  };

  globalThis.crypto = {
    randomUUID: function() {
      var bytes = new Uint8Array(__cryptoRandomBytes(16));
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      var hex = Array.prototype.map.call(bytes, function(x) { return x.toString(16).padStart(2, '0'); });
      return hex.slice(0,4).join('') + '-' +
             hex.slice(4,6).join('') + '-' +
             hex.slice(6,8).join('') + '-' +
             hex.slice(8,10).join('') + '-' +
             hex.slice(10,16).join('');
    },
    getRandomValues: function(arr) {
      var bytes = new Uint8Array(__cryptoRandomBytes(arr.byteLength));
      var view = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
      for (var i = 0; i < bytes.length; i++) view[i] = bytes[i];
      return arr;
    },
    subtle: subtle,
  };
})();
`

// filePolyfill stubs globalThis.File if absent.
// QuickJS has no built-in Blob, so File is defined as a plain class (not extending Blob).
// This is sufficient for astro/app/node's applyPolyfills() existence check.
const filePolyfill = `
if (!globalThis.Blob) {
  globalThis.Blob = class Blob {
    constructor(parts, opts) {
      this._parts = parts || [];
      this.type = (opts && opts.type) || '';
      this.size = (parts || []).reduce(function(n, p) {
        return n + (typeof p === 'string' ? p.length : (p.byteLength || 0));
      }, 0);
    }
    async text() { return this._parts.map(function(p) { return String(p); }).join(''); }
    async arrayBuffer() { return new TextEncoder().encode(await this.text()).buffer; }
  };
}
if (!globalThis.File) {
  globalThis.File = class File extends globalThis.Blob {
    constructor(parts, name, opts) {
      super(parts, opts || {});
      this.name = name || '';
      this.lastModified = (opts && opts.lastModified) || 0;
    }
  };
}
`

// envAPIStub stubs missing browser/Node globals that Astro checks at module init time.
const envAPIStub = `
if (!globalThis.WebAssembly) { globalThis.WebAssembly = { validate: function() { return false; }, instantiate: function() { return Promise.reject(new Error('WebAssembly not supported')); }, compile: function() { return Promise.reject(new Error('WebAssembly not supported')); } }; }
if (!globalThis.performance) { globalThis.performance = { now: function() { return Date.now(); }, timeOrigin: 0 }; }
// setTimeout/clearTimeout — QJS has no native event loop timer.
// We implement a minimal version using Promise microtasks for delay=0 (most common in SSR).
if (!globalThis.setTimeout) {
  var __timerMap = Object.create(null);
  var __timerId = 1;
  globalThis.setTimeout = function setTimeout(fn, delay) {
    var id = __timerId++;
    if (!delay) {
      Promise.resolve().then(function() { if (__timerMap[id] !== false) { delete __timerMap[id]; if (typeof fn === 'function') fn(); } });
    }
    __timerMap[id] = true;
    return id;
  };
  globalThis.clearTimeout = function clearTimeout(id) { __timerMap[id] = false; };
  globalThis.setInterval = function setInterval() { return 0; };
  globalThis.clearInterval = function clearInterval() {};
}
if (!globalThis.queueMicrotask) {
  globalThis.queueMicrotask = function queueMicrotask(fn) { Promise.resolve().then(fn); };
}
if (!globalThis.atob) {
  // Use Go's encoding/base64 via host functions for correct padding and error handling
  globalThis.btoa = function btoa(s) {
    var bytes = [];
    s = String(s);
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c > 0xFF) throw new Error("btoa: character out of range");
      bytes.push(c);
    }
    return __bufToB64(JSON.stringify(bytes));
  };
  globalThis.atob = function atob(s) {
    s = String(s).replace(/[\r\n\t ]/g, '');
    // Add standard padding if missing
    var r = s.length % 4;
    if (r === 2) s += '==';
    else if (r === 3) s += '=';
    var buf = __b64ToBuf(s);
    var u8 = new Uint8Array(buf);
    var result = '';
    for (var i = 0; i < u8.length; i++) result += String.fromCharCode(u8[i]);
    return result;
  };
}
if (!globalThis.navigator) { globalThis.navigator = { userAgent: 'Node.js', language: 'en', languages: ['en'], onLine: true }; }
if (!globalThis.location) { globalThis.location = { href: 'http://localhost/', hostname: 'localhost', origin: 'http://localhost', protocol: 'http:', pathname: '/', search: '', hash: '' }; }
if (!globalThis.URL) {
  // URL uses Go's net/url via __urlParse for WHATWG-compliant parsing (IPv6, credentials, percent-encoding)
  globalThis.URLSearchParams = class URLSearchParams {
    constructor(init) {
      this._params = [];
      if (typeof init === 'string') {
        (init || '').split('&').filter(Boolean).forEach(function(p) {
          var i = p.indexOf('=');
          if (i >= 0) this._params.push([decodeURIComponent(p.slice(0,i).replace(/\+/g,' ')), decodeURIComponent(p.slice(i+1).replace(/\+/g,' '))]);
          else this._params.push([decodeURIComponent(p), '']);
        }, this);
      }
    }
    get(k) { var p = this._params.find(function(p) { return p[0] === k; }); return p ? p[1] : null; }
    getAll(k) { return this._params.filter(function(p) { return p[0] === k; }).map(function(p) { return p[1]; }); }
    has(k) { return this._params.some(function(p) { return p[0] === k; }); }
    set(k, v) { var i = this._params.findIndex(function(p) { return p[0] === k; }); if (i >= 0) this._params[i][1] = String(v); else this._params.push([k, String(v)]); }
    append(k, v) { this._params.push([k, String(v)]); }
    delete(k) { this._params = this._params.filter(function(p) { return p[0] !== k; }); }
    toString() { return this._params.map(function(p) { return encodeURIComponent(p[0]) + '=' + encodeURIComponent(p[1]); }).join('&'); }
    forEach(cb) { this._params.forEach(function(p) { cb(p[1], p[0]); }); }
    [Symbol.iterator]() { return this._params[Symbol.iterator](); }
  };
  globalThis.URL = class URL {
    constructor(input, base) {
      var r = JSON.parse(__urlParse(String(input), base != null ? String(base) : ''));
      if (r.error) throw new TypeError('Invalid URL: ' + r.error);
      this.protocol = r.protocol || 'http:';
      this.host = r.host || '';
      this.hostname = r.hostname || '';
      this.port = r.port || '';
      this.pathname = r.pathname || '/';
      this.search = r.search || '';
      this.hash = r.hash || '';
      this.origin = r.origin || '';
      this.href = r.href || '';
      this.username = r.username || '';
      this.password = r.password || '';
      this.searchParams = new URLSearchParams(this.search ? this.search.slice(1) : '');
    }
    toString() { return this.href; }
    toJSON() { return this.href; }
    static canParse(u, b) { try { new URL(u, b); return true; } catch(e) { return false; } }
  };
}
`

// intlStub provides a minimal Intl object so bundle initialization doesn't crash.
// QuickJS-NG lacks the Internationalization API.
const intlStub = `
if (!globalThis.Intl) {
  globalThis.Intl = {
    DateTimeFormat: function(locale, opts) {
      return {
        format: function(d) { return (d instanceof Date ? d : new Date(d)).toISOString(); },
        formatToParts: function(d) { return []; },
        resolvedOptions: function() { return { locale: locale || 'en', timeZone: 'UTC' }; },
      };
    },
    NumberFormat: function(locale, opts) {
      return {
        format: function(n) { return String(n); },
        formatToParts: function(n) { return []; },
        resolvedOptions: function() { return { locale: locale || 'en' }; },
      };
    },
    Collator: function(locale, opts) {
      return {
        compare: function(a, b) { return a < b ? -1 : a > b ? 1 : 0; },
        resolvedOptions: function() { return { locale: locale || 'en' }; },
      };
    },
    getCanonicalLocales: function(l) { return Array.isArray(l) ? l : [l]; },
    supportedValuesOf: function(k) { return []; },
  };
}
`

// structuredCloneGuard ensures structuredClone exists.
// QuickJS-NG has it built-in; this is a fallback.
const structuredCloneGuard = `
if (!globalThis.structuredClone) {
  globalThis.structuredClone = function(v) {
    return JSON.parse(JSON.stringify(v));
  };
}
`

// consoleDef defines globalThis.console via the __consoleWrite host function.
// Must run after __consoleWrite is registered.
const consoleDef = `
globalThis.console = (function() {
  function fmtArg(a) {
    if (a === null) return 'null';
    if (a === undefined) return 'undefined';
    if (typeof a !== 'object') return String(a);
    // Error: include message + stack so they aren't silently swallowed by JSON.stringify
    if (a instanceof Error || (a && typeof a.message === 'string' && typeof a.stack === 'string')) {
      var s = a.name ? a.name + ': ' : '';
      if (a.message) s += a.message;
      if (a.stack) s += '\n' + a.stack;
      return s;
    }
    try { return JSON.stringify(a); } catch(e2) { return String(a); }
  }
  function write(level) {
    return function() {
      var parts = [];
      for (var i = 0; i < arguments.length; i++) parts.push(fmtArg(arguments[i]));
      __consoleWrite(level, parts.join(' '));
    };
  }
  return {
    log:   write('log'),
    info:  write('info'),
    warn:  write('warn'),
    error: write('error'),
    debug: write('debug'),
  };
})();
`

// fetchDef defines globalThis.fetch via the async __goFetchRaw host function.
// Must run after __goFetchRaw is registered and after Response/Headers are defined.
const fetchDef = `
globalThis.fetch = async function fetch(input, init) {
  init = init || {};
  var url = typeof input === 'string' ? input : input.url;
  var method = (init.method || 'GET').toUpperCase();
  var reqHeaders = {};
  if (init.headers) {
    var h = new Headers(init.headers);
    h.forEach(function(v, k) { reqHeaders[k] = v; });
  }
  var body = init.body || null;
  var resultJSON = await __goFetchRaw(url, method, JSON.stringify(reqHeaders), body);
  var result = JSON.parse(resultJSON);
  return new Response(result.body, {
    status: result.status,
    headers: new Headers(result.headers || []),
  });
};
`
