# Windows 命令参考（PowerShell）

对应 [SKILL.md](./SKILL.md) 场景一（集成测试数据）的 Windows 等效命令。  
所有命令在 `astro-runtime/astro-runtime` 下执行。

---

## 前置条件

```powershell
Get-Content examples\example\.npmrc
# 若缺少 node-linker=hoisted：
"node-linker=hoisted`n" | Set-Content examples\example\.npmrc -Encoding utf8
cd examples\example; pnpm install; cd ..\..
```

## 步骤

```powershell
# 1. 构建 CLI
go build -o astro-runtime.exe ./cmd

# 2. 确认 example 已 build
Test-Path examples\example\.netlify\build\entry.mjs
# 若 False：
cd examples\example; pnpm build; cd ..\..

# 3. 创建输出目录
New-Item -ItemType Directory -Force integration\testdata\example | Out-Null

# 4. 生成 bundle.mjs
.\astro-runtime.exe build --plain `
  --entry examples\example\.netlify\build\entry.mjs `
  --out integration\testdata\example\bundle.mjs

# 5. 生成 example.pack
.\astro-runtime.exe build --pack `
  --entry examples\example\.netlify\build\entry.mjs `
  --dist examples\example\dist `
  --out integration\testdata\example\example.pack
```

## 验证

```powershell
Get-ChildItem integration\testdata\example\ |
  Select-Object Name, @{N='Size(KB)';E={[math]::Round($_.Length/1KB)}}
# 正常：bundle.mjs ~1106 KB，example.pack ~1052 KB

go test ./integration/...
```
