// Pass-through stub — SSR content is author-controlled; sanitization is a client concern.
function sanitizeHtml(dirty, _options) { return dirty == null ? '' : String(dirty); }
sanitizeHtml.defaults = { allowedTags: [], allowedAttributes: {}, allowedSchemes: [] };
export default sanitizeHtml;
