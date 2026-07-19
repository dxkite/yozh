export const promisify = (fn) => (...args) => new Promise((res, rej) => fn(...args, (e, v) => e ? rej(e) : res(v)));
export const inspect = (v) => JSON.stringify(v);
export const inherits = (ctor, superCtor) => { ctor.super_ = superCtor; Object.setPrototypeOf(ctor.prototype, superCtor.prototype); };
export const deprecate = (fn, msg) => fn;
export const types = {
  isNativeError: (v) => v instanceof Error,
  isPromise: (v) => v && typeof v.then === 'function',
  isRegExp: (v) => v instanceof RegExp,
};
export const format = (fmt, ...args) => {
  let i = 0;
  return String(fmt).replace(/%[sdjifoO%]/g, (m) => m === '%%' ? '%' : String(args[i++]));
};
export const TextEncoder = globalThis.TextEncoder;
export const TextDecoder = globalThis.TextDecoder;
export default { promisify, inspect, inherits, deprecate, types, format, TextEncoder, TextDecoder };
