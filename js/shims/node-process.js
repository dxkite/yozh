export const env = globalThis.__processEnv || {};
export const version = 'v20.0.0';
export const versions = {};
export const platform = 'linux';
export const stdout = { write: () => {} };
export const stderr = { write: () => {} };
export default globalThis.process || { env, version, versions, platform };
