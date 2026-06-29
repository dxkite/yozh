# Bundle — SSR 入口打包

Astro 的 Netlify 适配器输出的 `entry.mjs` 不是独立可执行文件：它通过 ESM `import` 引用
`node_modules` 中的数百个依赖包。goja/sobek 没有文件系统，无法直接 `import`，
因此需要先用 esbuild 将所有依赖内联为单一自包含文件，再交给 goja 执行。

本文档描述两种打包模式、`nodeShimPlugin` 的工作原理及 esbuild 配置选项。

---

## 两种打包模式

| 模式 | 触发时机 | 是否需要 node_modules | 启动开销 | 适用场景 |
|---|---|---|---|---|
| **运行时打包**（`--entry`） | server 启动时调用 `BundleSSR` | ✅ 需要 | esbuild + IIFE 转换 | 本地开发、快速迭代 |
| **预打包**（`--bundle` / `--pack`） | 构建阶段提前完成，server 直接读取 | ❌ 不需要 | IIFE 转换（跳过 esbuild）| 生产部署、Docker 镜像 |

`--entry` 和 `--bundle` 最终传入 `NewPool` 的 bundle 内容等价，区别仅在于 esbuild 运行的时间点。

---

## 运行时打包：BundleSSR / BundleSSRGoja

### 函数签名

```go
func BundleSSR(entryPath string) ([]byte, error)      // ESM bundle（可进一步转换）
func BundleSSRGoja(entryPath string) ([]byte, error)  // 直接输出 IIFE 格式
```

接收 `entry.mjs` 的绝对路径，返回自包含 bundle 的字节切片，或返回 error（包含 esbuild 的诊断信息）。

`serve --entry` 模式调用 `BundleSSRGoja` 直接得到 goja 可执行的 IIFE 格式，
传入 `NewPool` 时无需再次转换。

### esbuild 配置

| 选项 | 值 | 原因 |
|---|---|---|
| `Bundle` | `true` | 将所有 import 内联为单文件 |
| `Format` | `FormatESModule` | 中间格式；goja 路径再用 `ConvertBundleForGoja` 转为 IIFE |
| `Platform` | `PlatformNeutral` | 不注入 Node.js/浏览器特有 shim |
| `Target` | `ES2023` | 初始打包目标；goja 路径降级到 ES2017 |
| `Write` | `false` | 输出到内存，不写磁盘 |
| `Conditions` | `["require", "node", "import", "default"]` | 见下节 |
| `MainFields` | `["main", "module", "browser"]` | 见下节 |
| `Sourcemap` | `SourceMapNone` | 去除 source map，减小 bundle 体积 |
| `LogLevel` | `LogLevelSilent` | 错误通过返回值传递，不污染 stderr |

**Conditions 顺序说明**

`"require"` 排在 `"import"` 之前，优先选取包的 CJS 发行版（`dist/index.js`）而非 ESM 发行版（`dist/index.mjs`）。
CJS 发行版通常是自包含的；而 ESM 发行版可能用 `import` 引用同 scope 下的兄弟包，
esbuild 会继续追踪这些依赖，导致打包范围意外扩大。

`"node"` 和 `"import"` 作为后备，覆盖纯 ESM 包（没有 `require` 条件入口的包）。

**MainFields 说明**

`PlatformNeutral` 默认不读取 `main` 和 `module` 字段。
显式指定 `["main", "module", "browser"]` 是为了覆盖没有 `exports` map 的老旧包：
这类包仅有 `"main": "dist/index.js"` 字段，不设置 MainFields 时 esbuild 会报 "package has no exports" 错误。
`"main"` 排在 `"module"` 之前，与 Conditions 保持一致，优先 CJS。

### Define

```javascript
"process.env.NODE_ENV": '"production"'
```

打包阶段将 `process.env.NODE_ENV` 替换为字符串字面量 `"production"`，
esbuild 的 dead-code elimination 会在打包时直接删除开发模式代码路径，
减小 bundle 体积。

---

## ConvertBundleForGoja — goja 格式转换

goja/sobek 不支持 ES module（`import`/`export`），bundle 需要转换为 IIFE 格式。

```go
func ConvertBundleForGoja(bundleSrc []byte) ([]byte, error)
```

