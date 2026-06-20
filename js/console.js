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
      __consoleWrite(level, parts.join(' '));
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
