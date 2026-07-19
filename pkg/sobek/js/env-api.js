
if (!globalThis.MessageChannel) {
  globalThis.MessagePort = function MessagePort() {
    this._listeners = Object.create(null);
    this._partner = null;
  };
  globalThis.MessagePort.prototype.postMessage = function(data) {
    var partner = this._partner;
    if (partner) {
      var listeners = partner._listeners['message'] || [];
      Promise.resolve().then(function() {
        for (var i = 0; i < listeners.length; i++) listeners[i]({ data: data });
      });
    }
  };
  globalThis.MessagePort.prototype.addEventListener = function(type, fn) {
    this._listeners[type] = this._listeners[type] || [];
    this._listeners[type].push(fn);
  };
  globalThis.MessagePort.prototype.removeEventListener = function(type, fn) {
    if (this._listeners[type]) this._listeners[type] = this._listeners[type].filter(function(l) { return l !== fn; });
  };
  Object.defineProperty(globalThis.MessagePort.prototype, 'onmessage', {
    set: function(fn) { this._listeners['message'] = fn ? [fn] : []; },
    get: function() { return (this._listeners['message'] || [])[0] || null; },
  });
  globalThis.MessagePort.prototype.start = function() {};
  globalThis.MessagePort.prototype.close = function() {};
  globalThis.MessageChannel = function MessageChannel() {
    var p1 = new globalThis.MessagePort();
    var p2 = new globalThis.MessagePort();
    p1._partner = p2;
    p2._partner = p1;
    this.port1 = p1;
    this.port2 = p2;
  };
}
if (!globalThis.WebAssembly) { globalThis.WebAssembly = { validate: function() { return false; }, instantiate: function() { return Promise.reject(new Error('WebAssembly not supported')); }, compile: function() { return Promise.reject(new Error('WebAssembly not supported')); } }; }
if (!globalThis.performance) { globalThis.performance = { now: function() { return Date.now(); }, timeOrigin: 0 }; }
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
    return __go_bufToB64(JSON.stringify(bytes));
  };
  globalThis.atob = function atob(s) {
    s = String(s).replace(/[\r\n\t ]/g, '');
    // Add standard padding if missing
    var r = s.length % 4;
    if (r === 2) s += '==';
    else if (r === 3) s += '=';
    var buf = __go_b64ToBuf(s);
    var u8 = new Uint8Array(buf);
    var result = '';
    for (var i = 0; i < u8.length; i++) result += String.fromCharCode(u8[i]);
    return result;
  };
}
if (!globalThis.navigator) { globalThis.navigator = { userAgent: 'Node.js', language: 'en', languages: ['en'], onLine: true }; }
if (!globalThis.AbortController) {
  globalThis.AbortSignal = class AbortSignal {
    constructor() {
      this.aborted = false;
      this.reason = undefined;
      this._listeners = [];
    }
    addEventListener(type, fn) { if (type === 'abort') this._listeners.push(fn); }
    removeEventListener(type, fn) { if (type === 'abort') this._listeners = this._listeners.filter(function(l) { return l !== fn; }); }
    throwIfAborted() { if (this.aborted) throw this.reason !== undefined ? this.reason : new DOMException('signal is aborted without reason', 'AbortError'); }
    static abort(reason) { var s = new AbortSignal(); s.aborted = true; s.reason = reason; return s; }
    static timeout(ms) { var s = new AbortSignal(); setTimeout(function() { s.aborted = true; s.reason = new DOMException('signal timed out', 'TimeoutError'); s._listeners.forEach(function(fn) { fn({ type: 'abort' }); }); }, ms); return s; }
  };
  globalThis.AbortController = class AbortController {
    constructor() { this.signal = new AbortSignal(); }
    abort(reason) {
      if (this.signal.aborted) return;
      this.signal.aborted = true;
      this.signal.reason = reason !== undefined ? reason : new DOMException('signal is aborted without reason', 'AbortError');
      var ls = this.signal._listeners.slice();
      for (var i = 0; i < ls.length; i++) ls[i]({ type: 'abort' });
    }
  };
  if (!globalThis.DOMException) {
    globalThis.DOMException = class DOMException extends Error {
      constructor(message, name) { super(message); this.name = name || 'DOMException'; }
    };
  }
}
if (!globalThis.location) { globalThis.location = { href: 'http://localhost/', hostname: 'localhost', origin: 'http://localhost', protocol: 'http:', pathname: '/', search: '', hash: '' }; }
if (!globalThis.URL) {
  // URL uses Go's net/url via __go_urlParse for WHATWG-compliant parsing (IPv6, credentials, percent-encoding)
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
    entries() { return this._params.map(function(p) { return [p[0], p[1]]; })[Symbol.iterator](); }
    keys() { return this._params.map(function(p) { return p[0]; })[Symbol.iterator](); }
    values() { return this._params.map(function(p) { return p[1]; })[Symbol.iterator](); }
    get size() { return this._params.length; }
    [Symbol.iterator]() { return this.entries(); }
  };
  globalThis.URL = class URL {
    constructor(input, base) {
      var r = JSON.parse(__go_urlParse(String(input), base != null ? String(base) : ''));
      if (r.error) throw new TypeError('Invalid URL: ' + r.error);
      this.protocol = r.protocol || 'http:';
      this.host = r.host || '';
      this.hostname = r.hostname || '';
      this.port = r.port || '';
      this.pathname = r.pathname || '/';
      this.hash = r.hash || '';
      this.origin = r.origin || '';
      this.href = r.href || '';
      this.username = r.username || '';
      this.password = r.password || '';
      // search and searchParams are kept in sync via a defineProperty setter.
      var _search = r.search || '';
      var _searchParams = new URLSearchParams(_search ? _search.slice(1) : '');
      Object.defineProperty(this, 'search', {
        get: function() { return _search; },
        set: function(v) {
          _search = v ? (v[0] === '?' ? v : '?' + v) : '';
          _searchParams = new URLSearchParams(_search ? _search.slice(1) : '');
        },
        enumerable: true, configurable: true,
      });
      Object.defineProperty(this, 'searchParams', {
        get: function() { return _searchParams; },
        enumerable: true, configurable: true,
      });
    }
    toString() { return this.href; }
    toJSON() { return this.href; }
    static canParse(u, b) { try { new URL(u, b); return true; } catch(e) { return false; } }
  };
}
