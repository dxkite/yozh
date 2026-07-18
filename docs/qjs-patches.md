# Code Review 报告：`x062201` vs `master`

> 基于 `git diff master...HEAD` 生成，覆盖所有非 test 文件变更。

---

## 一、模块重命名（`*_test.go`、`go.mod`）

**master 原有**：所有测试文件导入路径为 `github.com/fastschema/qjs`。

**改动原因**：fork 后归属变更，统一到 dxkite 命名空间。

**改动结果**：全量替换为 `github.com/dxkite/qjs`。

**风险**：无，纯路径替换不影响逻辑。

---

## 二、C 层 — 新增 `QJS_DrainEventLoop`（`eval.c`、`qjs.h`、`qjswasm.cmake`）

**master 原有**：不存在此函数。

**改动原因**：
Go 侧新增事件循环（见第七节）每次迭代需排空所有 JS 微任务。若继续在 Go 侧逐调 `QJS_ExecutePendingJob`，Astro SSR 的约 5322 个微任务需 5322 次 Go→WASM 往返（每次约 550µs 固定开销），累计约 **2.93s**。

**改动结果**：
```c
void QJS_DrainEventLoop(JSContext *ctx) {
    for (;;) {
        err = JS_ExecutePendingJob(JS_GetRuntime(ctx), &ctx1);
        if (err <= 0) break;
    }
}
```
单次 WASM 调用内处理完所有微任务，导出至 WASM。

**风险**：
不调用 `js_os_run_jobs`，`os.setTimeout` 回调不触发。若误用于依赖 OS timer 的场景将静默失效，已通过第四节 `QJS_Eval` 分路规避。

---

## 三、C 层 — 新增 `QJS_StdLoop`（`eval.c`、`qjs.h`、`qjswasm.cmake`）

**master 原有**：不存在此函数，`js_std_loop` 仅在 `QJS_Eval` 内部直接调用，未对外导出。

**改动原因**：
Go 侧事件循环（第七节）需要一个兜底路径：Promise 持续 pending 且 1ms 内无 Go callback 时，触发 `os.setTimeout` 回调。直接导出 `js_std_loop` 会暴露内部符号，包装为 `QJS_StdLoop` 保持命名一致性。

**改动结果**：
```c
void QJS_StdLoop(JSContext *ctx) {
    js_std_loop(ctx);  // 排空微任务 + poll OS timer/fd 直到静默
}
```
导出至 WASM，仅在 `Await()` 1ms 超时 fallback 路径调用。

**风险**：
调用后阻塞至所有 OS timer 排空，长延迟 timer 会占用 WASM 线程。当前 SSR 场景 timer 均为短延迟背景任务，实测无影响。Promise 解决后不调用，避免 SSR 响应完毕后再等待 timer 阻塞归还 context。

---

## 四、C 层 — 新增 `QJS_ExecutePendingJob` / `QJS_IsPromisePending`（`helpers.c`、`qjswasm.cmake`）

**master 原有**：两者均不存在，Go 侧无法查询 Promise 状态。

**改动原因**：Go 侧事件循环需判断 Promise 是否已 settled 以决定是否退出循环。

**改动结果**：
```c
int QJS_ExecutePendingJob(JSContext *ctx) {
    JSContext *unused = NULL;
    return JS_ExecutePendingJob(JS_GetRuntime(ctx), &unused);
}
bool QJS_IsPromisePending(JSContext *ctx, JSValue v) {
    return JS_PromiseState(ctx, v) == JS_PROMISE_PENDING;
}
```
两者均导出至 WASM。

**风险**：低，纯封装，无逻辑变化。

---

## 五、C 层 — `QJS_Eval` 重构（`eval.c`）

**master 原有**：
```c
// 所有 eval 一律在 C 侧阻塞等待 Promise + 运行完整事件循环
if (JS_IsPromise(result))
    result = js_std_await(ctx, result);   // 阻塞等 Promise resolve
js_std_loop(ctx);                         // 包含 OS timer poll

// FlagAsync global 的 {value, done} 解包在 C 侧完成
bool is_async_global = is_global && is_async;
if (is_async_global) {
    JSAtom value_atom = JS_NewAtom(ctx, "value");
    result = JS_GetProperty(ctx, result, value_atom);
    ...
}
```
`qjs_eval_module` 同理：`js_std_await(promise)` + `js_std_loop()`。

