export function createServer() { return { listen: () => {}, close: () => {} }; }
export function createSecureServer() { return { listen: () => {}, close: () => {} }; }
export class Http2ServerResponse {}
export class Http2ServerRequest {}
export default { createServer, createSecureServer, Http2ServerResponse, Http2ServerRequest };
