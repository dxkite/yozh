# js2wasm 设计文档

## 概述

`js2wasm`（仓库：`github.com/dxkite/js2wasm`）是一个受限 JavaScript → WebAssembly AOT 编译器，纯 Go 实现，无 CGo，无外部工具链依赖。

它只支持 `staticifyPlugin` 标准化后产出的**静态 JS 子集**，对不支持的构造返回 `ErrUnsupported`。

## 定位

| 对比项 | js2wasm | Javy | StarlingMonkey |
|--------|---------|------|----------------|
| 输出 WASM 含 JS 解释器 | 否 | 是（QuickJS） | 是（SpiderMonkey） |
| 纯 Go 实现 | 是 | 否 | 否 |
| 无外部工具链 | 是 | 否（需 Javy CLI） | 否（需 wasi-sdk） |
| 支持完整 JS | 否（受限子集） | 是 | 是 |
| 适用场景 | staticifyPlugin 产出 | 通用 JS | 通用 JS + JIT |

## 公开 API

```go
package js2wasm

// Compile 将静态 JS 编译为 WASM 二进制（WASI preview1 格式）
// 对不支持的 JS 构造返回 ErrUnsupported
func Compile(src []byte, opts Options) ([]byte, error)

type Options struct {
    // HostModule 是 WASM import 的模块名，默认 "yozh"
    HostModule string

    // HostFuncs 声明 JS 中 __host_xxx 调用对应的 WASM import 签名
    HostFuncs []HostFunc

    // MemoryPages 初始内存页数（每页 64KB），默认 4
    MemoryPages uint32

    // MaxStringSize bump allocator 单次最大分配字节数，默认 4MB
    MaxStringSize uint32
}

type HostFunc struct {
    Name    string // WASM export 名，如 "send_headers"
    Params  []Type
    Results []Type
}

type Type int
const (
    I32 Type = iota
    I64
    F32
    F64
)

var ErrUnsupported = errors.New("js2wasm: unsupported JS construct")
```

## 架构

```
src []byte
  → Parser    （esbuild Go API）  → JS AST
  → Analyzer  （类型推断/作用域） → Annotated AST
  → Compiler  （逐节点翻译）      → WasmModule IR
  → Encoder   （WASM 二进制格式） → []byte
```

### Parser

使用 `github.com/evanw/esbuild/pkg/api` 的 `Transform` 或 `Parse` 接口解析 JS 源码为 AST。esbuild 是纯 Go 实现，已广泛生产使用，无需引入额外解析器。

### Analyzer

在编译前对 AST 进行两遍分析：

1. **作用域分析**：识别函数、块级作用域，建立变量 → WASM local 的映射
2. **类型推断**：对静态 JS 子集中的表达式推断基础类型（`string`、`i32`、`f64`、`bool`），用于选择正确的 WASM 指令

对无法推断类型或无法处理的构造，标记 `ErrUnsupported` 并终止编译。

### Compiler

对 Annotated AST 进行单遍翻译，生成 WasmModule IR（函数列表、指令序列、数据段）。

#### 支持的 JS 构造 → WASM 翻译

**字面量**

| JS | WASM |
|----|------|
| `42` (整数) | `i32.const 42` |
| `3.14` (浮点) | `f64.const 3.14` |
| `"hello"` (字符串) | data section 分配，返回 `(i32.const offset, i32.const len)` |
| `true` / `false` | `i32.const 1` / `i32.const 0` |
| `null` / `undefined` | `i32.const 0` |

**变量**

| JS | WASM |
|----|------|
| `let x = v` / `const x = v` | 分配 local，`local.set $x` |
| `x`（读取） | `local.get $x` |
| `x = v`（赋值） | `local.set $x` |

**函数**

| JS | WASM |
|----|------|
| `function f(a, b) {}` | WASM 函数定义，参数 → `local` |
| `f(a, b)` | `call $f` |
| `return v` | `return` |
| `__host_xxx(a, b)` | `call $import_xxx`（WASM import） |

**控制流**

| JS | WASM |
|----|------|
| `if (c) A` | `if ... end` |
| `if (c) A else B` | `if ... else ... end` |
| `for (const x of arr) {}` | `block` + `loop` + `br_if` |
| `while (c) {}` | `block` + `loop` + `br_if` |

**字符串操作**

| JS | WASM |
|----|------|
| `a + b`（字符串拼接） | `call $__str_concat` |
| `s.length` | `local.get $s_len` |
| `` `prefix${x}suffix` `` | 展开为多次 `__str_concat` |
| `String(n)` | `call $__i32_to_str` |

**异步**

| JS | WASM |
|----|------|
| `await __host_fetch_raw(...)` | 同步 `call $import_fetch_raw`（WASM 单线程，wazero 宿主阻塞实现） |
| `async function f() {}` | 普通函数（async 修饰符被忽略） |
| `Promise.resolve(v)` | 直接返回 `v`（无 Promise 包装） |

**不支持（返回 ErrUnsupported）**

- `class`、`extends`、`prototype`
- 闭包（函数内引用并修改外部 `let` 变量）
- 动态属性访问 `obj[dynamicKey]`
- `try/catch/throw`
- `Symbol`、`WeakMap`、`Proxy`、`Reflect`
- 正则表达式对象
- `arguments` 对象
- 生成器 `function*`、`yield`
- 解构赋值（数组/对象）的复杂形式

### 内置辅助函数（自动注入 code section）

编译器在 WASM 模块中自动注入以下辅助函数，无需外部运行时：

