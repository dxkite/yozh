---
name: build-pack
version: 1.2.0
description: "打包产物管理：① 集成测试数据——将 examples/example 构建为 integration/testdata/example/bundle.mjs 和 example.pack；② 生产环境部署——将 astro-koharu 的 SSR bundle 打包为 .pack 并更新 Docker 容器。触发场景：修改 astro-runtime 源码或 Astro 应用后需更新产物、首次搭建集成测试环境、运行 go test ./integration/... 前、生产/测试容器需热更新时。"
---

# build-pack 工作规范

## 概述

- `bundle.mjs` — 自包含 JS bundle，供 `sharedPool` / `sessionPool` 使用
- `example.pack` — 含 bundle.mjs（goja 格式）+ dist/ 的部署包，供 `packRT` 和 Docker 容器使用

Windows 命令见 [windows-cmd.md](./windows-cmd.md)。

---

## 场景一：集成测试数据

所有命令在 `astro-runtime/astro-runtime` 下执行。

### 前置条件

`examples/example/.npmrc` 必须包含 `node-linker=hoisted`，否则 esbuild 无法从 pnpm 虚拟存储解析依赖：

```bash
cat examples/example/.npmrc
# 若缺少，执行：
echo "node-linker=hoisted" >> examples/example/.npmrc
cd examples/example && pnpm install && cd ../..
```

### 步骤

```bash
# 1. 构建 CLI
go build -o astro-runtime ./cmd

# 2. 确认 example 已 build，否则先构建
ls examples/example/.netlify/build/entry.mjs \
  || (cd examples/example && pnpm build && cd ../..)

# 3. 创建输出目录
mkdir -p integration/testdata/example

# 4. 生成 bundle.mjs
./astro-runtime build --plain \
  --entry examples/example/.netlify/build/entry.mjs \
  --out integration/testdata/example/bundle.mjs

# 5. 生成 example.pack
./astro-runtime build --pack \
  --entry examples/example/.netlify/build/entry.mjs \
  --dist examples/example/dist \
  --out integration/testdata/example/example.pack
```

### 验证

```bash
ls -lh integration/testdata/example/
# bundle.mjs ~1106 KB，example.pack ~1052 KB

go test ./integration/...
```

---

## 场景二：生产/测试环境部署（astro-koharu + Docker）

### 运行架构

| 容器 | 端口 | pack 来源 |
|------|------|----------|
| `astro-runtime-astro-run-*` | 8892 | `/tmp/koharu.pack` |
| `astro-runtime-astro-1` | 8891 | `/tmp/koharu.pack` |
| `koharu` | 4321 | 独立构建（nginx 静态） |

容器入口：`./astro-runtime serve --pack /data/bundle.pack --port 8080 --cache-dir /cache`

### 完整 rebuild 流程

```bash
# 1. 重建 Astro SSR bundle
cd /path/to/astro-koharu
pnpm exec astro build --config astro.ssr.config.mjs
# 产物：.netlify/build/entry.mjs

# 2. 打包为 .pack
cd /path/to/astro-runtime/astro-runtime
go run ./cmd build --pack \
  --entry /path/to/astro-koharu/.netlify/build/entry.mjs \
  --dist /path/to/astro-koharu/dist \
  --out /tmp/koharu.pack

# 3. 重启容器
docker restart astro-runtime-astro-run-ba26d28229d1

# 4. 验证
curl -s -o /dev/null -w "%{http_code}" http://localhost:8892/post/<slug>
# 期望：200
docker logs astro-runtime-astro-run-ba26d28229d1 --since 60s 2>&1 | grep -i error
# 期望：无输出
```

### 仅重建容器镜像（修改了 Go 源码时）

```bash
cd /path/to/astro-runtime/astro-runtime
PACK_FILE=/tmp/koharu.pack PORT=8892 docker compose up -d --build
```

> `Dockerfile` 已配置 `GOPROXY=https://goproxy.cn,direct` 和 `GONOSUMCHECK=*`，用于国内网络加速 Go 依赖下载。

### astro.ssr.config.mjs 说明

`astro-koharu` 有两份配置：

| 文件 | 输出模式 | 用途 |
|------|---------|------|
| `astro.config.mjs` | 静态（SSG） | `pnpm build`、nginx 部署 |
| `astro.ssr.config.mjs` | `output: 'server'` + Netlify 适配器 | astro-runtime |

**SSR 模式差异**：`getStaticPaths()` 的 `props` 在请求时不传递，页面只能通过 `Astro.params` 获取 URL 参数。依赖 `Astro.props` 的页面需实现 slug 降级查找。

---

## 注意事项

- 修改 Astro 源码 → 重跑步骤 1+2；仅改 Go 源码 → 跳过步骤 1
- `dist/` 仅打包进 `.pack`，不影响 `bundle.mjs`
- `node-linker=hoisted` 是 pnpm 项目必要条件，esbuild 无法解析 pnpm 虚拟存储
- `.pack` 包含 goja 格式的 bundle.mjs，容器启动时若配置了 `--cache-dir` 会复用 `/cache` 卷中已解压的 pack 目录，命中时跳过解压
