function EventEmitter() { this._events = {}; }
EventEmitter.prototype.on = function(e, fn) { (this._events[e] = this._events[e] || []).push(fn); return this; };
EventEmitter.prototype.off = function(e, fn) { if (this._events[e]) this._events[e] = this._events[e].filter(f => f !== fn); return this; };
EventEmitter.prototype.emit = function(e, ...args) { (this._events[e] || []).forEach(fn => fn(...args)); return true; };
EventEmitter.prototype.once = function(e, fn) { const w = (...a) => { this.off(e, w); fn(...a); }; return this.on(e, w); };
EventEmitter.prototype.removeAllListeners = function(e) { if (e) delete this._events[e]; else this._events = {}; return this; };
export { EventEmitter };
export default { EventEmitter };
