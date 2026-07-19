// Ensure Error.stack always includes the name+message prefix (a no-op if the
// engine already includes it). Without this, Astro's logger logs `err.stack`
// and the error message can be invisible.
(function() {
  var origError = Error;
  var props = ['EvalError','RangeError','ReferenceError','SyntaxError','TypeError','URIError'];
  function patchStack(err) {
    try {
      var msg = (err.name || 'Error') + ': ' + (err.message || '');
      if (err.stack && typeof err.stack === 'string' && err.stack.indexOf(msg) < 0) {
        Object.defineProperty(err, 'stack', { value: msg + '\n' + err.stack, configurable: true, writable: true });
      }
    } catch(e) {}
    return err;
  }
  // Override global Error constructor
  function PatchedError(message) {
    var err = new origError(message);
    return patchStack(err);
  }
  PatchedError.prototype = origError.prototype;
  PatchedError.captureStackTrace = origError.captureStackTrace;
  globalThis.Error = PatchedError;
  for (var i = 0; i < props.length; i++) {
    var name = props[i];
    if (globalThis[name]) {
      var orig = globalThis[name];
      (function(orig, name) {
        function PatchedSubError(message) {
          var err = new orig(message);
          return patchStack(err);
        }
        PatchedSubError.prototype = orig.prototype;
        globalThis[name] = PatchedSubError;
      })(orig, name);
    }
  }
})();

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
      __go_consoleWrite(level, parts.join(' '));
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
