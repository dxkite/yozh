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

  globalThis.__handleRequest = async function __handleRequest(requestJSON) {
    var d = JSON.parse(requestJSON);

    // Build Web Fetch API Request from the serialized payload
    var request = new Request(d.url, {
      method:  d.method || 'GET',
      headers: new Headers(d.headers || []),
      // Only pass body for methods that allow it
      body: (d.method !== 'GET' && d.method !== 'HEAD' && d.body != null) ? d.body : undefined,
    });

    var context = buildNetlifyContext(d.context);

    // __ssrHandler is the actual request handler returned by the adapter factory
    var response;
    try {
      response = await __ssrHandler(request, context);
    } catch(handlerErr) {
      console.error('SSR HANDLER EXCEPTION type=' + typeof handlerErr + ' msg=' + (handlerErr && handlerErr.message) + ' stack=' + (handlerErr && handlerErr.stack) + ' str=' + String(handlerErr));
      throw handlerErr;
    }

    // Collect headers as [[k,v]] pairs.
    // Set-Cookie is handled separately to preserve individual values.
    var respHeaders = [];
    response.headers.forEach(function (value, key) {
      if (key !== 'set-cookie') respHeaders.push([key, value]);
    });
    var setCookies = response.headers.getSetCookie ? response.headers.getSetCookie() : [];
    for (var i = 0; i < setCookies.length; i++) {
      if (setCookies[i]) respHeaders.push(['set-cookie', setCookies[i]]);
    }

    var body = await response.text();

    return JSON.stringify({
      status:  response.status,
      headers: respHeaders,
      body:    body,
    });
  };
})();
