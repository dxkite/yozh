const _esc   = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
const _unesc = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#x27;': "'" };
export const escape   = (s) => String(s).replace(/[&<>"']/g, c => _esc[c]);
export const unescape = (s) => String(s).replace(/&(?:amp|lt|gt|quot|#x27);/g, m => _unesc[m] || m);
export default { escape, unescape };