**改动原因**：
1. **Go async 函数死锁**：`js_std_await` 阻塞期间，Go goroutine 的 resolve/reject 无处投递，Promise 永远不会 settle。
2. **SSR 3.1s 延迟**：Astro bundle 在 eval 期间注册了 OS timer，`js_std_loop` 内的 `js_os_run_jobs`（`poll()` 系统调用）会阻塞等待这些 timer 到期。SSR 的 5322 个微任务均为纯 JS，无需等 OS timer。

**改动结果**：
```c
JSValue QJS_Eval(JSContext *ctx, QJSEvalOptions opts) {
    bool is_async = (opts.eval_flags & JS_EVAL_FLAG_ASYNC) != 0;
    // ...
    // 不再 js_std_await：async Promise 由 Go 侧 Await() 驱动
    if (!is_module) {
        if (is_async)
            QJS_DrainEventLoop(ctx);  // SSR：只排微任务，跳过 OS timer poll
        else
            js_std_loop(ctx);         // 同步 eval：保持 os.setTimeout 正常触发
    }
    return result;  // async 路径直接返回未 settled 的 Promise
}
```
`qjs_eval_module` 同步改为 `QJS_DrainEventLoop`，移除 `js_std_await`。  
FlagAsync global 的 `{value, done}` 解包逻辑移至 Go 侧 `eval.go`。

**风险**：
- async eval 内的 `os.setTimeout` 在 `QJS_Eval` 阶段不触发，由 `Await()` 1ms fallback 兜底。当前 Astro SSR 的 Promise 不依赖 OS timer，为已知设计约束。
- 同步 eval 保持 `js_std_loop`，与 master 行为一致，`TestGoChannelToJs/SendSuccess`（100ms timer）验证无回归。

---

## 六、Go 层 — 新增 `Context.pendingCallbacks`、`SetGoFunc`、`SetGoAsyncFunc`（`context.go`、`runtime.go`）

**master 原有**：`Context` 无 `pendingCallbacks` 字段，无 `SetGoFunc`/`SetGoAsyncFunc`。Go async 函数若在独立 goroutine 中直接调用 WASM 存在跨 goroutine 竞态（WASM 单线程模型不允许并发调用）。

**改动原因**：
WASM 单线程模型要求所有 QJS/WASM 调用在同一 goroutine（QJS goroutine）执行。async Go 函数跑在独立 goroutine，完成后需要安全地将 resolve/reject 投递回 QJS goroutine 执行。

**改动结果**：
```go
// Context 新增字段
pendingCallbacks chan func()  // size=64

func (c *Context) postCallback(fn func()) {
    if c.pendingCallbacks != nil {
        c.pendingCallbacks <- fn  // 任意 goroutine 安全投递
    }
}

// SetGoFunc：同步调用，fn 在 QJS goroutine 上直接执行
func (c *Context) SetGoFunc(name string, fn GoFunction) { ... }

// SetGoAsyncFunc：args 在 QJS goroutine 预转换，fn 在独立 goroutine 执行，
// 结果通过 postCallback 安全回传 QJS goroutine
func (c *Context) SetGoAsyncFunc(name string, fn GoAsyncFunction) { ... }
```
`runtime.go` 中 `New()` 初始化：`pendingCallbacks: make(chan func(), 64)`。

**风险**：
- **channel 背压**：size=64，若 64 个 async 请求同时挂起而 `Await()` 未消费，第 65 个 `postCallback` 阻塞 goroutine。正常 SSR 单请求顺序处理不会触发。
- **`ch == nil` 静默丢弃**：非 `New()` 创建的 Context（如测试中手动构造），async 函数的 resolve/reject 会丢失，Promise 永远 pending。

---

## 七、Go 层 — `Await()` 新增 Go 驱动事件循环（`value.go`）

