export function decodeHex(hex) {
  const arr = new Uint8Array(hex.length >>> 1);
  for (let i = 0; i < arr.length; i++) arr[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return arr;
}
export function encodeBase64(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
export function decodeBase64(b64) {
  const s = atob(b64);
  const arr = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) arr[i] = s.charCodeAt(i);
  return arr;
}
export function encodeBase64url(bytes) {
  return encodeBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function decodeBase64url(b64url) {
  return decodeBase64(b64url.replace(/-/g, '+').replace(/_/g, '/'));
}
export function encodeHex(bytes) {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}
export function encodeHexUpperCase(bytes) {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0').toUpperCase()).join('');
}
export default { decodeHex, encodeBase64, decodeBase64, encodeBase64url, decodeBase64url, encodeHex, encodeHexUpperCase };
