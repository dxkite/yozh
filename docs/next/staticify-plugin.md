# staticifyPlugin 设计文档

## 概述

`staticifyPlugin` 是一个 esbuild 插件，在现有 `nodeShimPlugin` 之后执行，将 Astro SSR bundle 转换为**静态 JS**——一种消除了所有运行时动态性的标准化形式，作为 `js2wasm` 编译器的输入。

## 在管道中的位置

```
entry.mjs
  → esbuild
      + nodeShimPlugin   （已有：替换 Node.js 内置模块）
      + staticifyPlugin  （新增：消除动态脚本）
  → static-bundle.js    （staticifyPlugin 的输出）
  → js2wasm.Compile()
  → bundle.wasm
```

## 目标

将任意 Astro SSR bundle 中可能存在的动态模式消除或标准化，使输出满足 `js2wasm` 编译器的输入规范。对于 `js2wasm` 不支持的复杂模式，保持原样——由 `js2wasm` 返回 `ErrUnsupported`，调用方降级到 QJS 路径。

## 处理的动态模式

### 1. `eval` / `new Function` — 替换为 throw

这些构造在静态编译中无法处理。

```javascript
// 输入
eval("some code")
new Function("a", "return a + 1")

// 输出
(function() { throw new Error("eval is not supported in WASM mode") })()
(function() { throw new Error("new Function is not supported in WASM mode") })()
```

### 2. 动态属性访问（计算属性键）— 标注为不支持

```javascript
// 输入
obj[dynamicKey]
obj[computedProp()]

// 输出（原样保留，js2wasm 将返回 ErrUnsupported，触发降级）
obj[dynamicKey]
```

### 3. 宿主函数调用标准化

将 `runtime.go` 当前通过 `globalThis` 运行时注入的 `__go_*` 系列函数调用，统一重命名为 `__host_*` 形式，并移除 `globalThis.` 前缀。

```javascript
// 输入（当前 bootstrap.mjs 形式）
globalThis.__go_sendHeaders(status, headersJSON)
globalThis.__go_sendChunk(buf)
globalThis.__go_endStream(traceJSON)
await globalThis.__go_fetchRaw(url, method, headers, body)

// 输出（标准化形式，js2wasm 识别为 WASM import）
__host_send_headers(status, headersJSON)
__host_send_chunk(buf)
__host_end_stream(traceJSON)
await __host_fetch_raw(url, method, headers, body)
```

命名映射表：

| 当前名称 | 标准化名称 | WASM import |
|---------|----------|-------------|
| `__go_sendHeaders` | `__host_send_headers` | `astro-runtime.send_headers` |
| `__go_sendChunk` | `__host_send_chunk` | `astro-runtime.send_chunk` |
| `__go_endStream` | `__host_end_stream` | `astro-runtime.end_stream` |
| `__go_fetchRaw` | `__host_fetch_raw` | `astro-runtime.fetch_raw` |
| `__go_urlParse` | `__host_url_parse` | `astro-runtime.url_parse` |
| `__go_textEncodeUTF8` | `__host_text_encode` | `astro-runtime.text_encode` |
| `__go_textDecodeUTF8` | `__host_text_decode` | `astro-runtime.text_decode` |
| `__go_arrayBufToStr` | `__host_arraybuf_to_str` | `astro-runtime.arraybuf_to_str` |
| `__go_cryptoRandomBytes` | `__host_crypto_random` | `astro-runtime.crypto_random` |
| `__go_cryptoSubtleDigest` | `__host_crypto_digest` | `astro-runtime.crypto_digest` |

### 4. `process.env` 动态读取 — 编译时展开

`process.env[key]` 形式的动态读取替换为 `undefined`（key 未知时）或编译时常量（key 已知时）。`process.env.NODE_ENV` 已由 esbuild 的 `define` 选项处理。

```javascript
// 输入
const val = process.env[someVar]  // key 动态，无法确定

// 输出
const val = undefined
```

### 5. `bootstrap.mjs` 的 `import * as _entry` — 与 entry 合并

当前 `bootstrap.mjs` 通过 `import * as _entry from 'entry.mjs'` 在运行时加载入口。`staticifyPlugin` 将 bootstrap 逻辑内联到 bundle 中，消除该运行时 ESM import。

esbuild 构建时将 `bootstrap.mjs` 作为额外 entry point，与 `entry.mjs` 一起打包为单文件输出。

### 6. `Date.now()` / `Math.random()` — 替换为宿主函数

非确定性调用替换为可由 wazero 宿主提供的确定性版本。

```javascript
// 输入
const now = Date.now()
const r = Math.random()

// 输出
const now = __host_time_now()
const r = __host_random_f64()
```

对应新增 WASM import：`astro-runtime.time_now`、`astro-runtime.random_f64`。

## 不处理的模式（保留原样，js2wasm 决定是否支持）

以下模式原样输出，交给 `js2wasm` 判断：
- 闭包（捕获外部作用域变量）
- `class` 定义与 `prototype` 操作
- 动态属性访问（计算属性键）
- `try/catch/throw`
- `Symbol`、`WeakMap`、`Proxy`、`Reflect`
- 正则表达式对象（`/pattern/flags`）

## 输出规范（static-bundle.js 格式约束）

`staticifyPlugin` 输出的 `static-bundle.js` 满足：

1. **单文件**：所有 import 已内联，无 `import`/`export` 语句（除顶层导出外）
2. **无 eval**：不含 `eval`、`new Function`
3. **宿主函数统一命名**：所有宿主调用以 `__host_` 前缀标识
4. **无 `globalThis.__go_*`**：已全部替换为 `__host_*`
5. **模块格式**：单个 IIFE 或顶层作用域，不依赖运行时 ESM loader

## esbuild 插件实现要点

`staticifyPlugin` 使用 esbuild 的以下 hook：

- **`onLoad`**：对所有 JS 文件执行文本替换（正则 + AST 转换）
- **`onResolve`**：拦截 bootstrap 的虚拟模块路径

插件在 `BundleStatic()` 中于 `nodeShimPlugin` 之后注册：

```
Plugins: []api.Plugin{
    nodeShimPlugin(),    // 已有
    staticifyPlugin(),   // 新增
}
```

## 与现有代码的关系

- **不修改** `BundleSSR()`——现有 QJS 路径不受影响
- **新增** `BundleStatic()`，在 `BundleSSR` 基础上附加 `staticifyPlugin`
- `runtime.go` 中的宿主函数注册（`injectHostFunctions`）保持不变——仅 WASM 路径使用 `staticifyPlugin` 的输出