**master 原有**：
```go
func (v *Value) Await() (*Value, error) {
    if !v.IsPromise() {
        return nil, newInvalidJsInputErr("Promise", v)
    }
    result := v.Call("js_std_await", v.Ctx(), v.Raw())
    return normalizeJsValue(v.context, result)
}
```
单次 C 调用，阻塞等待，无法配合 Go goroutine 异步回调。

**改动原因**：
第五节 `QJS_Eval` 不再在 C 侧阻塞，async eval 直接返回未 settled 的 Promise。需要 Go 侧事件循环来驱动：排空 Go callbacks → 推进 JS 微任务 → 检查 settled → 循环。

**改动结果**：
```go
ch := v.context.pendingCallbacks
if ch == nil {
    // 旧路径兼容：无 channel 时退回 js_std_await
    result := v.Call("js_std_await", v.Ctx(), v.Raw())
    return normalizeJsValue(v.context, result)
}

for {
    // 1. 非阻塞排空 Go callbacks channel（async 函数的 resolve/reject）
    drained := false
    for { select { case fn := <-ch: fn(); drained=true; default: break } }

    // 2. 单次 WASM 调用处理所有 JS 微任务
    v.Call("QJS_DrainEventLoop", v.Ctx())

    // 3. Promise settled → 退出
    if !v.Call("QJS_IsPromisePending", v.Ctx(), v.Raw()).handle.Bool() { break }

    // 4. 本轮无进展时
    if !drained {
        select {
        case fn := <-ch: fn()                    // 等 Go callback（正常路径）
        case <-time.After(time.Millisecond):
            v.Call("QJS_StdLoop", v.Ctx())       // 1ms 超时后触发 OS timer（兜底路径）
        }
    }
}
result := v.Call("js_std_await", v.Ctx(), v.Raw())
```

**风险**：

| 风险点 | 说明 |
|---|---|
| `time.After(1ms)` 对象分配 | 每次 `!drained` 进入 select 均创建 timer 对象。正常 SSR 中 Go callback 到达 < 1ms，该分支极少触发，影响可忽略 |
| `QJS_StdLoop` 阻塞时长不可控 | 触发后阻塞至所有 OS timer 排空。若 bundle 有长延迟 timer 且 Go callback 恰好 > 1ms，短暂阻塞 WASM 线程 |
| 遗留 timer 泄露 | Go callback 始终 < 1ms 时 1ms fallback 不触发，async eval 注册的 background timer 残留至下次请求 opportunistic 触发。当前 Astro SSR background timer 无状态副作用，不影响正确性 |

---

## 八、Go 层 — `eval.go` 新增 Promise 自动 Await（`eval.go`）

**master 原有**：
```go
// eval() / load() 直接返回 QJS_Eval / QJS_Load 原始结果
result := c.Call("QJS_Eval", c.Raw(), evalOptions)
return normalizeJsValue(c, result)
// master 中 C 侧已阻塞解决 Promise，调用方收到的总是已解决值
```

**改动原因**：
第五节 `QJS_Eval` async 路径直接返回 Promise，调用方若不 Await 会拿到 Promise 对象而非结果值。FlagAsync global 的 `{value, done}` 解包从 C 移至 Go，逻辑更清晰便于测试。

**改动结果**：
```go
val, err := normalizeJsValue(c, result)
if val != nil && val.IsPromise() {
    resolved, awaitErr := val.Await()
    if isAsyncGlobal {
        return resolved.GetPropertyStr("value"), nil  // 解包 {value, done}
    }
    return resolved, nil
}
```
`load()` 同理新增 Promise 自动 Await。

**风险**：
- 调用方依赖拿到原始 Promise 对象的场景行为改变，当前 astro-runtime 调用方均不依赖此行为。
- `load()` module eval 若返回 Promise，现在阻塞等待，master 中直接返回 Promise 对象，属行为变更，影响范围限非 Astro 场景。

---

## 九、Go 层 — 新增类型 `GoFunction` / `GoAsyncFunction`（`value.go`、`jstogo.go`）

