export const createRequire = (_url) => (id) => {
  throw new Error(`require('${id}') is not supported in astro-runtime`);
};
export default { createRequire };
