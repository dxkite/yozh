if (!globalThis.structuredClone) {
  globalThis.structuredClone = function(v) {
    return JSON.parse(JSON.stringify(v));
  };
}
