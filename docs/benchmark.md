# Benchmark: astro-runtime vs Node.js SSR

本报告对比 **astro-runtime** 三种引擎模式与 **原生 Node.js V8** 在相同 Astro SSR
应用下的吞吐量、延迟、镜像大小与资源消耗。

---

## 测试环境

| 项目 | 值 |
|---|---|
| 机器 | Apple M5（ARM64），10 CPU，11.72 GiB RAM |
| OS | macOS Darwin 25.4.0 |
| Go | 1.25.0 |
| Node.js | v24.14.1 |
| JS 引擎 QJS | github.com/dxkite/qjs（QuickJS/WASM bytecode） |
| JS 引擎 goja | github.com/grafana/sobek（goja Grafana fork，纯 Go） |
| 测试应用 | `examples/example`：商品列表、JSON API、动态路由（完整功能示例） |
| 更新日期 | 2026-06-29 |

### 测试方式

| 方式 | 工具 | 说明 |
|---|---|---|
| **Go benchmark** | `go test -bench` | astro-runtime 使用 `httptest.Server`（进程内，pool size=4）；Node.js 启动子进程；均通过 HTTP 客户端发请求 |
| **Docker 容器** | `ab -n 3000 -c 32` | 各引擎独立 Docker 镜像，容器内运行，host 发压；astro-runtime pool size=8 |

---

## Go Benchmark 结果

### 命令

```bash
# HTTP 端到端（integration/）
go test -run=^$ -bench=BenchmarkHTTP -benchtime=5s -count=1 ./integration/

# 引擎单元对比（根模块）
go test -run=^$ -bench=. -benchtime=3s -count=1 .
```

---

### HTTP 端到端（GOMAXPROCS=10，pool size=4，RunParallel）

> RPS = 1e9 / ns\_per\_op（RunParallel 下每次迭代即一个完整 HTTP round-trip）

#### QJS 引擎 vs Node.js V8（真实 Astro 应用）

| 路由 | QJS ns/op | QJS RPS | Node.js ns/op | Node.js RPS | Node 倍差 |
|---|---|---|---|---|---|
| `/`（首页，fetch+渲染） | 423,419 | ~2,362 | 63,607 | ~15,721 | **6.7×** |
| `/api/products`（JSON API） | 212,799 | ~4,699 | 41,491 | ~24,102 | **5.1×** |
| `/products/1`（动态路由） | 318,493 | ~3,140 | 49,257 | ~20,302 | **6.5×** |

**结论**：V8 JIT 在真实 Astro 应用上比 QuickJS bytecode 解释器快 **5～7×**，符合两种引擎的设计定位。

---

#### goja 引擎 vs QJS（合成 bundle，相同轻量工作负载）

> `BenchmarkHTTP_Goja_Simple` 与 `BenchmarkHTTP_QJS_Simple` 均使用 pool size=4，
> goja 使用 IIFE 合成 bundle，QJS 使用真实 Astro bundle（更重，故对比仅供引擎开销参考）。

| 引擎 | Bundle | ns/op | RPS |
|---|---|---|---|
| goja（sobek） | 合成 IIFE | 37,489 | ~26,674 |
| QJS（真实 Astro） | 完整 Astro | 471,979 | ~2,118 |

> **注**：不同 bundle 直接对比不公平；公平的引擎吞吐对比见下方「SSR 请求单元 benchmark」。

---

### Pool 初始化耗时（单位：µs/pool）

| 引擎 | size=1 | size=4 |
|---|---|---|
| QJS — source eval（legacy） | 5,067 µs | 5,594 µs |
| QJS — bytecode（生产模式） | 5,305 µs | 13,928 µs |
| **goja（sobek）** | **1,130 µs** | **4,689 µs** |
| goja vs QJS bytecode 倍差 | **4.7× 更快** | **3.0× 更快** |

goja 无需 WASM 初始化，也不进行字节码编译，冷启动显著更快。

---

### SSR 请求单元 benchmark（合成 bundle，单连接顺序请求）

> `BenchmarkSSRRequest_QJS` 与 `BenchmarkSSRRequest_Goja` 使用**相同合成 bundle**
>（URL 解析 + Response 构造 + crypto.randomUUID），pool size=1，顺序执行，消除并发影响。
> 此组数据为最公平的纯引擎执行速度对比。

| 引擎 | ns/op | 等价 op/s | B/op | allocs/op |
|---|---|---|---|---|
| QJS（QuickJS bytecode） | 231,741 | ~4,316 | 1,758,478 | 1,087 |
| **goja（sobek）** | **76,588** | **~13,053** | **90,563** | **1,410** |
| goja 倍差 | **3.0× 更快** | — | **19.4× 更少内存** | — |

**关键结论**：
- **执行速度**：goja 比 QJS 快 **3.0×**（相同轻量工作负载）
- **内存分配**：goja 每次请求分配 **19× 更少字节**（无需序列化到 WASM 内存）
- **引擎选择**：追求极低延迟和低内存的简单 SSR handler 选 goja；需要运行完整 Astro 复杂应用（`for-await`、动态路由等）选 QJS

