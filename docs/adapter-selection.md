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
本项目在运行时用 esbuild 将其转换为 goja 兼容的 ESM（`ConvertBundleForGoja`，参见
[docs/bundle.md](./bundle.md)），以模块方式一次性 eval 加载。

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

> **历史说明**：本项目早期曾同时支持 QuickJS（`dxkite/qjs`，经 wazero 运行 WASM）与
> goja（`grafana/sobek`，纯 Go）两种引擎，通过 `EngineKind` 切换。QuickJS 引擎已从代码库
> 中完全移除，goja 现在是唯一的 JS 引擎。

### 为何不用 Node.js 子进程

最直接的方案是用 `os/exec` 启动 `node` 子进程执行 SSR。但这会引入：
- 每次请求启动新进程（冷启动 100ms+）或需要维护长连接子进程的 IPC 协议
- 对宿主机 Node.js 版本的依赖（模板使用者可能没有 Node）
- 进程崩溃传播、信号处理等复杂性

### 为何选择 goja（`grafana/sobek`）

| 属性 | goja / sobek |
|---|---|
| ES 规范支持 | 现代 ES（`for-await-of`/`async function*` 等需 esbuild 降级到 ES2017，见 docs/bundle.md） |
| 异步（async/await） | ✅ 支持；`SetGoAsyncFunc` 注册的宿主函数派发到独立 goroutine 真正并发执行（见下方） |
| 无 CGO | ✅ 纯 Go，无 CGO、无 WASM 运行时 |
| 单文件二进制 | ✅ |
| 冷启动 | 快（无 WASM 初始化、无字节码编译步骤，直接 eval 源码） |

goja/sobek 满足核心要求：纯 Go、无 CGO、单二进制分发、Pool 模型天然支持并发
（每个 runtime 独立 JS heap，互不共享内存）。

### 并发 fetch：自建事件循环

sobek 本身不提供事件循环（无内置 `setTimeout`/任务队列调度，需嵌入方自行实现）。
`internal/runtime/engine_goja.go` 的 `SetGoAsyncFunc`（目前唯一使用者是 `__go_fetchRaw`）
不会同步阻塞调用宿主函数，而是：

1. 立即通过 `rt.NewPromise()` 返回一个 pending 状态的 Promise；
2. 把真正的工作（网络请求）放到一个独立 goroutine 里执行；
3. 该 goroutine 完成后，把"调用 resolve/reject"这个动作作为一个 `func()` 投递到
   `gojaContext.pending` channel；
4. 持有 `*sobek.Runtime` 的那个 goroutine（`Eval` 内部的 `pumpUntilSettled` 循环）从
   `pending` 里取出并执行这个 job——这一步必须在 Runtime 的"所有权 goroutine"上进行，
   因为 sobek 明确声明 `Runtime` 非并发安全，`resolve`/`reject` 也不能跨 goroutine 并行调用。

`pending` channel 按每次顶层 `Eval` 调用重新创建（而不是常驻复用），避免同一个
`*sobek.Runtime`（Pool 会在多个请求间顺序复用同一个 runtime 实例）出现"上一个请求的
后台任务迟到、被下一个请求的循环误收"的串扰问题。

这样 JS 侧 `Promise.allSettled([fetch(a), fetch(b), fetch(c)])` 这类写法，三个 `fetch()`
会各自在独立 goroutine 里真正并发发起网络请求，总耗时约等于最慢的那一个，而不是三者之和。

### Pool 模型与 BFF Render

```
请求 1 ──▶ Pool.Get() ──▶ Runtime A ──▶ Pool.Put(A)
请求 2 ──▶ Pool.Get() ──▶ Runtime B ──▶ Pool.Put(B)
请求 3 ──▶ Pool.Get() ──▶ Runtime A（复用）──▶ Pool.Put(A)
```

每个 runtime 持有独立 JS heap，模块级变量（如内存中的购物车数据）在同一 runtime
的连续请求之间持久化，但不跨 runtime 共享。这与 Netlify Functions 的单实例行为一致。

Pool size 默认为 CPU 核心数（限制 [2, 8]），可根据 BFF 服务的并发压力调整。
