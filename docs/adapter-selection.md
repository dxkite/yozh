# 适配器选型与项目定位

## 项目目标

**astro-runtime** 面向两个核心场景：

### 1. 网站模板 SSR

将 Astro 项目作为可复用的网站模板提供，模板使用者在本地或私有服务器上直接运行，
无需关心 Netlify/Vercel 等云平台账号、CLI 工具或计费。

典型场景：
- 公司内部网站生成器：运营人员在内网 Docker 容器内启动，无外部云依赖
- 付费模板分发：用户购买后在自己服务器上部署，无需绑定特定平台
- 本地开发预览：`astro dev` 是 HMR 开发模式，此工具提供接近生产的 SSR 预览

### 2. BFF Render（Backend for Frontend 渲染）

Go 后端服务作为 BFF（Backend for Frontend）层，按需将 Astro 页面渲染为 HTML，
再拼装业务数据后返回给客户端。

```
客户端
  │
  ▼
Go BFF 服务（处理业务逻辑、鉴权、数据聚合）
  │  需要渲染某个 Astro 页面时
  ▼
astro-runtime（Pool.Get → HandleSSR）
  │
  ▼
goja 运行时（Astro SSR bundle）
  │
  ▼
HTML 字符串（注入到 BFF 响应中）
```

在这个模式下，`astro-runtime` 作为 Go 库被引入（`go get github.com/dxkite/astro-runtime`），
而不是单独启动的服务。BFF 将 Pool 生命周期与自身绑定，按需调用 `HandleSSR`。

---

## Astro SSR 适配器对比

Astro 通过 **适配器（Adapter）** 决定 SSR 的输出格式。不同适配器生成的产物差异显著，
直接决定了运行时的实现复杂度。

| 适配器 | 输出格式 | 运行时要求 | 本项目可行性 |
|---|---|---|---|
| `@astrojs/netlify` | 单文件 CJS bundle + 原生 Web API | Netlify Functions / 任意 JS 运行时 | ✅ **选用** |
| `@astrojs/node` | ESM + Node built-ins | Node.js（需要 `fs`、`stream`、`http` 等） | ❌ 需要完整 Node |
| `@astrojs/cloudflare` | ESM + WinterCG API | Cloudflare Workers V8 Isolate | ❌ 需要 CF Workers 运行时 |
| `@astrojs/vercel` | ESM + Vercel Edge / Node | Vercel Edge Runtime 或 Node | ❌ 强依赖平台 |
| `@astrojs/deno` | ESM + Deno API | Deno 运行时 | ❌ 需要 Deno |

---

## 为何选择 `@astrojs/netlify`

### 1. 最小化运行时依赖

`@astrojs/netlify` 使用 esbuild 将 SSR 入口打包为**单个自包含 CJS 文件**，
所有第三方依赖已内联，无需 `node_modules`。

对比 `@astrojs/node`：产物是 ESM 模块树，依赖 `fs`、`stream`、`child_process`、`http` 等 Node 内置模块。
在 goja 中模拟完整 Node.js 内置模块不现实，而 Netlify 适配器只依赖 **Web Platform API**（已由 polyfills 覆盖）。

### 2. 标准 Web API 接口

handler 签名为标准 Web API 类型：

```typescript
async function handler(
  request: Request,    // Web API Request
  context: NetlifyContext
): Promise<Response>   // Web API Response
```

`Request` / `Response` 是浏览器规范定义的标准类型，在 goja 中可完整 polyfill，
而无需模拟 `http.IncomingMessage` / `http.ServerResponse` 等 Node.js 特有类型。

### 3. 产物稳定，esbuild 可独立再打包

Netlify 适配器的产物已经是 esbuild 打包的结果，但 entry 仍是 `.mjs` 格式（有 `import.meta`）。
本项目在运行时用 esbuild 再次打包为 IIFE 格式并降级到 ES2017，使 goja 可以一次完成加载。

### 4. Netlify Context 可低成本 mock

