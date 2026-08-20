export const createRequire = (_url) => (id) => {
  throw new Error(`require('${id}') is not supported in yozh`);
};
export default { createRequire };
