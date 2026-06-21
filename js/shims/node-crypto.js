export const webcrypto = globalThis.crypto;
export const randomBytes = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n));
export default { webcrypto, randomBytes };
