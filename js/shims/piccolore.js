// Astro's terminal color library — only needed for CLI output, not SSR.
const id = (s) => s;
const c = new Proxy({}, { get: (t, k) => typeof k === 'string' && k !== 'default' ? id : id });
export default c;
