globalThis.fetch = async function fetch(input, init) {
  init = init || {};
  var url = typeof input === 'string' ? input : input.url;
  // Resolve relative URLs against globalThis.location (mimics browser fetch behavior).
  // URL class is available (env-api.js runs before fetch.js).
  if (url && !/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//.test(url)) {
    var _loc = globalThis.location;
    var _selfOrigin = globalThis.__go_self_origin;
    var base;
    if (_selfOrigin && _loc) {
      base = _selfOrigin + (_loc.pathname || '/') + (_loc.search || '');
    } else {
      base = (_loc && _loc.href) ? _loc.href : 'http://localhost/';
    }
    url = new URL(url, base).href;
  }
  var method = (init.method || 'GET').toUpperCase();
  var reqHeaders = {};
  if (init.headers) {
    var h = new Headers(init.headers);
    h.forEach(function(v, k) { reqHeaders[k] = v; });
  }
  var body = init.body || null;
  var resultJSON = await __go_fetchRaw(url, method, JSON.stringify(reqHeaders), body);
  var result = JSON.parse(resultJSON);
  return new Response(result.body, {
    status: result.status,
    headers: new Headers(result.headers || []),
  });
};
