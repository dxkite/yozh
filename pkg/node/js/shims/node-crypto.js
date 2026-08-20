export const webcrypto = globalThis.crypto;
export const randomBytes = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n));
export const pbkdf2Sync = () => { throw new Error('pbkdf2Sync is not supported in yozh'); };
export const createCipheriv = () => { throw new Error('createCipheriv is not supported in yozh'); };
export const createDecipheriv = () => { throw new Error('createDecipheriv is not supported in yozh'); };
export const createHmac = () => { throw new Error('createHmac is not supported in yozh'); };
export const createHash = () => { throw new Error('createHash is not supported in yozh'); };
export default { webcrypto, randomBytes, pbkdf2Sync, createCipheriv, createDecipheriv, createHmac, createHash };
