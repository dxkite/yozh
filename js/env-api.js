
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
    [Symbol.iterator]() { return this._params[Symbol.iterator](); }
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
