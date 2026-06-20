package main

// webAPIPolyfill defines TextEncoder/TextDecoder, Headers, Request, Response in QJS global scope.
// Must run before the SSR bundle is evaluated.
const webAPIPolyfill = `
(function() {
  // ── TextEncoder / TextDecoder ──────────────────────────────────────────────
  if (!globalThis.TextEncoder) {
    globalThis.TextEncoder = class TextEncoder {
      get encoding() { return 'utf-8'; }
      encode(str) {
        str = String(str || '');
        var buf = [];
        for (var i = 0; i < str.length; ) {
          var c = str.codePointAt(i);
          if (c < 0x80) {
            buf.push(c); i += 1;
          } else if (c < 0x800) {
            buf.push(0xC0 | (c >> 6), 0x80 | (c & 0x3F)); i += 1;
          } else if (c < 0x10000) {
            buf.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F)); i += 1;
          } else {
            buf.push(0xF0 | (c >> 18), 0x80 | ((c >> 12) & 0x3F), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F)); i += 2;
          }
        }
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
        var bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf && buf.buffer ? buf.buffer : buf);
        var str = '';
        var i = 0;
        while (i < bytes.length) {
          var b = bytes[i++];
          var c;
          if (b < 0x80) { c = b; }
          else if ((b & 0xE0) === 0xC0) { c = ((b & 0x1F) << 6) | (bytes[i++] & 0x3F); }
          else if ((b & 0xF0) === 0xE0) { c = ((b & 0x0F) << 12) | ((bytes[i++] & 0x3F) << 6) | (bytes[i++] & 0x3F); }
          else { c = ((b & 0x07) << 18) | ((bytes[i++] & 0x3F) << 12) | ((bytes[i++] & 0x3F) << 6) | (bytes[i++] & 0x3F); }
          str += String.fromCodePoint(c);
        }
        return str;
      }
    };
  }

  // ── Headers ────────────────────────────────────────────────────────────────
  class Headers {
    constructor(init) {
      this._h = Object.create(null);
      if (init instanceof Headers) {
        init.forEach((v, k) => this.append(k, v));
      } else if (Array.isArray(init)) {
        for (var i = 0; i < init.length; i++) this.append(init[i][0], init[i][1]);
      } else if (init && typeof init === 'object') {
        for (var k in init) { if (Object.prototype.hasOwnProperty.call(init, k)) this.append(k, init[k]); }
      }
    }
    _key(n) { return String(n).toLowerCase(); }
    append(name, value) {
      var k = this._key(name);
      this._h[k] = this._h[k] !== undefined ? this._h[k] + ', ' + value : String(value);
    }
    set(name, value)   { this._h[this._key(name)] = String(value); }
    get(name)          { var v = this._h[this._key(name)]; return v !== undefined ? v : null; }
    has(name)          { return this._key(name) in this._h; }
    delete(name)       { delete this._h[this._key(name)]; }
    forEach(cb)        { var h = this._h; for (var k in h) cb(h[k], k, this); }
    entries()          { return Object.entries(this._h)[Symbol.iterator](); }
    keys()             { return Object.keys(this._h)[Symbol.iterator](); }
    values()           { return Object.values(this._h)[Symbol.iterator](); }
    getSetCookie() {
      var v = this._h['set-cookie'];
      return v ? v.split(', ') : [];
    }
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

// cryptoPolyfill provides crypto.randomUUID and crypto.getRandomValues.
// Depends on __cryptoRandomBytes (Go host function) being registered first.
// Must run before the SSR bundle to prevent astro/app/node's applyPolyfills()
// from overwriting globalThis.crypto with a broken Node.js shim.
const cryptoPolyfill = `
globalThis.crypto = {
  randomUUID: function() {
    var bytes = JSON.parse(__cryptoRandomBytes(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    var hex = bytes.map(function(x) { return x.toString(16).padStart(2, '0'); });
    return hex.slice(0,4).join('') + '-' +
           hex.slice(4,6).join('') + '-' +
           hex.slice(6,8).join('') + '-' +
           hex.slice(8,10).join('') + '-' +
           hex.slice(10,16).join('');
  },
  getRandomValues: function(arr) {
    var bytes = JSON.parse(__cryptoRandomBytes(arr.byteLength));
    var view = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
    for (var i = 0; i < bytes.length; i++) view[i] = bytes[i];
    return arr;
  },
  subtle: {},
};
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
  var _b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  globalThis.btoa = function(s) {
    s = String(s); var r = '', i = 0;
    while (i < s.length) {
      var a = s.charCodeAt(i++), b = s.charCodeAt(i++), c = s.charCodeAt(i++);
      r += _b64chars[a >> 2] + _b64chars[((a & 3) << 4) | (b >> 4)];
      r += isNaN(b) ? '=' : _b64chars[((b & 15) << 2) | (c >> 6)];
      r += isNaN(c) ? '=' : _b64chars[c & 63];
    }
    return r;
  };
  globalThis.atob = function(s) {
    s = String(s).replace(/=+$/, ''); var r = '', i = 0;
    while (i < s.length) {
      var a = _b64chars.indexOf(s[i++]), b = _b64chars.indexOf(s[i++]);
      var c = _b64chars.indexOf(s[i++]), d = _b64chars.indexOf(s[i++]);
      r += String.fromCharCode((a << 2) | (b >> 4));
      if (c !== -1 && c !== 64) r += String.fromCharCode(((b & 15) << 4) | (c >> 2));
      if (d !== -1 && d !== 64) r += String.fromCharCode(((c & 3) << 6) | d);
    }
    return r;
  };
}
if (!globalThis.navigator) { globalThis.navigator = { userAgent: 'Node.js', language: 'en', languages: ['en'], onLine: true }; }
if (!globalThis.location) { globalThis.location = { href: 'http://localhost/', hostname: 'localhost', origin: 'http://localhost', protocol: 'http:', pathname: '/', search: '', hash: '' }; }
if (!globalThis.URL) {
  globalThis.URL = class URL {
    constructor(input, base) {
      input = String(input);
      if (base) {
        var b = new URL(base);
        if (!/^[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(input)) {
          if (input[0] === '/') { input = b.protocol + '//' + b.host + input; }
          else { input = b.protocol + '//' + b.host + b.pathname.replace(/\/[^\/]*$/, '/') + input; }
        }
      }
      var m = input.match(/^([a-zA-Z][a-zA-Z0-9+\-.]*):\/\/([^/?#]*)([^?#]*)(\?[^#]*)?(#.*)?$/);
      if (!m) {
        // path-only or relative
        m = input.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
        this.protocol = 'http:'; this.host = 'localhost'; this.hostname = 'localhost'; this.port = '';
        this.pathname = m[1] || '/'; this.search = m[2] || ''; this.hash = m[3] || '';
      } else {
        this.protocol = m[1] + ':';
        this.host = m[2];
        var hp = m[2].split(':');
        this.hostname = hp[0]; this.port = hp[1] || '';
        this.pathname = m[3] || '/'; this.search = m[4] || ''; this.hash = m[5] || '';
      }
      this.origin = this.protocol + '//' + this.host;
      this.href = this.origin + this.pathname + this.search + this.hash;
      this.username = ''; this.password = '';
      this.searchParams = new URLSearchParams(this.search.slice(1));
    }
    toString() { return this.href; }
    toJSON() { return this.href; }
    static canParse(url, base) { try { new URL(url, base); return true; } catch(e) { return false; } }
  };
  globalThis.URLSearchParams = class URLSearchParams {
    constructor(init) {
      this._params = [];
      if (typeof init === 'string') {
        (init || '').split('&').filter(Boolean).forEach(function(p) {
          var i = p.indexOf('=');
          if (i >= 0) this._params.push([decodeURIComponent(p.slice(0,i)), decodeURIComponent(p.slice(i+1))]);
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
