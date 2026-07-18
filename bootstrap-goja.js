// bootstrap-goja.js — Go ↔ goja bridge (plain script, no ES module imports).
//
// Defines globalThis.__handleRequest(requestData) : Promise<null>
//
// Depends on: globalThis.__ssrEntry (set by the IIFE-format SSR bundle),
//             web-api polyfills.
//
// requestData shape (object, not JSON string):
//   { method, url, headers: [[k,v],...], body: string|null,
//     context: { ip, requestId, geo, site, deploy, account, server } }
//
// Calls Go host functions:
//   __go_sendHeaders(status, headersJSON)
//   __go_sendChunk(arrayBuffer)
//   __go_endStream(traceJSON)

// Netlify adapter compatibility:
//   Astro <=v4: default export = handler (length>=2) or factory (length<2)
//   Astro  v6+: no default export; named export createHandler = factory (length=1)
var _entry = (typeof globalThis.__ssrEntry !== 'undefined') ? globalThis.__ssrEntry : {};
var _rawFactory = (typeof _entry.default === 'function') ? _entry.default : _entry.createHandler;
var __ssrHandler;
if (typeof _rawFactory === 'function' && _rawFactory.length < 2) {
  var _h = _rawFactory({});
  __ssrHandler = (typeof _h === 'function') ? _h : _rawFactory;
} else {
  __ssrHandler = _rawFactory;
}

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

  var _spans = [];
  var _enc = new TextEncoder();
  function _tstart(name) { return { name: name, s: Date.now() }; }
  function _tend(sp) { sp.e = Date.now(); _spans.push(sp); }

  globalThis.__handleRequest = async function __handleRequest(requestData) {
    _spans = [];
    var _t = _tstart('parse-request');
    var d = requestData;
    _tend(_t);

    _t = _tstart('build-request');
    var request = new Request(d.url, {
      method:  d.method || 'GET',
      headers: new Headers(d.headers || []),
      body: (d.method !== 'GET' && d.method !== 'HEAD' && d.body != null) ? d.body : undefined,
    });
    var rawCtx = d.context || {};
    if (typeof globalThis.__netlifyContextProvider === 'function') {
      rawCtx = globalThis.__netlifyContextProvider(rawCtx, request) || rawCtx;
    }
    var context = buildNetlifyContext(rawCtx);
    _tend(_t);

    _t = _tstart('ssr-handler');
    var response;
    try {
      response = await __ssrHandler(request, context);
    } catch(handlerErr) {
      console.error('SSR HANDLER EXCEPTION type=' + typeof handlerErr + ' msg=' + (handlerErr && handlerErr.message) + ' stack=' + (handlerErr && handlerErr.stack) + ' str=' + String(handlerErr));
      throw handlerErr;
    }
    _tend(_t);

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

    _t = _tstart('stream-response');
    __go_sendHeaders(response.status, JSON.stringify(respHeaders));

    var b = response._body;
    if (b != null) {
      if (typeof b.getReader === 'function') {
        var reader = b.getReader();
        while (true) {
          var _r = await reader.read();
          if (_r.done) break;
          var _c = _r.value;
          if (_c && _c.length > 0)
            __go_sendChunk(typeof _c === 'string' ? _enc.encode(_c).buffer : _c.buffer);
        }
      } else if (b[Symbol.asyncIterator] != null) {
        var _iter = b[Symbol.asyncIterator]();
        while (true) {
          var _r = await _iter.next();
          if (_r.done) break;
          var _c = _r.value;
          if (_c && _c.length > 0)
            __go_sendChunk(typeof _c === 'string' ? _enc.encode(_c).buffer : _c.buffer);
        }
      } else if (typeof b === 'string' && b.length > 0) {
        __go_sendChunk(_enc.encode(b).buffer);
      }
    }
    _tend(_t);

    __go_endStream(JSON.stringify(_spans));
    return null;
  };
})();
