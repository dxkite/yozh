class AsyncLocalStorage {
  constructor() { this._store = undefined; }
  run(store, fn, ...args) { const prev = this._store; this._store = store; try { return fn(...args); } finally { this._store = prev; } }
  getStore() { return this._store; }
  enterWith(store) { this._store = store; }
  disable() {}
  static bind(fn) { return fn; }
}
class AsyncResource {
  constructor(type) { this._type = type; }
  runInAsyncScope(fn, thisArg, ...args) { return fn.apply(thisArg, args); }
  emitDestroy() { return this; }
  asyncId() { return 0; }
  triggerAsyncId() { return 0; }
  bind(fn) { return fn.bind(this); }
  static bind(fn, type, thisArg) { return fn.bind(thisArg); }
}
export { AsyncLocalStorage, AsyncResource };
export function createHook() { return { enable() {}, disable() {} }; }
export function executionAsyncId() { return 0; }
export function triggerAsyncId() { return 0; }
export default { AsyncLocalStorage, AsyncResource, createHook, executionAsyncId, triggerAsyncId };