| 函数 | 说明 |
|------|------|
| `__bump_alloc(size i32) → ptr i32` | 请求作用域 bump allocator |
| `__bump_reset()` | 每次请求结束后重置 allocator |
| `__str_concat(p1,l1,p2,l2 i32) → (p,l i32)` | 字符串拼接，bump alloc 新空间 |
| `__i32_to_str(n i32) → (p,l i32)` | 整数转字符串 |
| `__f64_to_str(n f64) → (p,l i32)` | 浮点转字符串 |
| `__str_eq(p1,l1,p2,l2 i32) → bool i32` | 字符串相等比较 |

### 内存模型

```
线性内存（初始 4 pages = 256KB）：

偏移 0           编译时常量字符串（data section 写入）
偏移 N           bump allocator 指针（4 bytes）
偏移 N+4 ..      请求作用域动态分配区
```

- 字符串在 WASM 内部以 `(ptr i32, len i32)` 两值表示
- 编译时字符串字面量写入 data section，只读
- 运行时动态字符串（拼接结果）分配在 bump 区域
- `__bump_reset()` 由宿主在每次请求开始前调用（通过导出函数 `__request_init`）

### Encoder

将 WasmModule IR 按 WASM 规范 MVP（[WebAssembly 1.0](https://webassembly.github.io/spec/core/)）编码为二进制：

```
magic bytes: \0asm
version:     0x01000000

Section 1  (Type)      函数签名列表
Section 2  (Import)    宿主函数 import（yozh.xxx）
Section 3  (Function)  函数类型索引
Section 5  (Memory)    线性内存声明
Section 7  (Export)    导出函数（__handle_request, __request_init）
Section 10 (Code)      函数体（指令序列）
Section 11 (Data)      字符串常量
```

输出格式为 WASI preview1，wazero v1.9 可直接加载，无需适配层。

## WASM 模块接口

`js2wasm` 编译产出的 `bundle.wasm` 固定导出：

| 导出名 | 签名 | 说明 |
|--------|------|------|
| `__handle_request` | `(reqPtr i32, reqLen i32)` | 主入口，处理一次 HTTP 请求 |
| `__request_init` | `()` | 每次请求开始前调用，重置 bump allocator |
| `memory` | 线性内存 | wazero 读写 WASM 内存所需 |

固定导入（由 wazero HostModuleBuilder 提供）：

| 模块 | 函数 | 用途 |
|------|------|------|
| `yozh` | `send_headers` | 发送 HTTP 响应头 |
| `yozh` | `send_chunk` | 发送响应体块 |
| `yozh` | `end_stream` | 结束流式响应 |
| `yozh` | `fetch_raw` | 同步 HTTP 请求（宿主阻塞实现） |
| `yozh` | `url_parse` | URL 解析 |
| `yozh` | `text_encode` | UTF-8 编码 |
| `yozh` | `text_decode` | UTF-8 解码 |
| `yozh` | `crypto_random` | 随机字节 |
| `yozh` | `crypto_digest` | 哈希摘要 |
| `yozh` | `time_now` | 当前时间戳（ms） |
| `yozh` | `random_f64` | `[0,1)` 随机浮点 |

## 与 yozh 的集成

```go
// yozh/wasm_compile.go
import "github.com/dxkite/js2wasm"

func CompileJSToWasm(staticJS []byte) ([]byte, error) {
    wasmBytes, err := js2wasm.Compile(staticJS, js2wasm.Options{
        HostModule: "yozh",
        HostFuncs:  astroHostFuncs,  // 固定列表，与 wasm_hostfuncs.go 对应
    })
    if errors.Is(err, js2wasm.ErrUnsupported) {
        // 降级：回退到 goja eval 路径（bundle 作为 ESM 源码直接跑在常规 goja Pool 上）
        return nil, err
    }
    return wasmBytes, err
}
```

yozh 的构建流程：

```
go run ./cmd build --wasm --entry entry.mjs --out bundle.pack

1. BundleStatic(entry.mjs)         → static-bundle.js
2. js2wasm.Compile(staticBundle)   → bundle.wasm  （或降级为普通 bundle.mjs，走 goja eval 路径）
3. BuildWASMPack(bundle.wasm, ...) → bundle.pack
```

## 错误处理策略

```
js2wasm.Compile() 返回 ErrUnsupported
  → yozh 降级：不编译 WASM，直接把 bundle 作为普通 ESM 源码交给 goja Pool（唯一的运行时引擎）求值
  → 记录日志：哪个 JS 构造触发了降级
  → 仍输出可用的 bundle.pack（包含 bundle.mjs，不含 bundle.wasm）
```

降级不影响正确性，只影响性能（goja 直接 eval 源码，没有 WASM 编译带来的执行速度收益）。
开发者可通过日志定位哪些 JS 模式阻止了 WASM 编译，逐步优化 bundle。

## 测试策略

- **单元测试**：每种 JS 构造 → 预期 WASM 指令序列（用 wasm-disassemble 或手动验证）
- **集成测试**：用 wazero 执行产出的 WASM，验证与 goja eval 路径的输出等价
- **Fuzz 测试**：对 staticifyPlugin 的输出进行 fuzzing，验证编译器不崩溃（仅允许返回 ErrUnsupported）

## 路线图

| 阶段 | 目标 |
|------|------|
| v0.1 | 支持基础字面量、变量、函数调用、字符串拼接、if/else |
| v0.2 | 支持 for...of 循环、模板字符串、基础算术 |
| v0.3 | 支持 await 宿主函数调用、多函数模块 |
| v1.0 | 覆盖 staticifyPlugin 产出的 90% 常见 Astro SSR 模式 |
