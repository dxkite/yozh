# Bundle — SSR 入口打包

Astro 的 Netlify 适配器输出的 `entry.mjs` 不是独立可执行文件：它通过 ESM `import` 引用
`node_modules` 中的数百个依赖包。运行时（goja/sobek）没有 Node.js 模块解析能力，无法直接
`import` 这些包，因此需要先用 esbuild 将所有依赖内联为单一自包含文件。

打包分两步：

1. **esbuild 打包**（`BundleSSR` / `bundleSSR`）：把 `entry.mjs` 及其全部依赖内联为一个自包含的 ESM 文件。
2. **goja 格式转换**（`ConvertBundleForGoja`）：把第一步的 ESM 再过一遍 esbuild，降级到 ES2017、
   统一 UTF-8 charset，并包一层 `goja:wrapper` 虚拟入口，使其可以被 sobek 的 `ParseModule` 正确解析，
   且以副作用方式设置 `globalThis.__ssrEntry`。

本文档描述这两步打包的实现、`nodeShimPlugin` 的工作原理、esbuild 配置选项，以及 `cmd/main.go`
实际暴露的 CLI 用法。没有字节码编译步骤——goja 不支持字节码，SSR bundle 始终以源码字符串形式
被 `Eval`。

---

## CLI 用法（`cmd/main.go` 现状）

`astro-runtime` 只有 `build` 和 `serve` 两个子命令，均不含 `--bytecodes`/`--ssr` 之类的历史标志。

### build 命令

```
astro-runtime build [--entry path] [--kind astro|react] [--pack] [--out path] [--dist dir]
```

| flag | 默认值 | 说明 |
|---|---|---|
| `--entry` | `.netlify/build/entry.mjs` | SSR 入口路径（`--kind react` 时为 `.jsx`/`.tsx`） |
| `--kind` | `astro` | `astro`：Netlify SSR，node/CJS-first conditions；`react`：JSX + browser conditions |
| `--pack` | `false` | 输出 `.pack`（bundle.mjs + dist/）而非单独的 `bundle.mjs` |
| `--out` | `.netlify/build/bundle.mjs`（或 `--pack` 时为 `bundle.pack`） | 输出路径 |
| `--dist` | `dist` | 静态输出目录，仅 `--pack` 时使用 |

内部调用（`--kind astro`，默认）：

```
BundleSSR(entry) → jsCode（esbuild 打包的自包含 ESM）
--pack:  BuildPack(out, jsCode, dist) → 内部 ConvertBundleForGoja → writePack → bundle.pack
默认:    ConvertBundleForGoja(jsCode) → gojaCode → 写入 bundle.mjs
```

`--kind react` 时 `BundleSSRReact` 内部已经完成 `ConvertBundleForGoja` 转换，`--pack` 分支改用
`BuildPackFromGoja` 跳过二次转换。

### serve 命令

```
astro-runtime serve [--pack path | --entry path | --bundle path] [--port n] [--dist dir]
                     [--cache-dir dir] [--pack-cache-size n] [--bootstrap file] [--polyfill file]
```

`--pack`、`--entry`、`--bundle` 互斥（`cmd.MarkFlagsMutuallyExclusive`）。未指定任何一个时按顺序自动探测：
`.netlify/build/bundle.pack` → `.netlify/build/bundle.mjs` → 默认 `.netlify/build/entry.mjs`。

`--entry` 模式在 server 启动时调用 `BundleSSRGoja(entry)`（`BundleSSR` + `ConvertBundleForGoja` 的组合），
产出 goja 格式 ESM 后交给 `NewRuntime(WithBundle(...))`。没有单独的“运行时字节码编译”步骤。

没有 `--engine` 标志——goja 是唯一引擎，不能通过 CLI 切换。

---

## 第一步：esbuild 打包（BundleSSR）

### 函数签名

```go
func BundleSSR(entryPath string) ([]byte, error)
```

接收 `entry.mjs` 的绝对路径，返回自包含 ESM bundle 的字节切片，或返回 error（包含 esbuild 的诊断信息）。
产出的 bundle 需再经 `ConvertBundleForGoja` 转换后才能交给 goja 引擎（或直接传入 `BuildPack`，
`BuildPack` 内部会做这一步转换）。

### esbuild 配置

| 选项 | 值 | 原因 |
|---|---|---|
| `Bundle` | `true` | 将所有 import 内联为单文件 |
| `Format` | `FormatESModule` | 输出 ESM，供 `ConvertBundleForGoja` 的第二步 esbuild 处理 |
| `Platform` | `PlatformNeutral` | 不注入 Node.js/浏览器特有 shim |
| `Target` | `ES2023` | 第一步尽量保留原始语法；真正供 goja 使用前还会在第二步降级到 ES2017 |
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

