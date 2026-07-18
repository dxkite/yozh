(function() {
  // ── TextEncoder / TextDecoder ──────────────────────────────────────────────
  if (!globalThis.TextEncoder) {
    globalThis.TextEncoder = class TextEncoder {
      get encoding() { return 'utf-8'; }
      encode(str) {
        var buf = __go_textEncodeUTF8(String(str || ''));
        return new Uint8Array(buf);
      }
      encodeInto(str, dest) {
        var encoded = this.encode(str);
        if (encoded.length <= dest.length) {
          // All bytes fit — copy everything and report all chars consumed.
          for (var i = 0; i < encoded.length; i++) dest[i] = encoded[i];
          return { read: str.length, written: encoded.length };
        }
        // Partial fit — find the last complete UTF-8 sequence boundary at or before dest.length.
        // UTF-8 continuation bytes are 0x80–0xBF; back up past them to reach a sequence start.
        var boundary = dest.length;
        while (boundary > 0 && (encoded[boundary] & 0xC0) === 0x80) boundary--;
        for (var i = 0; i < boundary; i++) dest[i] = encoded[i];
        // Decode the written bytes to count how many JS chars (UTF-16 code units) were consumed.
        var written = boundary;
        var b64 = __go_bufToB64(JSON.stringify(Array.prototype.slice.call(encoded, 0, boundary)));
        var decoded = __go_textDecodeUTF8(b64);
        return { read: decoded.length, written: written };
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
        var b64 = __go_bufToB64(JSON.stringify(Array.prototype.slice.call(bytes)));
        return __go_textDecodeUTF8(b64);
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
      // Set-Cookie must NOT be comma-joined (RFC 6265 §3). Return the first value only.
      // Use getSetCookie() to retrieve all Set-Cookie headers as an array.
      if (k === 'set-cookie') return this._cookies.length ? this._cookies[0] : null;
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

  // ── drainChunks ────────────────────────────────────────────────────────────
  // Collects all chunks from a stream reader or async iterator into a string.
  //
  // Fast paths (in order of preference):
  //  1. String chunks → strParts.push(chunk), then join('') at the end.
  //  2. Uint8Array chunks → pass underlying ArrayBuffer to Go's
  //     __go_arrayBufToStr(), which does a single []byte→string conversion
  //     with no JSON serialization overhead.
  //
  // Slow path (only for mixed-mode, should not occur with Astro):
  //  Accumulate bytes in a JS array and use __go_textDecodeUTF8(__go_bufToB64).
  async function drainChunks(iter, mode) {
    var strParts = []; // string chunks accumulated here
    var binParts = []; // Uint8Array chunks accumulated here (binary-only mode)
    var mixed = false; // true only if we see both string and binary chunks

    function toU8(c) {
      return (c instanceof Uint8Array) ? c
        : new Uint8Array(c.buffer || c, c.byteOffset || 0, c.byteLength);
    }

    function next() {
      return mode === 'stream' ? iter.read() : iter.next();
    }

    while (true) {
      var r = await next();
      if (r.done) break;
      var c = r.value;
      if (typeof c === 'string') {
        if (binParts.length > 0) mixed = true;
        strParts.push(c);
      } else {
        if (strParts.length > 0) mixed = true;
        binParts.push(toU8(c));
      }
    }

    if (!mixed) {
      // Pure string path: zero overhead
      if (binParts.length === 0) return strParts.join('');
      // Pure binary path: one Go call per chunk, then join
      var decoded = [];
      for (var i = 0; i < binParts.length; i++) {
        var u8 = binParts[i];
        // Pass the underlying ArrayBuffer to Go — the host binding marshals ArrayBuffer
        // to []byte, which Go converts to a UTF-8 string directly without JSON round-trip.
        var buf = (u8.byteOffset === 0 && u8.byteLength === u8.buffer.byteLength)
          ? u8.buffer
          : u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
        decoded.push(__go_arrayBufToStr(buf));
      }
      return decoded.join('');
    }

    // Mixed string+binary: slow legacy path
    var allBytes = [];
    for (var i = 0; i < strParts.length; i++) {
      var enc = new TextEncoder().encode(strParts[i]);
      for (var j = 0; j < enc.length; j++) allBytes.push(enc[j]);
    }
    for (var i = 0; i < binParts.length; i++) {
      var u8 = binParts[i];
      for (var j = 0; j < u8.length; j++) allBytes.push(u8[j]);
    }
    if (allBytes.length === 0) return '';
    return __go_textDecodeUTF8(__go_bufToB64(JSON.stringify(allBytes)));
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
      // ReadableStream bodies — drain via getReader().
      if (b && typeof b === 'object' && typeof b.getReader === 'function') {
        var reader = b.getReader();
        return drainChunks(reader, 'stream');
      }
      // AsyncIterable bodies (Astro renderToAsyncIterable).
      if (b && typeof b === 'object' && b[Symbol.asyncIterator] != null) {
        return drainChunks(b[Symbol.asyncIterator](), 'iter');
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

  // ── setImmediate / clearImmediate ──────────────────────────────────────────
  // react-dom-server.node uses setImmediate(fn) to schedule async rendering
  // work. This runtime doesn't provide it natively — emulate via Promise microtask.
  if (!globalThis.setImmediate) {
    globalThis.setImmediate = function(fn) {
      var args = Array.prototype.slice.call(arguments, 1);
      Promise.resolve().then(function() { fn.apply(null, args); });
      return 0;
    };
    globalThis.clearImmediate = function() {};
  }

  // ── Buffer ─────────────────────────────────────────────────────────────────
  // react-dom-server.node uses Buffer.byteLength(str,'utf8') to measure chunk
  // sizes, and Buffer.from() for encoding. Provide a minimal global shim so
  // react-dom can run without requiring the Node.js Buffer module globally.
  if (!globalThis.Buffer) {
    globalThis.Buffer = {
      byteLength: function(str, enc) {
        if (typeof str === 'string') return new TextEncoder().encode(str).byteLength;
        if (str && str.byteLength !== undefined) return str.byteLength;
        return str ? (str.length || 0) : 0;
      },
      from: function(data, enc) {
        if (typeof data === 'string') return new TextEncoder().encode(data);
        return new Uint8Array(data);
      },
      alloc: function(n) { return new Uint8Array(n); },
      isBuffer: function(v) { return false; },
      concat: function(bufs) {
        var total = 0;
        for (var i = 0; i < bufs.length; i++) total += bufs[i].length;
        var out = new Uint8Array(total);
        var off = 0;
        for (var i = 0; i < bufs.length; i++) { out.set(bufs[i], off); off += bufs[i].length; }
        return out;
      }
    };
  }

  // ── ReadableStream ──────────────────────────────────────────────────────────
  // react-dom's renderToReadableStream creates a ReadableStream to stream HTML.
  // Provide a minimal WHATWG-compatible implementation with push queue + pull
  // callbacks so react-dom can enqueue chunks asynchronously while our
  // Response.text() reader drains them via reader.read().
  if (!globalThis.ReadableStream) {
    globalThis.ReadableStream = (function() {
      function ReadableStream(underlyingSource) {
        var self = this;
        self._queue   = [];
        self._done    = false;
        self._error   = null;
        self._waiters = [];
        self._source  = underlyingSource || {};

        var ctrl = {
          enqueue: function(chunk) {
            if (self._waiters.length > 0) {
              var w = self._waiters.shift();
              w.resolve({ value: chunk, done: false });
            } else {
              self._queue.push(chunk);
            }
          },
          close: function() {
            self._done = true;
            while (self._waiters.length > 0) {
              var w = self._waiters.shift();
              w.resolve({ value: undefined, done: true });
            }
          },
          error: function(e) {
            self._error = e;
            while (self._waiters.length > 0) {
              var w = self._waiters.shift();
              w.reject(e);
            }
          },
          get desiredSize() { return self._queue.length === 0 ? 1 : 0; }
        };
        self._controller = ctrl;

        if (typeof self._source.start === 'function') {
          try {
            var r = self._source.start(ctrl);
            if (r && typeof r.then === 'function') r.catch(function(e) { ctrl.error(e); });
          } catch(e) { ctrl.error(e); }
        }
      }

      ReadableStream.prototype.getReader = function() {
        var self = this;
        var pullPending = false;

        // PERF: pull() is deferred via Promise.resolve().then() to match the Streams
        // spec microtask timing. Each read() on an empty queue costs one extra
        // event-loop cycle here. For Astro's bufferHeadContent (react-dom
        // renderToReadableStream), this adds ~10ms total across all chunks — minor
        // compared to the ~2.6s React rendering cost, so left as-is.
        function schedulePull() {
          if (pullPending || typeof self._source.pull !== 'function') return;
          if (self._queue.length > 0 || self._done || self._error) return;
          pullPending = true;
          Promise.resolve().then(function() {
            pullPending = false;
            if (self._queue.length === 0 && !self._done && !self._error) {
              try {
                var r = self._source.pull(self._controller);
                if (r && typeof r.then === 'function') r.catch(function(e) { self._controller.error(e); });
              } catch(e) { self._controller.error(e); }
            }
          });
        }

        return {
          read: function() {
            if (self._error) return Promise.reject(self._error);
            if (self._queue.length > 0) return Promise.resolve({ value: self._queue.shift(), done: false });
            if (self._done) return Promise.resolve({ value: undefined, done: true });
            schedulePull();
            return new Promise(function(resolve, reject) {
              self._waiters.push({ resolve: resolve, reject: reject });
            });
          },
          releaseLock: function() {},
          cancel: function(reason) {
            if (typeof self._source.cancel === 'function') {
              try { self._source.cancel(reason); } catch(e) {}
            }
            return Promise.resolve();
          }
        };
      };

      ReadableStream.prototype[Symbol.asyncIterator] = function() {
        var reader = this.getReader();
        return {
          next: function() { return reader.read(); },
          return: function() { reader.releaseLock(); return Promise.resolve({ value: undefined, done: true }); }
        };
      };

      ReadableStream.from = function(iterable) {
        if (iterable && typeof iterable[Symbol.asyncIterator] === 'function') {
          var iter = iterable[Symbol.asyncIterator]();
          return new ReadableStream({
            pull: function(controller) {
              return iter.next().then(function(result) {
                if (result.done) controller.close();
                else controller.enqueue(result.value);
              });
            }
          });
        }
        return new ReadableStream({ start: function(c) { c.close(); } });
      };

      return ReadableStream;
    })();
  }
})();
