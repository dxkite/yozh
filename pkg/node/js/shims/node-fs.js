const noop = () => Promise.resolve(null);
const noopSync = () => { throw new Error('fs sync not supported in SSR'); };
export const promises = {
  readFile: noop, writeFile: noop, readdir: noop, stat: noop,
  mkdir: noop, rm: noop, access: noop, readlink: noop,
  realpath: noop,
};
export const stat = noop;
export const realpath = noop;
export const readdir = noop;
export const statSync = noopSync;
export const realpathSync = noopSync;
export const readdirSync = noopSync;
export const createReadStream = () => { throw new Error('createReadStream not supported in SSR'); };
export const existsSync = () => false;
export const readFileSync = noopSync;
export default { promises, stat, realpath, readdir, statSync, realpathSync, readdirSync, createReadStream, existsSync, readFileSync };
