export const cwd = () => '/';
export const env = globalThis.__processEnv || {};
export const version = 'v20.0.0';
export const versions = {};
export const platform = 'linux';
export const stdout = { fd: 1, write: () => {} };
export const stderr = { fd: 2, write: () => {} };
const _proc = globalThis.process || {};
export default { cwd, env, version, versions, platform, stdout, stderr, ..._proc };