使用 esbuild 将 ESM bundle 转换为 IIFE + ES2017 降级：
- `for-await-of`、`async function*`（AsyncGenerator）→ Promise 链
- 动态 `import()` → 返回 rejected Promise 的存根（不影响 SSR 主路径）
- 转换后产物写入 `globalThis.__ssrEntry`，由 `bootstrap-goja.js` 读取

---

## nodeShimPlugin — Node.js 内置模块替换

goja 运行时没有 Node.js 内置模块（`fs`、`path`、`crypto` 等）。
`nodeShimPlugin` 拦截对这些模块的 import，替换为轻量 ESM stub，
使依赖这些模块的包在 goja 中正常加载。

### 匹配规则

```
^(node:|process$|fs$|fs/|path$|path/|url$|crypto$|buffer$|stream$|
  http$|https$|http2$|os$|async_hooks$|worker_threads$|perf_hooks$|
  events$|util$|assert$|net$|tls$|tty$|zlib$|child_process$|dns$|
  dgram$|readline$|module$)
```

### Shim 文件列表

shim 源码位于 `js/shims/`，通过 `//go:embed js/shims` 编译进 Go 二进制。

| specifier | shim 文件 | 提供的关键 API |
|---|---|---|
| `node:process` / `process` | `node-process.js` | `env`、`version`、`platform`、`stdout`、`stderr` |
| `node:path` / `path` / `node:path/posix` | `node-path.js` | `join`、`resolve`、`dirname`、`basename`、`extname`、`posix` |
| `node:url` / `url` | `node-url.js` | `URL`、`URLSearchParams`、`fileURLToPath`、`pathToFileURL` |
| `node:crypto` / `crypto` | `node-crypto.js` | `webcrypto`（`globalThis.crypto`）、`randomBytes` |
| `node:buffer` / `buffer` | `node-buffer.js` | `Blob`、`File`、`Buffer`（`from`、`alloc`、`isBuffer`）|
| `node:stream` / `stream` | `node-stream.js` | `Readable`、`Writable`、`PassThrough`、`pipeline` |
| `node:events` / `events` | `node-events.js` | `EventEmitter`（`on`/`off`/`emit`/`once`）|
| `node:async_hooks` / `async_hooks` | `node-async-hooks.js` | `AsyncLocalStorage`、`AsyncResource`、`createHook` |
| `node:util` / `util` | `node-util.js` | `promisify`、`inspect`、`TextEncoder`、`TextDecoder` |
| `node:net` / `net` | `node-net.js` | `isIP`、`isIPv4`、`isIPv6` |
| `node:fs` / `fs` / `node:fs/promises` | `node-fs.js` | `promises`（stub）、`existsSync`（→ `false`）|
| `node:http2` / `http2` | `node-http2.js` | `createServer`（stub）|
| `node:tty` / `tty` | `node-tty.js` | `isatty`（→ `false`）|
| `node:module` / `module` | `node-module.js` | `createRequire`（stub）|
| 其他 `node:*` | —— | `export default {}` |

**未匹配的 Node.js 内置**（如 `node:http`、`node:os`、`node:zlib`）返回空 stub `export default {}`。
如果 SSR bundle 在渲染路径中真正调用了这些模块的方法，会在运行时抛出 TypeError。
目前使用 `@astrojs/netlify` 适配器的项目在正常渲染路径中不会触发这些模块。

### Shim 与 polyfill 的分工

| 层次 | 位置 | 作用 |
|---|---|---|
| **nodeShimPlugin** | bundle.go，esbuild 打包阶段 | 替换 node_modules 中包对 Node.js 内置的 `import`，使 esbuild 能完成打包 |
| **polyfills** | runtime.go，goja 初始化阶段 | 向 `globalThis` 注入 Web API（`fetch`、`crypto`、`TextEncoder` 等） |

---

## 已知局限

| 限制 | 说明 |
|---|---|
| Shim 不支持真正的 `fs` I/O | `existsSync` 始终返回 `false`，`readFileSync` 抛出错误。SSR 渲染路径不应读取文件系统 |
| `node:stream/web` 主动抛错 | 激活 bundle 内置的 web-streams-polyfill fallback，这是预期行为 |
| `node:http` / `node:https` 返回空 stub | Netlify 适配器不在渲染路径中使用，暂不影响正常功能 |
| bundle 体积约 12–13 MB | 包含所有依赖的内联代码 |
