# astro-runtime 文档索引

本地运行 `@astrojs/netlify` SSR 函数的 Go + QuickJS 运行时。

## 文档列表

| 文档 | 内容 |
|---|---|
| [design.md](./design.md) | 架构设计、数据流、关键决策、依赖说明、使用方式 |
| [components.md](./components.md) | 各 Go/JS 文件的职责、接口、实现细节 |
| [polyfills.md](./polyfills.md) | 每个 polyfill 的存在原因、边界、已知局限 |
| [testing.md](./testing.md) | 测试环境、11 个测试用例、调试问题记录 |

## 快速开始

```bash
# 构建
cd D:\projects\mixed\astro\netlify-runtime
go build -o netlify-runtime.exe .

# 在已有 Astro + Netlify 项目中运行（先 astro build）
./netlify-runtime.exe \
  --ssr .netlify/build/entry.mjs \
  --dist dist \
  --port 8888
```

## 测试应用

```bash
# testapp-ssr（examples/ssr 内容，完整功能覆盖）
./netlify-runtime.exe \
  --ssr testapp-ssr/.netlify/build/entry.mjs \
  --dist testapp-ssr/dist
```

测试路由：
- `GET /` — 商品列表
- `GET /products/:id` — 商品详情
- `GET /cart` — 购物车页
- `GET /api/products` — 商品 JSON
- `GET /api/products/:id` — 单商品 JSON
- `GET/POST /api/cart` — 购物车（需 Cookie: user-id=xxx）
