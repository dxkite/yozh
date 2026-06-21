export function createStorage(opts) {
  const store = new Map();
  return {
    getItem:    (k)    => Promise.resolve(store.get(k) ?? null),
    setItem:    (k, v) => { store.set(k, v); return Promise.resolve(); },
    removeItem: (k)    => { store.delete(k); return Promise.resolve(); },
    clear:      ()     => { store.clear(); return Promise.resolve(); },
    getKeys:    (base) => Promise.resolve([...store.keys()].filter(k => !base || k.startsWith(base))),
    hasItem:    (k)    => Promise.resolve(store.has(k)),
    dispose:    ()     => Promise.resolve(),
    mount:      ()     => {},
    unmount:    ()     => {},
  };
}
export const builtinDrivers = {};
export function defineDriver(factory) { return factory; }
export function prefixStorage(storage, prefix) { return storage; }
export default { createStorage, builtinDrivers, defineDriver, prefixStorage };