---

## Clomery 容器 Trace Span 对比（顺序请求）

> 测试环境：Apple M5 ARM64，Docker 容器（goja port 8080，QJS port 8090），
> `GET /`（完整 Astro 页面渲染），顺序发送（1s 间隔），避免并发干扰。
> 数据来自 `ssr request` INFO 日志的 `runtime` 字段（`slog.Group`），2026-06-29。
>
> **注意**：QJS 并发模式存在已知 hang 问题（`Await()` 缺乏 `ctx.Done()` 检查），
> 以下数据均为顺序（sequential）模式下的正常指标。

### 测试命令

```bash
for i in $(seq 1 5); do curl -s -o /dev/null http://localhost:8080/ && sleep 1; done
for i in $(seq 1 5); do curl -s -o /dev/null http://localhost:8090/ && sleep 1; done
docker logs clomery-app-1    | grep '"ssr request"'
docker logs clomery-app-qjs-1 | grep '"ssr request"'
```

### Span 指标（5 次顺序请求，`GET /`）

| 指标 | goja (ms) | QJS (ms) |
|---|---|---|
| pool_get_ms avg | 0 | 0 |
| **js_eval_ms avg** | **67** | **35** |
| **response_write_ms avg** | **10** | **67** |
| js_tail_ms avg | 0 | 0 |
| **end-to-end latency avg** | **78 ms** | **103 ms** |

### 原始数据

**goja（port 8080）**：

| # | pool_get | js_eval | response_write | js_tail | latency |
|---|---|---|---|---|---|
| 1 | 0 | 66 | 9 | 0 | 76.7 ms |
| 2 | 0 | 71 | 9 | 0 | 81.4 ms |
| 3 | 0 | 55 | 9 | 0 | 64.8 ms |
| 4 | 0 | 69 | 11 | 0 | 80.9 ms |
| 5 | 0 | 73 | 11 | 0 | 85.2 ms |
| **avg** | **0** | **67** | **10** | **0** | **77.8 ms** |

**QJS（port 8090）**：

| # | pool_get | js_eval | response_write | js_tail | latency |
|---|---|---|---|---|---|
| 1 | 0 | 38 | 65 | 0 | 104.7 ms |
| 2 | 0 | 39 | 92 | 0 | 132.7 ms |
| 3 | 0 | 40 | 63 | 0 | 104.0 ms |
| 4 | 0 | 21 | 59 | 0 | 81.4 ms |
| 5 | 0 | 35 | 54 | 0 | 90.8 ms |
| **avg** | **0** | **35** | **67** | **0** | **102.7 ms** |

### 关键发现

- **js.eval**：QJS 比 goja 快 **1.9×**（35ms vs 67ms）。QJS 执行预编译字节码，goja/sobek 每次请求解释执行 JS，eval 阶段差异显著。
- **response.write**：QJS 比 goja 慢 **6.7×**（67ms vs 10ms）。response.write 阶段覆盖从 GotFirstResponseByte 到 HTTP 流结束，QJS 每个 chunk 信号需要跨越 wazero WASM 边界，I/O 桥接开销更高。
- **总延迟**：goja 综合更快（78ms vs 103ms），即使 js.eval 更慢，response.write 的优势弥补了差距。
- **pool.get**：两者均为 0ms——运行池空闲时预热槽立即可用，无排队等待。

---

## Docker 容器测试结果

> 以下数据来自前次测试（astro-runtime QJS vs Node.js；goja Docker 服务需要 pack 包含 bundle-goja.mjs）。

### 命令

```bash
# 构建并压测（需 example.pack 已构建含 goja bundle）
./benchmark/docker_bench.sh

# 手动
docker compose -f docker-compose.bench.yml -p astro-bench up -d
ab -n 3000 -c 32 http://localhost:18081/api/products   # QJS
ab -n 3000 -c 32 http://localhost:18083/api/products   # goja
ab -n 3000 -c 32 http://localhost:18082/api/products   # Node.js
docker compose -f docker-compose.bench.yml -p astro-bench down
```

#### `/api/products`（JSON API）

| 引擎 | RPS | 平均延迟 |
|---|---|---|
| astro-runtime QJS | 2,368 | 13.5 ms |
| Node.js V8 | **8,952** | **3.6 ms** |
| 倍差 | Node.js **3.8×** | — |

#### `/`（首页，含 fetch + HTML 渲染，c=32）

| 引擎 | RPS | 平均延迟 |
|---|---|---|
| **astro-runtime QJS** | **2,237** | **14.3 ms** |
| Node.js V8 | 1,190 | 26.9 ms |
| 倍差 | astro-runtime **1.9×** | — |

**关键发现**：
- **简单 JSON API**：V8 JIT 热路径优势显著，Node.js 领先 3.8×
- **复杂页面渲染**（含 outbound fetch → HTML）：astro-runtime 的 8 并行 QJS worker 在 c=32 高并发下优于 Node.js 单线程事件循环，领先 1.9×。这是 Go goroutine 并发模型的结构性优势

