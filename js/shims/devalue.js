// Astro uses devalue for session/actions serialization.
// Stubs return JSON for simple values; complex types (Map, Set, Date, etc.) are not preserved.
export const stringify = (v) => JSON.stringify(v);
export const parse = (v) => JSON.parse(v);
export const unflatten = (v) => v;
export const flattened = (v) => v;
export default { stringify, parse, unflatten, flattened };
