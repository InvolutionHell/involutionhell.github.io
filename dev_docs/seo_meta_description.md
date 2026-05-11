# SEO Meta Description 三层方案

## 为什么需要这东西

2026-05 Bing Webmaster Tools 报告：involutionhell.com 有 **118 个页面 meta description 太短**
（< 150 字符），评为 Moderate SEO 问题。

根因不是代码 bug，是**内容缺失**：

- docs 页面（`app/[locale]/docs/[...slug]/page.tsx:165`）的 `generateMetadata` 直接读 MDX
  frontmatter 的 `description` 字段，没有 fallback；
- `content/docs/` 下 292 个 MDX 中：
  - **96 个** 完全没有 `description` 字段（绝大多数是程序化导入的 leetcode 题解）
  - **67 个** `description: ""` 空字符串
  - **35 个** description < 20 字符（"First page" 这种）
  - **56 个** description 20-60 字符（合格但偏短）
  - 仅 **38 个** ≥ 60 字符

这条 Bing 告警不是 hard error，是 ranking signal —— description 缺失时搜索引擎会从正文
随便抓一段做摘要，质量不可控，间接拉低 CTR 和排名。

## 方案：三层叠加

### Layer 1 — 代码层兜底（`lib/seo-description.ts`）

所有 docs 页的 `generateMetadata` 都过 `ensureSeoDescription()`，把短/空/缺失的
description 自动拼接到 ≥ 80 字符：

```ts
description: ensureSeoDescription({
  description: page.data.description,
  title: page.data.title,
  sectionPath: slug.slice(0, -1), // 当前页的分区面包屑
  locale,
});
```

兜底文本结构：

```
[作者原 description 如有] 主题：{title}。 所属分区：{breadcrumb}。 站点 tagline。
```

中英文 tagline 各一份，按 `locale` 选。

**影响范围**：以下 4 处页面 metadata 都已接入：

| 文件                                       | 用途                                                    |
| ------------------------------------------ | ------------------------------------------------------- |
| `app/[locale]/docs/[...slug]/page.tsx:165` | docs 动态路由 generateMetadata + TechArticle JSON-LD    |
| `app/[locale]/docs/page.tsx:47`            | docs 根落地页                                           |
| `app/[locale]/events/[id]/page.tsx:57`     | 活动详情页（兜底用户/管理员录入的 `event.description`） |
| `app/[locale]/feed/page.tsx:24`            | 社区分享墙                                              |

**作用**：立即消除 Bing 告警，不动 content/。但兜底文本是模板化拼接，
搜索摘要质量稀薄 —— 这是 Layer 1 的局限。

### Layer 2 — CI lint 阻止再积累低质量 description

`scripts/check-frontmatter-description.mjs` 在 pre-commit + GitHub Actions PR
检查新增/修改的 MDX，强制 `description` 字段 ≥ 60 字符。

豁免规则：

- `content/docs/career/interview-prep/leetcode/` 全部豁免 —— 程序化导入太多，
  Layer 1 兜底已能用
- `*_translated.md` / `*_translated.mdx` —— 机翻产物，等人工 review 时再补

**接入位置**：

- `.husky/pre-commit`：`pnpm check:frontmatter`（默认 `--changed` 模式）
- `.github/workflows/content-check.yml`：同上，PR 上下文自动从 `GITHUB_BASE_REF`
  diff 找改动文件

**只看不阻塞模式**：`pnpm check:frontmatter:all` 扫所有文件输出报表，但不退出
非 0；用于本地一次性看现状。

### Layer 3 — 离线脚本回填 description 写入 frontmatter（`scripts/generate-descriptions.mjs`）

把存量 253 个 description 缺失/空/极短的 MDX 回填精准描述。

两种生成策略：

