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
  var resultJSON = await __go_fetchRaw(url, method, JSON.stringify(reqHeaders), body);
  var result = JSON.parse(resultJSON);
  return new Response(result.body, {
    status: result.status,
    headers: new Headers(result.headers || []),
  });
};
