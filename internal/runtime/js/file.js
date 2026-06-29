if (!globalThis.Blob) {
  globalThis.Blob = class Blob {
    constructor(parts, opts) {
      this._parts = parts || [];
      this.type = (opts && opts.type) || '';
      this.size = (parts || []).reduce(function(n, p) {
        return n + (typeof p === 'string' ? p.length : (p.byteLength || 0));
      }, 0);
    }
    async text() { return this._parts.map(function(p) { return String(p); }).join(''); }
    async arrayBuffer() { return new TextEncoder().encode(await this.text()).buffer; }
  };
}
if (!globalThis.File) {
  globalThis.File = class File extends globalThis.Blob {
    constructor(parts, name, opts) {
      super(parts, opts || {});
      this.name = name || '';
      this.lastModified = (opts && opts.lastModified) || 0;
    }
  };
}
