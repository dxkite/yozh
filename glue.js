// glue.js — Go ↔ QJS bridge.
//
// Defines globalThis.__handleRequest(requestJSON: string): Promise<string>
//
// requestJSON shape:
//   { method, url, headers: [[k,v],...], body: string|null,
//     context: { ip, requestId, geo, site, deploy, account, server } }
//
// Returns Promise<string> where the string is JSON:
//   { status: number, headers: [[k,v],...], body: string }
//
// Depends on: Headers, Request, Response (webAPIPolyfill), __ssrHandler (bundle).
(function () {
  'use strict';

  function buildNetlifyContext(c) {
    c = c || {};
    return {
      ip:        c.ip        || '127.0.0.1',
      requestId: c.requestId || 'mock-request-id',
      geo: c.geo || {
        city:        'Mock City',
        country:     { code: 'US', name: 'United States' },
        subdivision: { code: 'CA', name: 'California' },
        timezone:    'America/Los_Angeles',
        longitude:   -122.41,
        latitude:    37.77,
      },
      site:    c.site    || { id: 'mock-site-id',    name: 'localhost', url: 'http://localhost' },
      deploy:  c.deploy  || { id: 'mock-deploy-id' },
      account: c.account || { id: 'mock-account-id' },
      server:  c.server  || { region: 'local' },
      flags:   undefined,
      json: function (data) { return Response.json(data); },
      log: function () {
        var args = Array.prototype.slice.call(arguments);
        console.log.apply(console, args);
      },
      next: function () {
        throw new Error('context.next() is not available in serverless functions');
      },
      get cookies() {
        throw new Error('Use Astro.cookies instead of context.cookies');
      },
      get params() {
        throw new Error('context.params is not available in serverless functions');
      },
      rewrite: function () {
        throw new Error('context.rewrite() is not available in serverless functions');
      },
    };
  }

  // Pure-JS trace: no Go roundtrip per checkpoint.
  // _tstart(name) → opaque span handle; _tend(handle) → finalizes and records the span.
  // All spans are serialized to JSON and passed to Go in one call via __go_storeResponseBody.
  var _spans = [];
  var _enc = new TextEncoder(); // stateless — safe to reuse across requests
  function _tstart(name) { return { name: name, s: Date.now() }; }
  function _tend(sp) { sp.e = Date.now(); _spans.push(sp); }

  globalThis.__handleRequest = async function __handleRequest(requestData) {
    _spans = []; // reset per request (var is IIFE-scoped, not function-scoped)
    var _t = _tstart('parse-request');
    var d = requestData; // already an object — Go passes JSON literal directly
    _tend(_t);

    // Build Web Fetch API Request from the serialized payload
    _t = _tstart('build-request');
    var request = new Request(d.url, {
      method:  d.method || 'GET',
      headers: new Headers(d.headers || []),
      // Only pass body for methods that allow it
      body: (d.method !== 'GET' && d.method !== 'HEAD' && d.body != null) ? d.body : undefined,
    });
    // Allow per-request JS-side context injection.
    // globalThis.__netlifyContextProvider = (rawCtx, req) => ({ ...rawCtx, ip: '...' });
    var rawCtx = d.context || {};
    if (typeof globalThis.__netlifyContextProvider === 'function') {
      rawCtx = globalThis.__netlifyContextProvider(rawCtx, request) || rawCtx;
    }
    var context = buildNetlifyContext(rawCtx);
    _tend(_t);

    // __ssrHandler is the actual request handler returned by the adapter factory
    _t = _tstart('ssr-handler');
    var response;
    try {
      response = await __ssrHandler(request, context);
    } catch(handlerErr) {
      console.error('SSR HANDLER EXCEPTION type=' + typeof handlerErr + ' msg=' + (handlerErr && handlerErr.message) + ' stack=' + (handlerErr && handlerErr.stack) + ' str=' + String(handlerErr));
      throw handlerErr;
    }
    _tend(_t);

    // Collect headers as [[k,v]] pairs.
    // Set-Cookie is handled separately to preserve individual values.
    _t = _tstart('collect-headers');
    var respHeaders = [];
    response.headers.forEach(function (value, key) {
      if (key !== 'set-cookie') respHeaders.push([key, value]);
    });
    var setCookies = response.headers.getSetCookie ? response.headers.getSetCookie() : [];
    for (var i = 0; i < setCookies.length; i++) {
      if (setCookies[i]) respHeaders.push(['set-cookie', setCookies[i]]);
    }
    _tend(_t);

    // Send headers immediately — client receives status + headers before body is buffered.
    _t = _tstart('stream-response');
    __go_sendHeaders(response.status, JSON.stringify(respHeaders));

    // Stream body chunks from the async iterator / ReadableStream as they are produced.
    // response._body is the internal body field set by the polyfill's Response constructor.
    var b = response._body;
    if (b != null) {
      if (typeof b.getReader === 'function') {
        // ReadableStream path (e.g. renderToReadableStream).
        var reader = b.getReader();
        while (true) {
          var _r = await reader.read();
          if (_r.done) break;
          var _c = _r.value;
          if (_c && _c.length > 0)
            __go_sendChunk(typeof _c === 'string' ? _enc.encode(_c).buffer : _c.buffer);
        }
      } else if (b[Symbol.asyncIterator] != null) {
        // Async iterator path (Astro renderToAsyncIterable — the common path).
        var _iter = b[Symbol.asyncIterator]();
        while (true) {
          var _r = await _iter.next();
          if (_r.done) break;
          var _c = _r.value;
          if (_c && _c.length > 0)
            __go_sendChunk(typeof _c === 'string' ? _enc.encode(_c).buffer : _c.buffer);
        }
      } else if (typeof b === 'string' && b.length > 0) {
        // Plain string body (e.g. Response.json / Response.redirect).
        __go_sendChunk(_enc.encode(b).buffer);
      }
    }
    _tend(_t);

    __go_endStream(JSON.stringify(_spans));
    return null;
  };
})();
