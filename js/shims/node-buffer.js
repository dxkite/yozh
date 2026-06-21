export const File = globalThis.File;
export const Blob = globalThis.Blob;
export function Buffer() {}
Buffer.from = (data, enc) => {
  if (typeof data === 'string') return new TextEncoder().encode(data);
  return new Uint8Array(data);
};
Buffer.alloc = (n) => new Uint8Array(n);
Buffer.isBuffer = () => false;
export default { File, Blob, Buffer };