### BundleSSRReact（`--kind react`）

```go
func BundleSSRReact(entryPath string) ([]byte, error)
```

与 `BundleSSR` 的两处差异：
- **browser 优先条件**（`Conditions: ["browser", "import", "default"]`，`MainFields: ["browser", "module", "main"]`）：
  esbuild 选取 `react-dom/server.browser` 而非 Node.js 版 `react-dom/server`，避免拉入 `node:stream`、`node:util` 等。
- **JSX 自动转换**（`JSX: api.JSXAutomatic`，`JSXImportSource: "react"`）：`.jsx`/`.tsx` 文件用 React 17+ 的
  自动 JSX 运行时编译，无需手写 `import React`。

`BundleSSRReact` 内部已经调用 `ConvertBundleForGoja`，返回值可直接交给 `BuildPackFromGoja` 或 `NewPool`。

---

## 第二步：goja 格式转换（ConvertBundleForGoja）

### 函数签名

```go
func ConvertBundleForGoja(esmSrc []byte) ([]byte, error)
```

对已经打包好的 ESM 源码再跑一遍 esbuild，生成 goja（sobek）兼容的 ESM，产物的关键属性：

- **Format: ESModule** — `import(variable)` 表达式在语法上依然合法，无需字符串替换。
- **Target: ES2017** — `for-await-of` 和 async generator 被降级为 Promise 链，兼容 sobek 的解析器。
- **Charset: UTF8** — 直接输出原始 UTF-8 而非 `\u{XXXXX}` 转义（避免触发 sobek 词法分析器 panic）。
- 顶层 await（TLA）被保留（esbuild 在 ESM 格式下始终保留 TLA，与 target 无关）。

### gojaWrapperPlugin

`ConvertBundleForGoja` 用一个虚拟入口 `goja:wrapper` 驱动第二次 esbuild：

```javascript
import * as __entry from "goja:bundle";
globalThis.__ssrEntry = __entry;
```

`goja:bundle` 是另一个虚拟模块，内容就是第一步 `BundleSSR`/`bundleSSRReact` 产出的原始 ESM 源码。
`gojaWrapperPlugin`（`bundle.go`）通过 `OnResolve`/`OnLoad` 给这两个虚拟 specifier 提供内容，
esbuild 把它们当作真实模块一起打包，最终输出的单文件里既包含原始 bundle，也包含把命名空间对象
赋值给 `globalThis.__ssrEntry` 的胶水代码。

`bootstrap-astro.js`（`internal/runtime/bootstrap-astro.js`）读取 `globalThis.__ssrEntry.default` 或
`.createHandler` 来定位 SSR handler 工厂——这条读取路径就是 bundle 与 bootstrap 之间唯一的耦合点。

运行时对该 bundle 的动态 `import(variable)`（如果 SSR 代码里真的用到）由 sobek 的
`SetImportModuleDynamically` 回调处理（见 `internal/runtime/engine_goja.go`）：当前实现对任何动态
import 一律 resolve 成一个空模块（`export default void 0`），不会抛错，但也不会真的加载目标模块——
所有真正需要的模块都必须在 esbuild 打包阶段被静态内联进 bundle。静态 `import` 若引用了未打包进
bundle 的外部模块，`ParseModule` 阶段会直接报错（"external module not supported"）。

---

## nodeShimPlugin — Node.js 内置模块替换

goja 运行时没有 Node.js 内置模块（`fs`、`path`、`crypto` 等）。
`nodeShimPlugin` 在 esbuild 第一步打包阶段拦截对这些模块的 import，替换为轻量 ESM stub，
使依赖这些模块的包能正常打包（不会因为找不到模块而报错）。

### 匹配规则

```
^(node:|process$|fs$|fs/|path$|path/|url$|crypto$|buffer$|stream$|
  http$|https$|http2$|os$|async_hooks$|worker_threads$|perf_hooks$|
  events$|util$|assert$|net$|tls$|tty$|zlib$|child_process$|dns$|
  dgram$|readline$|module$)
```

匹配 `node:` 协议前缀以及所有已知裸 Node.js 内置名称。第三方包名不匹配此正则，
由 esbuild 正常从 node_modules 解析。

### Shim 文件列表

shim 源码位于 `js/shims/`，通过 `//go:embed js/shims` 编译进 Go 二进制。