1. **默认（推荐）**：所有文件走 DeepSeek API
   - 输入：title + filename + 正文前 800 字符（清洗 import / 代码块 / MDX 组件）
   - 输出：单行 description，中文文档 80-100 字、英文文档 120-160 字符
   - leetcode 题解会被额外提示"以 LeetCode {题号}. {题名} 题解 — 开头"
   - 成本：~$0.05 总 token 成本（DeepSeek 2026-05 价目）

2. **`--leetcode-only`（离线模式）**：仅 leetcode 走文件名+正文模板拼接，不调 LLM
   - 用于无 `DEEPSEEK_API_KEY` 时的 fallback
   - 模板覆盖：题号 + 题名 + 正文首句 + 通用 tail

**用法**：

```bash
# 1. dry-run（默认），生成 scripts/.descriptions-report.json 供 review
DEEPSEEK_API_KEY=sk-xxx node scripts/generate-descriptions.mjs

# 2. 看 dry-run 结果后真写回 frontmatter
DEEPSEEK_API_KEY=sk-xxx node scripts/generate-descriptions.mjs --apply

# 3. 试运行只跑前 N 个
DEEPSEEK_API_KEY=sk-xxx node scripts/generate-descriptions.mjs --limit=5

# 4. 离线模式（leetcode 模板）
node scripts/generate-descriptions.mjs --leetcode-only --apply
```

**安全设计**：

- 默认 dry-run，绝不动 content；`--apply` 才真写
- `gray-matter` 保留其他 frontmatter 字段（title / date / docId / lang 等）
- 已合格（≥ 60 字符）的 description 跳过 —— 重跑幂等
- DeepSeek 调用失败的不写，留待重跑
- 输出 < 50 字符的不写，标记在 report 的 `skippedTooShort` 里
- API key 只从 env 读，不进任何 commit

## 验证

```bash
# 看 Layer 1 兜底是否在跑：访问随便一个无 description 的 leetcode 页面
curl -s https://involutionhell.com/zh/docs/career/interview-prep/leetcode/1004... | grep '<meta name="description"'
# 期望：description 至少包含 "主题：" 或 "Topic:" + 分区面包屑 + 站点 tagline

# 看 Layer 2 lint 是否触发：本地建一个无 description 的 mdx
echo "---\ntitle: x\n---\n内容" > content/docs/__test.mdx
git add content/docs/__test.mdx
pnpm check:frontmatter  # 预期退出码 1

# Layer 3 dry-run，看 report
DEEPSEEK_API_KEY=sk-xxx node scripts/generate-descriptions.mjs --limit=5
cat scripts/.descriptions-report.json | jq '.results[] | {file, length, after}'
```

## 决策记录

- **为什么 lint 阈值是 60 字符而非 Bing 推荐的 150**：60 是保守值，照顾老贡献者
  适应；Layer 1 兜底会把渲染时实际长度补到 ≥ 80。两道防线足够。
- **为什么 leetcode 豁免 lint**：96 个题解是程序化导入的，没人会手写
  description；强制写人为操作太重，靠 Layer 1 兜底 + Layer 3 模板/LLM 一次性补齐
  即可。
- **为什么用 DeepSeek 而非更贵的模型**：本任务对模型推理要求不高（看 800 字
  正文摘要成一句话），DeepSeek-chat 足够；成本 $0.05 vs GPT-4 的 $5+，差 100 倍。
- **为什么不直接在 source.config.ts 装 remark 插件自动生成 description**：
  fumadocs 已经把 frontmatter 转为 `page.data`，在 metadata 层加 fallback 比改
  frontmatter pipeline 侵入性小、回退安全。

## 相关文件

- `lib/seo-description.ts` — Layer 1 兜底函数
- `tests/seo-description.test.ts` — 兜底函数单元测试
- `scripts/check-frontmatter-description.mjs` — Layer 2 lint
- `scripts/generate-descriptions.mjs` — Layer 3 离线生成
- `app/[locale]/docs/[...slug]/page.tsx` — 主要消费方
- `.husky/pre-commit` — 接入点
- `.github/workflows/content-check.yml` — 接入点
