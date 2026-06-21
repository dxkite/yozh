const noop = () => Promise.resolve(null);
export const promises = {
  readFile: noop, writeFile: noop, readdir: noop, stat: noop,
  mkdir: noop, rm: noop, access: noop, readlink: noop,
};
export const statSync = () => { throw new Error('statSync not supported in SSR'); };
export const createReadStream = () => { throw new Error('createReadStream not supported in SSR'); };
export const existsSync = () => false;
export const readFileSync = () => { throw new Error('readFileSync not supported in SSR'); };
export default { promises, statSync, createReadStream, existsSync, readFileSync };