`@astrojs/netlify` 要求传入一个 `NetlifyContext` 对象，其属性（`geo`、`ip`、`requestId` 等）
对 SSR 渲染结果无实质影响（页面逻辑一般不读取 geo 信息）。
`glue.js` 中用 mock 数据填充，成本极低。

如果选用 `@astrojs/cloudflare`，则需要 mock Cloudflare 特有的 `ExecutionContext`、KV namespace、D1 等，
复杂度远高于 Netlify Context。

### 5. 生产可用

`@astrojs/netlify` 是 Astro 官方维护的一等适配器（与 `@astrojs/node` 并列），
版本更新及时，Astro 新特性（Sessions、Actions 等）均第一时间支持。

---

## 运行时架构选择：Go + goja

### 为何不用 Node.js 子进程

最直接的方案是用 `os/exec` 启动 `node` 子进程执行 SSR。但这会引入：
- 每次请求启动新进程（冷启动 100ms+）或需要维护长连接子进程的 IPC 协议
- 对宿主机 Node.js 版本的依赖（模板使用者可能没有 Node）
- 进程崩溃传播、信号处理等复杂性

### 为何选择 goja/sobek

| 属性 | goja/sobek | QuickJS (已移除) | V8 |
|---|---|---|---|
| ES 规范支持 | ES2020+（async/await）| ES2023（QuickJS-NG） | ES2023+ |
| 无 CGO | ✅ 纯 Go | ✅（via wazero WASM）| ❌（需要 CGO） |
| 单文件二进制 | ✅ | ✅ | ❌（需要动态库） |
| 内存占用 | 低（约 90 KB/请求） | 高（约 1.7 MB/请求） | — |
| 执行速度 | 3× 快于 QJS | 基准 | JIT，更快 |
| 并发 I/O | ✅ 原生 goroutine | 需要跨 WASM 边界 | — |

**选择 goja 的原因**（benchmark 数据见 [benchmark.md](./benchmark.md)）：

- **内存效率**：每次请求内存分配约 90 KB vs QuickJS 的 1.7 MB（19× 更少），低内存压力下 Pool 可配置更大
- **执行速度**：相同工作负载下比 QuickJS bytecode 解释器快 3×（76,588 ns vs 231,741 ns/op）
- **响应延迟**：goja 端到端延迟 ~78ms vs QJS ~103ms；QJS 的 WASM 边界 I/O（response.write 67ms vs 10ms）抵消了 js.eval 优势
- **并发稳定性**：goja 使用原生 Go goroutine，无 WASM 单线程约束；QuickJS 在并发模式下存在已知 Await() hang 问题
- **二进制体积**：移除 wazero + QuickJS WASM 后二进制更小，部署更轻量

### QuickJS 移除历史

早期版本同时支持 QuickJS（`-tags qjs`）和 goja 双引擎：
- QJS 作为默认引擎（启动时字节码缓存，冷启动 ~5ms vs goja ~1ms）
- goja 作为轻量备选（执行快 3×，内存少 19×）

**移除原因**：综合 benchmark 评估后，goja 在实际 Astro 应用中各维度综合优于 QJS：
执行速度更快、内存更低、I/O 延迟更低、无 WASM 并发问题。
QJS 的字节码缓存优势（更快冷启动）不足以弥补运行时劣势。
移除 QJS 依赖（`dxkite/qjs` + `tetratelabs/wazero`）同时减小了二进制体积和维护负担。

### Pool 模型与 BFF Render

```
请求 1 ──▶ Pool.Get() ──▶ Runtime A ──▶ Pool.Put(A)
请求 2 ──▶ Pool.Get() ──▶ Runtime B ──▶ Pool.Put(B)
请求 3 ──▶ Pool.Get() ──▶ Runtime A（复用）──▶ Pool.Put(A)
```

每个 runtime 持有独立 JS heap，模块级变量（如内存中的购物车数据）在同一 runtime
的连续请求之间持久化，但不跨 runtime 共享。这与 Netlify Functions 的单实例行为一致。

Pool size 默认为 CPU 核心数（限制 [2, 8]），可根据 BFF 服务的并发压力调整。
