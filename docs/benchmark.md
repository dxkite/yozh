# Benchmark: yozh (goja) vs Node.js SSR

本报告对比 **yozh**（goja/sobek 引擎）与**原生 Node.js V8** 在相同 Astro SSR
应用下的吞吐量、延迟、镜像大小与资源消耗。

> **说明**：yozh 曾同时支持 QuickJS（WASM）与 goja 两种引擎，本报告早前版本包含
> 两者的详细对比数据。QuickJS 引擎已从代码库中完全移除，goja 是现在唯一的 JS 引擎，
> 因此所有 QuickJS 相关的对比数据已从本报告中删除（历史数据不再对应任何可运行的配置）。
> 下方 Docker 容器测试、Clomery trace span 对比等章节需要基于当前（goja-only）代码库重新
> 采集数据；在重新采集之前，这些章节暂缺。

---

## 测试环境

| 项目 | 值 |
|---|---|
| 机器 | Apple M5（ARM64），10 CPU，11.72 GiB RAM |
| OS | macOS Darwin 25.4.0 |
| Go | 1.25.0 |
| Node.js | v24.14.1 |
| JS 引擎 | goja（github.com/grafana/sobek，纯 Go） |
| 测试应用 | `examples/example`：商品列表、JSON API、动态路由（完整功能示例） |
| 更新日期 | 2026-06-29（goja 独立数据；QJS 对比数据已移除） |

### 测试方式

| 方式 | 工具 | 说明 |
|---|---|---|
| **Go benchmark** | `go test -bench` | yozh 使用 `httptest.Server`（进程内，pool size=4）；Node.js 启动子进程；均通过 HTTP 客户端发请求 |
| **Docker 容器** | `ab -n 3000 -c 32` | 各引擎独立 Docker 镜像，容器内运行，host 发压；yozh pool size=8 |

---

## Go Benchmark 结果

### 命令

```bash
# HTTP 端到端（integration/）
go test -run=^$ -bench=BenchmarkHTTP -benchtime=5s -count=1 ./integration/

# 引擎单元 benchmark（根模块）
go test -run=^$ -bench=. -benchtime=3s -count=1 .
```

---

### Pool 初始化耗时（单位：µs/pool，goja/sobek）

| size | 耗时 |
|---|---|
| 1 | 1,130 µs |
| 4 | 4,689 µs |

goja 无需 WASM 初始化、无字节码编译步骤，冷启动开销主要来自 polyfill 源码 eval。

---

### SSR 请求单元 benchmark（合成 bundle，单连接顺序请求，goja/sobek）

> `BenchmarkSSRRequest_Goja` 使用合成 bundle（URL 解析 + Response 构造 + crypto.randomUUID），
> pool size=1，顺序执行，消除并发影响。

| ns/op | 等价 op/s | B/op | allocs/op |
|---|---|---|---|
| 76,588 | ~13,053 | 90,563 | 1,410 |

---

## 引擎选型速查

| 场景 | 说明 |
|---|---|
| 需要运行真实 Astro 应用 | goja 通过两步打包（ESM→IIFE + ES2017 降级）支持完整 Astro 应用 |
| 极低延迟简单 API | Node.js V8 JIT 编译，轻计算场景通常更快，具体倍差需重新采集 |
| 最小镜像体积 | yozh 单静态二进制，显著小于包含 `node_modules` 的 Node.js 镜像 |

> **goja 打包策略**：goja 引擎使用两步打包流程：先生成自包含 ESM bundle（支持 top-level await），
> 再转为 IIFE 并降级到 ES2017（将 `for-await-of`、`async function*` 转换为 Promise 链）。
> 动态 `import()` 调用被替换为返回 rejected Promise 的存根（不影响 SSR 主路径）。
> 实际 Astro 应用（如 koharu）在 goja 模式下已验证正常运行。

---

## 镜像大小与运行时资源

> 以下历史数据（2026-06-29）采自包含 QuickJS WASM + sobek 的旧二进制，移除 QuickJS 引擎后
> 静态二进制体积会更小（不再链接 wazero WASM 运行时）。数值仅供数量级参考，精确对比需
> 用当前代码库重新构建镜像后重新测量。

| | yozh（旧，含 QJS+goja） | node-ssr | 差距 |
|---|---|---|---|
| 镜像大小（解压） | ~42.4 MB | 228 MB | node-ssr 更大 |
| 压缩后（push/pull） | ~11.3 MB | 58.5 MB | node-ssr 更大 |
| 空载内存 | 124.8 MiB | 135.4 MiB | 持平 |
| 压测中内存（c=32） | 213 MiB | 197 MiB | yozh 略高 |

---

## 复现方法

```bash
# 引擎单元对比（pool 初始化 + 请求吞吐，goja）
go test -run=^$ -bench=. -benchtime=3s -count=1 .

# HTTP benchmark（goja vs Node.js）
go test -run=^$ -bench=BenchmarkHTTP -benchtime=5s -count=1 ./integration/

# Docker 双服务对比（goja vs Node.js；需先 pnpm build 并 UPDATE_TESTDATA=1 重建 pack）
./benchmark/docker_bench.sh
./benchmark/docker_bench.sh --skip-node   # 只测 goja
```

### 相关文件

| 文件 | 说明 |
|---|---|
| `bench_test.go` | Pool 初始化 + SSR 请求单元 benchmark（goja） |
| `integration/bench_http_test.go` | HTTP 端到端 benchmark（goja / Node.js） |
| `benchmark/node_server.mjs` | Node.js HTTP 服务，包装 Netlify adapter |
| `benchmark/Dockerfile.node` | node-ssr Docker 镜像定义 |
| `benchmark/docker_bench.sh` | Docker benchmark 编排脚本（支持 `--skip-node`） |
| `docker-compose.bench.yml` | goja / Node.js 两服务 compose 定义 |
