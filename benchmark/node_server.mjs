#!/usr/bin/env node
// Node.js HTTP server wrapping a Netlify adapter entry.mjs, used for SSR benchmark comparison.
// Usage: node benchmark/node_server.mjs [--port 3001] [--entry /abs/path/to/entry.mjs]
import http from 'node:http'
import { parseArgs } from 'node:util'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const { values: args } = parseArgs({
  options: {
    port:  { type: 'string', default: '3001' },
    entry: { type: 'string', default: 'examples/example/.netlify/build/entry.mjs' },
  },
  strict: false,
})

// Use file:// URL so that relative imports inside entry.mjs resolve correctly
// regardless of the process CWD.
const entryURL = pathToFileURL(resolve(args.entry)).href
const _entry = await import(entryURL)

// Mirror bootstrap.mjs adapter compatibility logic:
//   Astro <=v4: default export = handler (length>=2) or factory (length<2)
//   Astro  v6+: no default export; named export createHandler = factory (length=1)
const _rawFactory = (typeof _entry.default === 'function') ? _entry.default : _entry.createHandler
let ssrHandler
if (typeof _rawFactory === 'function' && _rawFactory.length < 2) {
  const _h = _rawFactory({})
  ssrHandler = (typeof _h === 'function') ? _h : _rawFactory
} else {
  ssrHandler = _rawFactory
}

const server = http.createServer(async (req, res) => {
  const host = req.headers.host || 'localhost'
  const url = new URL(req.url, `http://${host}`)

  let body = null
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    if (chunks.length > 0) body = Buffer.concat(chunks)
  }

  // Flatten headers: Node may give arrays for multi-value headers
  const flatHeaders = Object.entries(req.headers).flatMap(([k, v]) =>
    Array.isArray(v) ? v.map(val => [k, val]) : [[k, String(v)]]
  )
  const init = { method: req.method, headers: flatHeaders }
  if (body) { init.body = body; init.duplex = 'half' }
  const webReq = new Request(url.href, init)

  const clientIP =
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    '127.0.0.1'
  const ctx = {
    ip: clientIP,
    requestId: req.headers['x-request-id'] || '',
    json: (data) => Response.json(data),
    log: () => {},
    next: () => { throw new Error('next() not supported') },
  }

  try {
    const response = await ssrHandler(webReq, ctx)
    const outHeaders = {}
    response.headers.forEach((v, k) => { outHeaders[k] = v })
    res.writeHead(response.status, outHeaders)
    if (response.body) {
      for await (const chunk of response.body) res.write(chunk)
    }
  } catch (err) {
    if (!res.headersSent) res.writeHead(500)
    process.stderr.write(`[node_server] ${err}\n`)
  }
  res.end()
})

const port = parseInt(args.port, 10)
server.listen(port, () => {
  // Emit ready signal read by the Go benchmark subprocess watcher
  process.stdout.write(`ready:${port}\n`)
})
