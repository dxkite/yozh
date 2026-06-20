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
