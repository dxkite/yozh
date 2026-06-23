---
name: build-pack
version: 1.0.0
description: "打包集成测试数据：将 examples/example 构建为 integration/testdata/example/bundle.mjs 和 example.pack。触发场景：修改 example 源码后需更新测试数据、首次搭建集成测试环境、运行 go test ./integration/... 前。"
---

# build-pack 工作规范

## 概述

将 `examples/example`（Astro + Netlify 适配器示例应用）打包为集成测试所需的两个产物，输出到 `integration/testdata/example/`：

- `bundle.mjs` — 自包含 JS bundle，供 `sharedPool` / `sessionPool` 使用
- `example.pack` — 含 bundle.bc + dist/ 的部署包，供 `packRT` 使用

所有命令在项目根目录 `astro-runtime/astro-runtime` 下执行（PowerShell）。

---

## 前置条件

`examples/example/.npmrc` 必须包含 `node-linker=hoisted`，否则 esbuild 无法从 pnpm 虚拟存储解析依赖。

检查：
```powershell
Get-Content examples\example\.npmrc
```

若文件不存在或缺少该行，创建：
```powershell
"node-linker=hoisted`n" | Set-Content examples\example\.npmrc -Encoding utf8
cd examples\example; pnpm install; cd ..\..
```

---

## 步骤

### 1. 构建 CLI

```powershell
go build -o astro-runtime.exe ./cmd
```

### 2. 确认 example 已 build（产物存在）

```powershell
Test-Path examples\example\.netlify\build\entry.mjs
```

若返回 `False`，先执行：
```powershell
cd examples\example; pnpm build; cd ..\..
```

### 3. 创建输出目录

```powershell
New-Item -ItemType Directory -Force integration\testdata\example | Out-Null
```

### 4. 生成 bundle.mjs

```powershell
.\astro-runtime.exe build --plain `
  --entry examples\example\.netlify\build\entry.mjs `
  --out integration\testdata\example\bundle.mjs
```

### 5. 生成 example.pack

```powershell
.\astro-runtime.exe build --pack `
  --entry examples\example\.netlify\build\entry.mjs `
  --dist examples\example\dist `
  --out integration\testdata\example\example.pack
```

---

## 验证

```powershell
Get-ChildItem integration\testdata\example\ |
  Select-Object Name, @{N='Size(KB)';E={[math]::Round($_.Length/1KB)}}
```

正常输出：

```
Name         Size(KB)
----         --------
bundle.mjs       1106
example.pack     1052
```

运行集成测试：

```powershell
go test ./integration/...
```

---

## 注意

- 修改 Astro 源码后需先 `pnpm build`（重建 `.netlify/build/entry.mjs`），再重新执行步骤 4、5
- `dist/` 目录（静态资源）仅打包进 `.pack`，不影响 `bundle.mjs`
- `node-linker=hoisted` 是必要条件；pnpm 默认使用虚拟存储，esbuild 无法直接解析