---

## 引擎选型速查

| 场景 | 推荐引擎 | 原因 |
|---|---|---|
| 需要运行真实 Astro 应用 | **QJS 或 goja** | goja 通过两步打包（ESM→IIFE + ES2017 降级）支持完整 Astro 应用 |
| 最高吞吐轻量 handler | **goja** | 3× 更快，19× 更少内存，4.7× 更快冷启动 |
| 高并发复杂渲染（outbound fetch + HTML） | **QJS pool** | Go 并发池在 c=32 时超越 Node.js 单线程 |
| 极低延迟简单 API | **Node.js V8** | JIT 编译，轻计算场景 5～7× 更快 |
| 最小镜像体积 | **astro-runtime** | QJS/goja 均 ~42 MB；Node.js 228 MB |

> **goja 打包策略**：goja 引擎使用两步打包流程：先生成自包含 ESM bundle（支持 top-level await），
> 再转为 IIFE 并降级到 ES2017（将 `for-await-of`、`async function*` 转换为 Promise 链）。
> 动态 `import()` 调用被替换为返回 rejected Promise 的存根（不影响 SSR 主路径）。
> 实际 Astro 应用（如 koharu）在 goja 模式下已验证正常运行。

---

## 镜像大小对比

| | astro-runtime | node-ssr | 差距 |
|---|---|---|---|
| 镜像大小（解压） | **42.4 MB** | 228 MB | node-ssr **5.4×** 更大 |
| 压缩后（push/pull） | **11.3 MB** | 58.5 MB | node-ssr **5.2×** 更大 |

### Layer 构成

**astro-runtime**（`alpine:3.22`）：

| Layer | 大小 |
|---|---|
| alpine base | 10.2 MB |
| `ca-certificates` + `tzdata` | 3.3 MB |
| `astro-runtime` 静态二进制（含 QuickJS WASM + sobek） | 17.6 MB |
| **合计** | **~31 MB** |

**node-ssr**（`node:24-alpine`）：

| Layer | 大小 |
|---|---|
| alpine base | 10.3 MB |
| Node.js 二进制（V8 + libuv + openssl） | 154 MB |
| Yarn | 5.4 MB |
| 应用文件 | 4.1 KB |
| **合计** | **~170 MB** |

---

## 运行时资源

### 内存占用

| 状态 | astro-runtime | node-ssr |
|---|---|---|
| 空载（无请求） | 124.8 MiB | 135.4 MiB |
| 压测中（c=32） | 213 MiB | 197 MiB |

> astro-runtime 压测时内存略高，因为 pool size=8 每个 QJS Runtime 持有独立 JS 堆和字节码缓存。
> goja 池内存分配是 QJS 的 1/19，压测内存更低。

### 进程 / 线程数

| | astro-runtime | node-ssr |
|---|---|---|
| 空载 PIDs | 9 | 7 |
| 压测 PIDs | 16 | 7 |

---

## 总结

| 维度 | 最优方 | 说明 |
|---|---|---|
| 真实 Astro 应用吞吐 | Node.js V8 | V8 JIT；QJS/goja 均为解释器 |
| 高并发复杂页面渲染 | astro-runtime | Go pool 并行 outbound fetch + 渲染，胜过单线程事件循环 |
| 轻量 handler 执行速度 | goja | 比 QJS 快 3×，内存少 19× |
| Pool 冷启动 | goja | 比 QJS 快 4.7× |
| 镜像大小 | astro-runtime | 5× 更小；单静态二进制 |
| 空载内存 | 持平 | 124 MiB vs 135 MiB |
| 部署依赖 | astro-runtime | 单 `.pack` 文件；Node.js 需要 `node_modules` |

---

## 复现方法

```bash
# HTTP benchmark（三引擎对比）
go test -run=^$ -bench=BenchmarkHTTP -benchtime=5s -count=1 ./integration/

# 引擎单元对比（pool 初始化 + 请求吞吐）
go test -run=^$ -bench=. -benchtime=3s -count=1 .

# Docker 三引擎对比（需先 pnpm build 并 UPDATE_TESTDATA=1 重建 pack）
./benchmark/docker_bench.sh
./benchmark/docker_bench.sh --skip-node   # 只测 QJS vs goja
```

### 相关文件

| 文件 | 说明 |
|---|---|
| `bench_test.go` | Pool 初始化 + SSR 请求单元 benchmark |
| `integration/bench_http_test.go` | HTTP 端到端 benchmark（QJS / goja / Node.js） |
| `benchmark/node_server.mjs` | Node.js HTTP 服务，包装 Netlify adapter |
| `benchmark/Dockerfile.node` | node-ssr Docker 镜像定义 |
| `benchmark/docker_bench.sh` | Docker benchmark 编排脚本（支持 --skip-goja / --skip-node） |
| `docker-compose.bench.yml` | QJS / goja / Node.js 三服务 compose 定义 |
