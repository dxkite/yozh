export const isIP = (s) => { if (/^(\d{1,3}\.){3}\d{1,3}$/.test(s)) return 4; if (s.includes(':')) return 6; return 0; };
export const isIPv4 = (s) => isIP(s) === 4;
export const isIPv6 = (s) => isIP(s) === 6;
export default { isIP, isIPv4, isIPv6 };