| specifier | shim 文件 | 提供的关键 API |
|---|---|---|
| `node:process` / `process` | `node-process.js` | `env`、`version`、`platform`、`stdout`、`stderr` |
| `node:path` / `path` / `node:path/posix` / `path/posix` | `node-path.js` | `join`、`resolve`、`dirname`、`basename`、`extname`、`posix` |
| `node:url` / `url` | `node-url.js` | `URL`、`URLSearchParams`、`fileURLToPath`、`pathToFileURL` |
| `node:crypto` / `crypto` | `node-crypto.js` | `webcrypto`（`globalThis.crypto`）、`randomBytes` |
| `node:buffer` / `buffer` | `node-buffer.js` | `Blob`、`File`、`Buffer`（`from`、`alloc`、`isBuffer`）|
| `node:stream` / `stream` | `node-stream.js` | `Readable`、`Writable`、`PassThrough`、`pipeline` |
| `node:stream/web` / `stream/web` | `node-stream-web.js` | 从 `globalThis` 重新导出 `ReadableStream`/`WritableStream`/`TransformStream`/`TextEncoderStream`/`TextDecoderStream` 等（由 goja 运行时的 web-api polyfill 提供） |
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
| **nodeShimPlugin** | `bundle.go`，esbuild 第一步打包阶段 | 替换 node_modules 中包对 Node.js 内置的 `import`，使 esbuild 能完成打包 |
| **polyfills** | `internal/runtime/polyfills.go` + `js/*.js`，`SetupRuntime` 初始化阶段 | 向 goja `globalThis` 注入 Web API（`fetch`、`crypto`、`TextEncoder`、`ReadableStream` 等） |

两者互补：打包阶段的 shim 消除了"找不到模块"错误；运行阶段的 polyfill 提供 bundle 依赖的全局 API
（`node-stream-web.js` 正是靠运行时 polyfill 提供的 `ReadableStream` 等全局对象转发出去的）。

---

## 部署场景

### 本地开发 / 一次性构建

```bash
pnpm build                                   # astro build → .netlify/build/entry.mjs
astro-runtime build --entry .netlify/build/entry.mjs --out .netlify/build/bundle.mjs
astro-runtime serve --bundle .netlify/build/bundle.mjs --dist dist
```

### 生产部署：.pack（推荐，容器镜像不含 node_modules）

```bash
# 构建机：astro build + astro-runtime build --pack
pnpm build
astro-runtime build --pack \
    --entry .netlify/build/entry.mjs \
    --dist  dist \
    --out   .netlify/build/bundle.pack

# Docker 镜像只需复制一个 .pack 文件，不含 node_modules、不含 dist/、不含单独的 .mjs
COPY .netlify/build/bundle.pack /app/bundle.pack

# 启动命令
CMD ["/app/astro-runtime", "serve", "--pack", "/app/bundle.pack", "--cache-dir", "/cache"]
```

`--cache-dir` 非空时，`.pack` 会被解压到 `cacheDir/<sha256>/` 并按 `--pack-cache-size` 做 LRU 淘汰；
多次重启的生产部署可以复用磁盘上已解压的目录，跳过重复解压。

### 服务器自行打包（无预构建产物）

```bash
astro-runtime serve --entry .netlify/build/entry.mjs --dist dist
```

启动时调用 `BundleSSRGoja`（esbuild 打包 + `ConvertBundleForGoja`），需要该目录下有完整
`node_modules`（node-linker=hoisted 的 pnpm 项目，或 npm/yarn 的扁平结构）。

---

## 已知局限

| 限制 | 说明 |
|---|---|
| Shim 不支持真正的 `fs` I/O | `existsSync` 始终返回 `false`，`readFileSync` 抛出错误。SSR 渲染路径不应读取文件系统 |
| 未匹配的 `node:*` 返回空 stub | 如 `node:http`/`node:https`/`node:zlib`，Netlify 适配器不在渲染路径中使用，暂不影响正常功能 |
| esbuild 版本需与 node_modules 兼容 | `BundleSSR`/`BundleSSRReact` 使用 Go 模块 `github.com/evanw/esbuild`（in-process），与项目 node_modules 中的包版本需相互兼容 |
| bundle 体积 | 包含所有依赖的内联代码，体积随项目依赖数量变化；goja 直接 eval 源码字符串，无额外的字节码常驻内存开销 |
| 无字节码/预编译产物 | 没有 `.bc`/`.jsbc` 之类的预编译格式；每次进程启动都会对 bundle 源码做一次 `Eval(EvalModule)`（parse + 执行模块顶层代码），没有跳过这一步的机制 |
