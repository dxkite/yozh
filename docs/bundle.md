# Bundle — SSR 入口打包

Astro 的 Netlify 适配器输出的 `entry.mjs` 不是独立可执行文件：它通过 ESM `import` 引用
`node_modules` 中的数百个依赖包。QuickJS 没有文件系统，无法直接 `import`，
因此需要先用 esbuild 将所有依赖内联为单一自包含文件，再交给 QJS 执行。

本文档描述两种打包模式、`nodeShimPlugin` 的工作原理、esbuild 配置选项及选择指南。

---

## 两种打包模式

| 模式 | 触发时机 | 是否需要 node_modules | 适用场景 |
|---|---|---|---|
| **运行时打包**（`--ssr`） | server 启动时调用 `BundleSSR` | ✅ 需要（esbuild 从磁盘解析依赖） | 本地开发、快速迭代 |
| **预打包**（`--bundle`） | 构建阶段提前完成，server 直接读文件 | ❌ 不需要 | 生产部署、Docker 镜像 |

两种模式产出完全相同结构的 ESM bundle，传入 QJS 的字节内容等价。
区别仅在于 esbuild 运行的时间点。

---

## 运行时打包：BundleSSR

### 函数签名

```go
func BundleSSR(entryPath string) ([]byte, error)
```

接收 `entry.mjs` 的绝对路径，返回自包含 ESM bundle 的字节切片，或返回 error（包含 esbuild 的诊断信息）。
产出的 bundle 可直接传入 `NewPool`。

### 调用位置

`cmd/main.go` 在 `--ssr` 模式下调用，发生在 server 接受第一个请求之前：

```
启动 → BundleSSR(entry.mjs) → NewPool(bundleCode) → StartServer
```

esbuild 打包通常需要 1–3 秒（取决于 node_modules 规模），
期间 server 不接受请求。打包完成后将 bundle 交给 QJS 编译为 bytecode，
之后每个 QJS runtime 复用同一份 bytecode，无需重复打包。

### esbuild 配置

| 选项 | 值 | 原因 |
|---|---|---|
| `Bundle` | `true` | 将所有 import 内联为单文件 |
| `Format` | `FormatESModule` | QJS 使用 `TypeModule()` 加载，需要 ESM 格式 |
| `Platform` | `PlatformNeutral` | 不注入 Node.js/浏览器特有 shim |
| `Target` | `ES2023` | QuickJS-NG 支持 ES2020+，ES2023 特性已充分覆盖 |
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
esbuild 的 dead-code elimination 会在打包时直接删除开发模式代码路径
（如 `if (process.env.NODE_ENV !== 'production') { devWarning() }`），
减小 bundle 体积。

---

## nodeShimPlugin — Node.js 内置模块替换

QJS 运行时没有 Node.js 内置模块（`fs`、`path`、`crypto` 等）。
`nodeShimPlugin` 拦截对这些模块的 import，替换为轻量 ESM stub，
使依赖这些模块的包在 QJS 中正常加载。

### 匹配规则

```
^(node:|process$|fs$|fs/|path$|path/|url$|crypto$|buffer$|stream$|
  http$|https$|http2$|os$|async_hooks$|worker_threads$|perf_hooks$|
  events$|util$|assert$|net$|tls$|tty$|zlib$|child_process$|dns$|
  dgram$|readline$)
```

匹配 `node:` 协议前缀以及所有已知裸 Node.js 内置名称。第三方包名不匹配此正则，
由 esbuild 正常从 node_modules 解析。

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
| 其他 `node:*` | —— | `export default {}` |

**未匹配的 Node.js 内置**（如 `node:http`、`node:os`、`node:zlib`）返回空 stub `export default {}`。
如果 SSR bundle 在渲染路径中真正调用了这些模块的方法，会在运行时抛出 TypeError。
目前使用 `@astrojs/netlify` 适配器的项目在正常渲染路径中不会触发这些模块。

### Shim 与 polyfill 的分工

| 层次 | 位置 | 作用 |
|---|---|---|
| **nodeShimPlugin** | bundle.go，esbuild 打包阶段 | 替换 node_modules 中包对 Node.js 内置的 `import`，使 esbuild 能完成打包 |
| **polyfills** | runtime.go，QJS 初始化阶段 | 向 QJS `globalThis` 注入 Web API（`fetch`、`crypto`、`TextEncoder` 等） |

两者互补：打包阶段的 shim 消除了"找不到模块"错误；运行阶段的 polyfill 提供 bundle 依赖的全局 API。

