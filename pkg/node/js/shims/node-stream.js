function PassThrough() { this._chunks = []; this._listeners = {}; }
PassThrough.prototype.write = function(c) { this._chunks.push(c); return true; };
PassThrough.prototype.end = function(c) { if (c) this.write(c); (this._listeners['end'] || []).forEach(fn => fn()); };
PassThrough.prototype.on = function(e, fn) { (this._listeners[e] = this._listeners[e] || []).push(fn); return this; };
PassThrough.prototype.pipe = function(dest) {
  this._listeners['end'] = this._listeners['end'] || [];
  this._listeners['end'].push(() => { this._chunks.forEach(c => dest.write(c)); dest.end(); });
  return dest;
};
export { PassThrough };
export const pipeline = (...args) => { const cb = args[args.length - 1]; Promise.resolve().then(() => cb && cb(null)); };
export const Readable = PassThrough;
export const Writable = PassThrough;
export const Transform = PassThrough;
export const Stream = PassThrough;
export default { PassThrough, Readable, Writable, Transform, Stream, pipeline };
