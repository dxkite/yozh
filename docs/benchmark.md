# Benchmark: astro-runtime vs Node.js SSR

本报告对比 **astro-runtime（Go + QuickJS）** 与 **原生 Node.js V8** 在相同 Astro SSR 应用下的吞吐量、延迟、镜像大小与运行时资源消耗。

---

## 测试环境

| 项目 | 值 |
|---|---|
| 机器 | Apple M5（ARM64），10 CPU，11.72 GiB RAM |
| OS | macOS Darwin 25.4.0 |
| Go | 1.25.0 |
| Node.js | v24.14.1 |
| Docker | Desktop（Linux/ARM64 容器，10 vCPU） |
| 测试应用 | `examples/example`：商品列表、JSON API、动态路由（完整功能示例） |

### 两种测试方式

| 方式 | 工具 | 说明 |
|---|---|---|
| **Go benchmark** | `go test -bench` | astro-runtime 使用 `httptest.Server`（进程内，pool size=4）；Node.js 启动子进程，均通过 HTTP 客户端发请求，公平对比 |
| **Docker 容器** | `ab -n 3000 -c 32` | 两者各自构建 Docker 镜像，容器内运行，host 发压；astro-runtime pool size=8（由容器 CPU 数决定） |

---

## 性能测试

### Go Benchmark 结果

运行命令：

```bash
go test -run=^$ -bench=BenchmarkHTTP -benchtime=2s -count=1 ./integration/
```

| Benchmark | ns/op | RPS 等价 | 倍差（Node 基准） |
|---|---|---|---|
| **AstroRuntime / Home** | 351,005 | ~2,850 | 1× |
| **AstroRuntime / API** | 193,232 | ~5,176 | 1× |
| **AstroRuntime / Dynamic** | 264,965 | ~3,774 | 1× |
| Node.js / Home | 57,149 | ~17,500 | **6.1× 更快** |
| Node.js / API | 30,455 | ~32,834 | **6.4× 更快** |
| Node.js / Dynamic | 40,768 | ~24,529 | **6.5× 更快** |

> **注**：B/op 数值不具可比性——astro-runtime 的 B/op 包含 Go 堆上的 HTML body、SSR 上下文等全部分配；Node.js 的 B/op 仅为 Go HTTP 客户端侧分配，V8 堆不计入。

**结论**：纯计算速度上，V8 JIT 比 QuickJS bytecode 解释器快 **~6×**，符合两种引擎的设计定位。

---

### Docker 容器测试结果

运行命令（两个容器分别测试）：

```bash
ab -n 3000 -c 32 http://localhost:18081/api/products   # astro-runtime
ab -n 3000 -c 32 http://localhost:18082/api/products   # node-ssr
```

#### `/api/products`（JSON API，轻计算）

| | RPS | 平均延迟 | 并发延迟 |
|---|---|---|---|
| astro-runtime | 2,368 | 13.5 ms | 0.42 ms |
| Node.js | **8,952** | **3.6 ms** | **0.11 ms** |
| 倍差 | Node.js **3.8×** 更快 | — | — |

#### `/`（首页，含 fetch + HTML 渲染）

| | RPS | 平均延迟 | 并发延迟 |
|---|---|---|---|
| **astro-runtime** | **2,237** | **14.3 ms** | **0.45 ms** |
| Node.js | 1,190 | 26.9 ms | 0.84 ms |
| 倍差 | astro-runtime **1.9×** 更快 | — | — |

**关键发现**：

- **简单 JSON API**：V8 JIT 编译热路径优势显著，Node.js 领先 3.8×。
- **复杂页面渲染**（含 outbound fetch → 渲染 HTML）：astro-runtime 的 8 个并行 QJS worker 在 c=32 高并发下优于 Node.js 单线程事件循环，领先 1.9×。这是 Go goroutine 并发模型的结构性优势，而非 QuickJS 执行速度的优势。

---

## 镜像大小对比

| | astro-runtime | node-ssr | 差距 |
|---|---|---|---|
| 镜像大小（解压） | **42.4 MB** | 228 MB | node-ssr **5.4×** 更大 |
| 压缩后（push/pull） | **11.3 MB** | 58.5 MB | node-ssr **5.2×** 更大 |

### Layer 构成

**astro-runtime**（基于 `alpine:3.22`）：

| Layer | 大小 |
|---|---|
| alpine base | 10.2 MB |
| `ca-certificates` + `tzdata` | 3.3 MB |
| `astro-runtime` 静态二进制（含 QuickJS） | 17.6 MB |
| **合计** | **~31 MB** |

**node-ssr**（基于 `node:24-alpine`）：

| Layer | 大小 |
|---|---|
| alpine base | 10.3 MB |
| Node.js 二进制（V8 + libuv + openssl + npm） | 154 MB |
| Yarn | 5.4 MB |
| `node_server.mjs`（应用） | 4.1 KB |
| **合计** | **~170 MB** |