**master 原有**：不存在，仅有 `Function`（`func(ctx *This) (*Value, error)`）和 `AsyncFunction`（`func(ctx *This)`）。

**改动原因**：
原有类型需要手动处理 JS 值转换，对调用方侵入性强。提供 Go 原生类型签名的封装，隐藏 JS 值转换细节。

**改动结果**：
```go
GoFunction      func(ctx context.Context, args ...any) (any, error)
GoAsyncFunction func(ctx context.Context, args ...any) (any, error)
```
配套新增 `jsArgsToAny`（`jstogo.go`）：将 `[]*Value` 批量转换为 `[]any`，在 QJS goroutine 上执行。

**风险**：低，新增 API，不破坏现有接口。`jsArgsToAny` 对 null/undefined 跳过转换返回 nil，调用方需处理 nil 参数。

---

## 十、构建工具链（`qjswasm/Dockerfile*`、`build.sh`、`build.ps1`、`compile.sh`）

**master 原有**：均不存在，WASM 编译流程不在仓库内。

**改动结果**：

| 文件 | 作用 |
|---|---|
| `Dockerfile` | x86_64 构建镜像（含 wasi-sdk x86_64） |
| `Dockerfile.arm64` | arm64 构建镜像，使用 `wasi-sdk-24.0-arm64-linux`，解决 arm64 宿主无法运行 x86_64 wasi-sdk 的问题 |
| `build.sh` | Linux/macOS 入口：docker build → docker run compile.sh → 复制产物 |
| `build.ps1` | Windows PowerShell 入口，功能同 `build.sh` |
| `compile.sh` | 容器内执行：复制 patch 文件 → cmake 配置 → make → wasm-opt -O3 优化 |

**风险**：低，工具链变更不影响运行时行为，产物 `qjs.wasm` 已随代码提交。

---

## 总结

| # | 变更 | master 原有 | 改动原因 | 改动结果 | 主要风险 |
|---|---|---|---|---|---|
| 1 | 模块重命名 | `fastschema/qjs` | 归属变更 | `dxkite/qjs` | 无 |
| 2 | `QJS_DrainEventLoop` | 不存在 | 消除 5322 次 Go→WASM 往返 | 单次 WASM 调用排空所有微任务，2.93s→14µs | 不处理 OS timer，需配合分路使用 |
| 3 | `QJS_StdLoop` | 不存在 | Go 事件循环需 OS timer 兜底 | 1ms fallback 触发，修复 timer 依赖死锁 | 阻塞时长不可控，仅限 fallback 路径 |
| 4 | `QJS_ExecutePendingJob` / `QJS_IsPromisePending` | 不存在 | Go 事件循环需查询 Promise 状态 | 导出 WASM，Go 侧可判断退出条件 | 低 |
| 5 | `QJS_Eval` 重构 | C 侧阻塞 `js_std_await + js_std_loop` | Go async 死锁 + SSR 3.1s 阻塞 | async→`QJS_DrainEventLoop`，sync→`js_std_loop` | async OS timer 依赖由 Await 兜底 |
| 6 | `pendingCallbacks` + `SetGoAsyncFunc` | 不存在 | Go goroutine 结果需安全回传 QJS goroutine | channel size=64，Await 消费 | channel 满阻塞；nil context 丢弃回调 |
| 7 | `Await()` Go 事件循环 | 单行 `js_std_await` | C 侧不再阻塞，需 Go 驱动 | drain callbacks → DrainEventLoop → 1ms fallback | `time.After` 分配；background timer 泄露 |
| 8 | `eval.go` 自动 Await | 返回原始 JSValue | `QJS_Eval` async 返回未 settled Promise | 自动检测并 Await，FlagAsync 解包移至 Go | 依赖原始 Promise 的调用方行为变更 |
| 9 | `GoFunction` / `GoAsyncFunction` | 不存在 | 隐藏 JS 值转换细节，简化调用方 | Go 原生类型签名的函数注册 API | 低，新增 API 不破坏现有接口 |
| 10 | 构建工具链 | 不存在 | WASM 编译流程需可复现 | arm64/x86_64 双镜像 + 跨平台脚本 | 无 |