---

## 预打包：bundle-ssr.mjs

### 动机

运行时打包要求部署环境带有完整 `node_modules`（数万个文件），
且 esbuild 在 server 启动时消耗额外时间。
预打包在构建机器上一次性完成，生产镜像只需携带单个 `bundle.mjs` 文件。

### 脚本位置

`astro-koharu/scripts/bundle-ssr.mjs`

使用与 `BundleSSR` 完全相同的 esbuild 配置和 shim 内容，
通过 esbuild npm 包（已由 astro / vite 间接引入）运行。

### 调用方式

```bash
# 仅执行预打包（entry.mjs 已存在）
pnpm bundle:ssr

# 完整构建：astro build + 预打包
pnpm build:prod
```

默认路径：
- 输入：`.netlify/build/entry.mjs`（`astro build` 产物）
- 输出：`.netlify/build/bundle.mjs`（自包含 bundle）

覆盖路径：

```bash
node scripts/bundle-ssr.mjs --entry path/to/entry.mjs --out path/to/bundle.mjs
```

### 与 BundleSSR 的差异

两者使用完全相同的 esbuild 核心选项（`conditions`、`mainFields`、`define`、`platform`、`target`、`format`）
和 `nodeShimPlugin` 逻辑（shim 内容以字符串形式内联在脚本中）。

唯一区别：
- `BundleSSR`：`write: false`，输出到内存，由 Go 直接传入 `NewPool`
- `bundle-ssr.mjs`：`write: true`，输出到磁盘，由 runtime 在启动时读取

---

## --bundle 模式：直接读取预打包文件

### 命令行参数

```
--bundle <path>   预打包 .mjs 文件路径（跳过 esbuild，直接读取）
--ssr    <path>   SSR entry .mjs 路径（调用 BundleSSR，需要 node_modules）
```

两者互斥，同时指定时 `--bundle` 优先。

### 自动检测

不传任何参数时，runtime 按以下顺序选择模式：

```
1. .netlify/build/bundle.mjs 存在 → --bundle 模式（预打包）
2. 否则                           → --ssr .netlify/build/entry.mjs（运行时打包）
```

### 启动日志对比

```
# --bundle 模式
Loading pre-bundled /app/.netlify/build/bundle.mjs ...
Bundle ready (12983395 bytes / 12679 KB)

# --ssr 模式
Bundling /app/.netlify/build/entry.mjs ...
Bundle ready (12983395 bytes / 12679 KB)
```

两种模式最终传入 `NewPool` 的 `bundleCode []byte` 内容等价，
后续 QJS bytecode 编译、pool 初始化流程完全相同。

---

## 部署场景对比

### 本地开发

```bash
pnpm build             # 仅 astro build，产出 entry.mjs
./runtime --ssr .netlify/build/entry.mjs --dist dist
# server 启动时 esbuild 打包，需要 node_modules 在同目录
```

### 生产 Docker 镜像

```bash
# 宿主机构建
pnpm build:prod        # astro build + bundle-ssr.mjs → bundle.mjs

# Docker build 只复制两项产物，不含 node_modules
COPY astro-koharu/dist                       ./astro-koharu/dist
COPY astro-koharu/.netlify/build/bundle.mjs  ./astro-koharu/.netlify/build/bundle.mjs

# 启动命令
CMD ["/app/server", "--bundle", "/app/.netlify/build/bundle.mjs", "--dist", "/app/astro-koharu/dist"]
```

镜像中没有 Node.js、pnpm、node_modules，只有 Go 静态二进制 + 静态文件 + 一个 JS 文件。

---

## 已知局限

| 限制 | 说明 |
|---|---|
| Shim 不支持真正的 `fs` I/O | `existsSync` 始终返回 `false`，`readFileSync` 抛出错误。SSR 渲染路径不应读取文件系统 |
| `node:stream/web` 主动抛错 | 激活 bundle 内置的 web-streams-polyfill fallback，这是预期行为 |
| `node:http` / `node:https` 返回空 stub | Netlify 适配器不在渲染路径中使用，暂不影响正常功能 |
| esbuild 版本需与 node_modules 兼容 | 预打包脚本使用 node_modules 中已安装的 esbuild（由 astro/vite 引入），无需单独安装 |
| bundle 体积约 12–13 MB | 包含所有依赖的内联代码；QJS bytecode 编译后常驻内存，不影响请求延迟 |