---

## 运行时资源

### 内存占用

| 状态 | astro-runtime | node-ssr |
|---|---|---|
| 空载（无请求） | 124.8 MiB | 135.4 MiB |
| 压测中（c=32） | 213 MiB | 197 MiB |

> astro-runtime 压测时内存略高于 Node.js，因为 pool size=8 的每个 QJS Runtime 持有独立的 JS 堆和字节码缓存。

### 进程 / 线程数

| | astro-runtime | node-ssr |
|---|---|---|
| 空载 PIDs | 9 | 7 |
| 压测 PIDs | 16 | 7 |

astro-runtime 压测时 PID 增加是因为 Go 的 submit worker pool（overflow goroutine）动态扩展；Node.js 进程数稳定（单线程事件循环）。

---

## 依赖分析

### 二进制与动态链接

| | astro-runtime | node-ssr |
|---|---|---|
| 主二进制 | `astro-runtime` 16.8 MB | `node` 120.7 MB |
| 编译方式 | 静态（`CGO_ENABLED=0`） | 动态链接 |
| 动态库依赖 | **无** | `libstdc++.so.6`、`libgcc_s.so.1`、`libc.musl` |
| 应用代码体积 | 含于二进制中 | `node_server.mjs` 4 KB（+ 运行时 entry.mjs 挂载） |

astro-runtime 编译为静态二进制，可在任何 `scratch` 或 `alpine` 基础镜像运行，无 C++ 运行时依赖。Node.js 需要 `libstdc++`（C++ 标准库，V8 依赖）。

### 外部挂载依赖

Node.js 容器运行时还依赖外部挂载的 `examples/example/` 目录（含 `node_modules/@astrojs/netlify` 等），这些不在镜像内，属于部署时依赖：

```
examples/example/.netlify/build/entry.mjs   — Netlify adapter 入口
examples/example/node_modules/              — 含 @astrojs/netlify、astro 等
```

astro-runtime 仅需 `bundle.pack`（单文件，含 bytecode + dist/），无 node_modules 依赖。

---

## 总结

| 维度 | 优势方 | 说明 |
|---|---|---|
| 简单 API 吞吐量 | Node.js V8 | V8 JIT 编译热路径；QuickJS 为 bytecode 解释器，无 JIT |
| 复杂页面并发渲染 | astro-runtime | Go pool 并行处理 outbound fetch + 渲染，胜过单线程事件循环 |
| 镜像大小 | astro-runtime | 5× 更小；单静态二进制，无 C++ 依赖 |
| 空载内存 | 持平 | 124 MiB vs 135 MiB |
| 冷启动 | astro-runtime | 无 Node.js VM 初始化；QJS 字节码加载 < 100ms |
| 部署依赖 | astro-runtime | 单 `.pack` 文件；Node.js 需要 `node_modules` 和完整 build 目录 |

**适用场景判断**：

- 对**纯计算速度**有极致要求（简单 JSON API、频繁调用的轻量端点）→ 考虑 Node.js
- 对**并发渲染复杂页面**（含 fetch 聚合、HTML 生成）、**镜像体积**、**部署简洁性**有要求 → astro-runtime 更适合

---

## 复现方法

### Go Benchmark

```bash
# 前置：构建 testdata（见 testing.md）
go test -run=^$ -bench=BenchmarkHTTP -benchtime=10s -count=3 ./integration/ 2>&1 | grep "^Bench"
```

### Docker 对比

```bash
# 构建并启动两个容器，自动压测后退出
./benchmark/docker_bench.sh

# 自定义参数
BENCH_PATH=/ BENCH_CONNS=64 BENCH_REQUESTS=5000 ./benchmark/docker_bench.sh

# 或手动操作
docker compose -f docker-compose.bench.yml -p astro-bench up -d
ab -n 3000 -c 32 http://localhost:18081/api/products   # astro-runtime
ab -n 3000 -c 32 http://localhost:18082/api/products   # node-ssr
docker compose -f docker-compose.bench.yml -p astro-bench down
```

### 相关文件

| 文件 | 说明 |
|---|---|
| `benchmark/node_server.mjs` | Node.js HTTP 服务，包装 Netlify adapter，镜像 bootstrap.mjs 适配逻辑 |
| `benchmark/Dockerfile.node` | node-ssr Docker 镜像定义 |
| `benchmark/docker_bench.sh` | 完整 Docker benchmark 编排脚本 |
| `docker-compose.bench.yml` | 两服务 compose 定义（含健康检查、端口映射） |
| `integration/bench_http_test.go` | Go 端到端 HTTP benchmark（`BenchmarkHTTP_AstroRuntime_*` / `BenchmarkHTTP_NodeJS_*`） |
