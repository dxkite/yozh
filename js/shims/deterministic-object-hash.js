export function deterministicString(obj) {
  return JSON.stringify(obj, Object.keys(obj || {}).sort());
}
export default { deterministicString };
