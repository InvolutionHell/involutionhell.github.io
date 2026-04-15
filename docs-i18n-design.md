# 文档双语化设计方案（Draft）

面向 involutionhell 文档站的双语支持落地方案。本文档是**设计稿**，等你 review 后再动手。

---

## 一、现状

### 文档规模

- 文档数：150 个（MDX + MD 共存）
- 位置：`app/docs/**`，共 13 个一级目录（ai / computer-science / jobs / CommunityShare 等）
- Frontmatter：每篇都有 `title`，151 篇有 `docId`（稳定标识）
- 语言现状：全部中文（含中文 title、中文正文）。英文内容几乎为零

### 路由现状

- Next.js 路由：`/docs/[...slug]` 直接映射 `app/docs/*` 文件结构，没有语言前缀
- `i18n.ts` 定义了 `locales = ["en", "zh"]`，但**没有接入 middleware，没有实际效果**
- `/settings` 的语言选项保存到 DB 但前端不消费（PM 证实是"安慰剂"）

### Contributors 脚本（关键基础设施）

- `scripts/backfill-contributors.mjs`：通过 GitHub Commits API 拉取每篇文档的贡献者
- 核心逻辑：
  1. `fast-glob` 扫描 `app/docs/**/*.{md,mdx}`
  2. 每个文件解析 frontmatter 取 `docId`（必须有）
  3. 用 GitHub API 拉这个**文件路径**的 commit 历史
  4. 按 commit.sha 去重，累计写入 `doc_contributors` 表
  5. DB 层维护 `doc_paths`（历史路径），支持文件重命名/移动
- `scripts/generate-leaderboard.mjs`：从 DB 聚合出排行榜 JSON
- **关键点**：整个体系以 `docId` 为核心，不是文件路径。路径变了也能追踪到同一文档

---

## 二、目标

1. 每篇文档支持中英双语两份内容
2. 读者在文档页可以切换语言阅读
3. **翻译内容不能污染 contributors 统计**（用户原话）
4. 维护者的日常写作流程不能变复杂（文档数量会翻倍，但人肉操作不增加）

---

## 三、方案：Frontmatter 标注 + 自动翻译 Agent

### 3.1 目录结构

**方案 A（推荐）：同目录下并列两份文件，用后缀区分语言**

```
app/docs/ai/reinforcement-learning/
├── index.mdx              # 中文原文（作者写的）
├── index.en.mdx           # 英文翻译（Agent 产出）
├── another-topic.mdx
├── another-topic.en.mdx
```

规则：

- 未带语言后缀 = 主语言（以 frontmatter 的 `lang` 字段为准）
- 带 `.en.mdx` / `.zh.mdx` 后缀 = 翻译版
- 两份文件共享同一个 `docId`（翻译版继承原文 docId）

**为什么不用 `/en/docs/...` URL 前缀方案**：

- fumadocs 的 i18n 要求改路由结构，`app/docs` 要改成 `app/[lang]/docs`
- 影响所有已有内链、所有文档的 SEO（URL 变了需要 301 重定向）
- contributors 脚本的路径追踪逻辑要大改
- 用后缀方案，文件物理位置不动，脚本只需少量改动

### 3.2 Frontmatter 扩展

原文（作者写的）：

```yaml
---
title: 强化学习
description: 强化学习基础理论...
docId: a1b2c3d4
lang: zh # 新增：标注原文语言
---
```

翻译版（Agent 产出）：

```yaml
---
title: Reinforcement Learning
description: Foundations of RL...
docId: a1b2c3d4 # 继承原文 docId
lang: en # 标注翻译目标语言
translatedFrom: zh # 新增：来源语言，表明这是翻译
translatedAt: 2026-04-15T10:00:00Z # 新增：最后翻译时间戳
translatorAgent: claude-opus-4-6 # 新增：翻译模型标识
---
```

**关键约束**：只要 frontmatter 里有 `translatedFrom` 字段，就视为"翻译版"。

### 3.3 Contributors 脚本的改动（最小代价）

`scripts/backfill-contributors.mjs` 现有的 frontmatter 解析函数已经可以扩展。改动位置：

```javascript
// 函数签名不变
function parseDocFrontmatter(content) {
  const parsed = matter(content);
  const data = parsed.data || {};
  // 新增：标记是否为翻译版
  const isTranslation =
    typeof data.translatedFrom === "string" && data.translatedFrom.length > 0;
  return {
    docId: data.docId || null,
    title: data.title || null,
    isTranslation, // 新增字段
    frontmatter: data,
  };
}
```

在主循环里加一个跳过逻辑：

```javascript
for (const file of docFiles) {
  const meta = parseDocFrontmatter(raw);
  if (!meta.docId) { log(`跳过：缺少 docId`); continue; }

  // 新增：翻译版不记贡献者，直接跳过
  if (meta.isTranslation) {
    log(`  ⏭  跳过翻译版：${repoRelative}`);
    continue;
  }

  // 其余逻辑保持不变
  ...
}
```

**影响范围**：

- `scripts/backfill-contributors.mjs`：新增约 10 行代码
- `scripts/generate-leaderboard.mjs`：**无需改动**（它从 DB 聚合，源头过滤了就不会误算）
- `generated/doc-contributors.json`：不会包含翻译版（翻译版没有 contributor 记录）
- DB schema：**无需改动**（doc_paths、doc_contributors 表结构不变）

**验证方法**：

```bash
# 跑一轮带 dry-run 看输出
DRY_RUN=1 pnpm exec node scripts/backfill-contributors.mjs --skip-db
# 确认日志里翻译版都被跳过
```

### 3.4 Next.js 路由侧改动

**前端渲染文档页时**，根据用户当前语言偏好（`useTheme` 同款 ThemeProvider 模式）选择读取哪份 MDX。

两种实现方式：

**方式 1：Fumadocs 源配置 + 运行时选择**

```typescript
// source.config.ts
export const docs = defineDocs({
  dir: "app/docs",
  // fumadocs-mdx 支持 lang 字段，但需要配置 includeTranslations
});
```

**方式 2（更简单）：保持 fumadocs 单语言，在 `[...slug]/page.tsx` 里手动读 alt 语言文件**

伪代码：

```tsx
// app/docs/[...slug]/page.tsx
const { slug } = await params;
const locale = await getLocale(); // 从 cookie / localStorage / Accept-Language 读

// 优先加载带后缀的翻译版
let page = getPage([...slug]); // 原文
if (locale === "en" && page.data.lang === "zh") {
  const enPage = getPage([...slug.slice(0, -1), slug.at(-1) + ".en"]);
  if (enPage) page = enPage;
}
```

**我建议用方式 2**：改动面小，fumadocs 的目录结构不动，contributors 脚本不用跟着适配 locale 路由。

### 3.5 /settings 的语言选项

现在的选项改为**真实生效**：

1. `zh` / `en` 的选择写入 `localStorage`（和主题同一套 provider 模式）
2. `/docs/[...slug]/page.tsx` 在 Server Component 里读 cookie（不能读 localStorage），所以需要**在客户端切换后写回 cookie**
3. 文档页根据 cookie 决定加载哪份文件

**边界情况**：

- 用户选了 `en` 但某文档没有英文版 → fallback 到中文原文 + 顶部提示"此文档暂无英文版"
- SEO：只有原文版本被 sitemap 包含，翻译版用 `<link rel="alternate" hreflang>` 指向

### 3.6 "翻译 Agent" 的工作流

新增一个 subagent 类型 `translator`（定义在 `~/.claude/agents/translator.md`）。

**触发时机**：

- 手动：运行 `pnpm run translate-docs` 脚本，传入文件路径或全量扫描
- 自动（可选后续）：GitHub Action 在文档变更时触发

**翻译脚本 `scripts/translate-docs.mjs`（新增）**：

```javascript
// 1. 扫描 app/docs/**/*.mdx
// 2. 过滤：只处理 lang 字段等于原文语言、且没有对应翻译版的文件
// 3. 对每个待翻译文件：
//    a. 读取 frontmatter + body
//    b. 调用 Claude API 翻译 body（保留代码块、math block、image 等）
//    c. 翻译 title 和 description
//    d. 生成新文件 `xxx.{targetLang}.mdx`，frontmatter 带 translatedFrom
// 4. 跳过：已存在翻译版 且 原文 mtime <= 翻译版 translatedAt 的
```

**翻译的质量约束（写进 Agent 系统提示）**：

- 保留 MDX 组件原样（`<Cards>`、`<Callout>` 等）
- 保留代码块内容不变
- 保留 math block（$$...$$ 和 $...$）
- 保留 image URL 不变
- 技术术语用社区约定译法（需要维护一个词表，如 "prompt → 提示词"、"fine-tune → 微调"）
- 保留 frontmatter 其他字段，只改 title / description

### 3.7 贡献者维护指南（新增文档）

在仓库 `CONTRIBUTING.md` 或 `app/docs/how-to-contribute.mdx` 里加一节：

```markdown
## 多语言文档维护

### 写新文档

正常写就行。**只需要在 frontmatter 里加一行 `lang: zh`**（如果你写的是中文）或 `lang: en`。

### 翻译会自动产出

- 你 merge 到 main 后，CI 会自动生成对应的翻译版（`xxx.en.mdx` 或 `xxx.zh.mdx`）
- 翻译版文件提交者是 Bot 账号，**不计入你的 contributor 贡献**
- 翻译版的 title、description、正文都是 AI 翻译，术语有社区词表保证一致性

### 原文更新后翻译会自动重新生成

- 翻译脚本根据 git mtime 判断是否过期
- 原文改动 → 下次 CI 运行时，该文档的翻译版会被重写

### 手动修正翻译

- 直接编辑 `xxx.en.mdx` 文件（修正术语、调整措辞）
- 提交时在 commit message 里加 `[translation-fix]` 前缀
- 这样下次自动翻译就会保留你的改动（脚本看 commit message 决定是否覆盖）

### 不想被翻译的文档

frontmatter 加 `noTranslate: true` 即可跳过
```

---

## 四、落地步骤（建议顺序）

| 步骤 | 内容                                                   | 耗时                      | 依赖   |
| ---- | ------------------------------------------------------ | ------------------------- | ------ |
| 1    | 修改 `backfill-contributors.mjs` 加 isTranslation 判断 | 15 分钟                   | 无     |
| 2    | 新增 `translator` subagent 定义                        | 10 分钟                   | 无     |
| 3    | 新增 `scripts/translate-docs.mjs` 翻译脚本             | 2-3 小时                  | 步骤 2 |
| 4    | 修改 `app/docs/[...slug]/page.tsx` 支持 locale 切换    | 1-2 小时                  | 无     |
| 5    | 恢复 `/settings` 语言选项的真实生效（写 cookie）       | 30 分钟                   | 步骤 4 |
| 6    | 跑一遍翻译脚本（中文 → 英文），150 篇文档              | 视 API 并发定，20-60 分钟 | 步骤 3 |
| 7    | Review 翻译质量，补充术语词表                          | 人力，1-2 天              | 步骤 6 |
| 8    | 加 `<link rel="alternate" hreflang>` 和 sitemap 双语   | 30 分钟                   | 步骤 4 |
| 9    | 更新 `CONTRIBUTING.md` 加维护指南                      | 30 分钟                   | 全部   |

**MVP 能验证的路径**（最小闭环）：先做 1 + 2 + 3 + 4 + 6 五步，跑出几篇翻译样本看质量再决定是否全量。

---

## 五、风险和未决问题

1. **翻译成本**：150 篇文档，每篇按 2000 token 估算，全量翻译 ≈ 30 万 token。走 Claude Haiku 约 $0.25（输出），走 Sonnet 约 $4.5。Opus 不推荐（$22）。建议 Haiku + Sonnet 混合（短文档 Haiku，长文档 Sonnet）。

2. **术语一致性**：跨文档的术语译法冲突很常见（"Prompt" vs "提示词" vs "提示"）。需要提前建一个 `scripts/translation-glossary.json` 词表。

3. **MDX 组件兼容**：翻译时如何保证 `<Cards>` 内的 `title` 被翻译但属性名不动？需要 AST-aware 翻译，不能纯字符串替换。方案：用 `remark` 解析 MDX → 只翻译文本节点 → 再序列化回来。

4. **Contributors 脚本的历史路径追踪**：如果将来把 `xxx.mdx` 重命名为 `xxx.en.mdx`（某些人误操作），脚本会把它当翻译版跳过。需要加一个警告：docId 指向唯一的非翻译文件，否则报错。

5. **图片路径**：如果文档里引用了 `./images/foo.png` 相对路径，翻译版生成时路径需要保持，不能出问题。

6. **搜索索引**：现在 fumadocs search 基于 MDX 内容。翻译版文档要不要进搜索？默认建议**按当前语言过滤**（英文用户只搜英文结果），搜索引擎需要支持 locale 参数。

---

## 六、Contributors 脚本不会挂的证据

我核对过 `scripts/backfill-contributors.mjs` 的核心逻辑：

- ✅ 扫描 `app/docs/**` → 会扫到翻译版（好事，能检查 docId 一致性）
- ✅ 解析 frontmatter 取 docId → 翻译版继承原文 docId，天然合并
- ✅ 按 commit.sha 去重 → 即使翻译版和原文有独立 commit 历史也不会重复计算
- ✅ doc_paths 表维护历史路径 → 支持文件移动/重命名
- ⚠️ 需要加 `isTranslation` 跳过逻辑（设计里有）
- ⚠️ `generate-leaderboard.mjs` 从 DB 聚合 → 上游过滤了就不会误算

**执行顺序保障**：

1. 翻译脚本运行 → 生成翻译文件（frontmatter 有 translatedFrom）
2. Git commit 翻译文件（Bot 账号作者）
3. CI 触发 `backfill-contributors.mjs` → 看到 translatedFrom 跳过 → 不计入
4. `generate-leaderboard.mjs` 从 DB 读 → 永远不会包含翻译版的贡献

---

## 七、给你决策的关键问题

1. **翻译方向**：只做中→英？还是原创语言 → 另一门语言（有些文档可能是英文原创）？
2. **术语词表**：谁来维护？先跑一版再人肉修，还是先建词表再跑？
3. **翻译频率**：每次 merge 都触发，还是定时批量（比如每周一次）？
4. **locale 默认值**：新访客默认看中文还是英文？（现在 `i18n.ts` 默认 `en` 但文档全是中文）
5. **搜索是否跨语言**：英文用户搜不到中文原文文章的话，会漏掉大量内容
6. **MDX 组件翻译深度**：`<Callout>` 里的文字是否翻译？`<Cards>` 里的链接文字呢？

---

## 八、我的推荐最小可行版本（一句话）

**先做 MVP**：加 `isTranslation` 字段 + 翻译脚本 + 翻译 5 篇看质量 + 前端单文件 locale 切换。不做 middleware 路由、不改 fumadocs 源配置、不加搜索语言切换。跑通链路后再谈全量。

---

以上。等你 review 后告诉我：

- 哪些不同意
- 上面第七节 6 个决策问题的答案
- 要不要先做 MVP 验证

---

## 附录：用户决策（2026-04-15 确认）

1. **翻译方向**：双向（zh ⇄ en）。每篇原文检测 `lang` 字段：`zh` 生成 `.en.mdx`，`en` 生成 `.zh.mdx`
2. **术语词表**：先跑一版再沉淀。领域限定为 **计算机 + AI**。翻译脚本 system prompt 里写死这个领域约束，让模型用业内约定译法（不专门维护 JSON 词表）
3. **触发方式**：用户手动触发 `pnpm run translate-docs`，使用限时免费 Claude Token。**不接 GitHub Action**，不做定时任务
4. **默认语言**：**IP 判断**。方案：Next.js middleware 读 `request.geo.country`（Vercel 原生支持）或 `Accept-Language` header 兜底。中国 IP / 中文 UA → zh；其他 → en。用户手动切换后写 cookie 覆盖 IP 判断
5. **搜索跨语言**：中文用户搜英文关键词也要能搜到中文版（反之亦然）。fumadocs search 需要把 zh + en 文档**合并索引**，但展示时只显示当前语言版本
6. **MDX 组件内文字**：翻译。`<Callout>`、`<Cards>` 等组件的文本内容要翻译，属性名不动。需要 AST-aware 翻译（remark parser → 只替换文本节点 → 再序列化）

---

## 附录：根据决策更新的落地步骤（覆盖上面的步骤表）

| #   | 内容                                                                    | 耗时      |
| --- | ----------------------------------------------------------------------- | --------- |
| 1   | 改 `backfill-contributors.mjs`：加 `isTranslation` 跳过逻辑             | 15 min    |
| 2   | 新增 `~/.claude/agents/translator.md` subagent 定义（CS + AI 领域约束） | 15 min    |
| 3   | 新增 `scripts/translate-docs.mjs`：AST-aware 翻译（用 remark 解析 MDX） | 3-4 h     |
| 4   | 改 `app/docs/[...slug]/page.tsx`：根据 cookie 选 locale 文件            | 1-2 h     |
| 5   | 新增 `middleware.ts`：IP geo 判断默认 locale → 写 cookie                | 30 min    |
| 6   | 改 `/settings` 语言选项：真实生效（写 cookie 覆盖 IP 判断）             | 30 min    |
| 7   | 改 fumadocs search：合并 zh + en 索引，按当前 locale 展示               | 1-2 h     |
| 8   | 手动跑 `pnpm run translate-docs`（5 篇 MVP 验证质量）                   | 10 min    |
| 9   | 全量跑 150 篇                                                           | 30-60 min |
| 10  | Review 翻译，补 `hreflang` meta 和 sitemap                              | 30 min    |
| 11  | 写 `CONTRIBUTING.md` 多语言维护指南                                     | 30 min    |

MVP 最小闭环：**步骤 1 + 2 + 3 + 4 + 8** 跑通 5 篇翻译，看质量。

---

## 附录：关键技术选型

### IP Geo 判断（步骤 5）

Vercel 边缘 runtime 原生提供 `request.geo.country`（不走第三方服务）。如果将来自部署不走 Vercel，fallback 到 `Accept-Language` header。

```typescript
// middleware.ts
export function middleware(req: NextRequest) {
  if (req.cookies.get("locale")) return NextResponse.next(); // 用户选过了就尊重
  const country = req.geo?.country ?? "";
  const acceptLang = req.headers.get("accept-language") ?? "";
  const locale = country === "CN" || acceptLang.startsWith("zh") ? "zh" : "en";
  const res = NextResponse.next();
  res.cookies.set("locale", locale, { maxAge: 60 * 60 * 24 * 365 });
  return res;
}
```

### AST-aware 翻译（步骤 3）

用 `remark-parse` 把 MDX 解析成 AST，遍历只翻译 `text` 和 `paragraph` 节点，跳过 `code`、`inlineCode`、`math`、`mdxJsxAttribute`（组件属性名），然后用 `remark-stringify` 输出。这样：

- `<Callout type="info">这段话翻译</Callout>` → `<Callout type="info">This gets translated</Callout>`
- `type` 属性不动
- 代码块 ` ```py\nimport x\n``` ` 内容不动

### 搜索跨语言索引（步骤 7）

fumadocs search 的 `search.json` 生成时**包含所有语言版本**，每条记录带 `lang` 字段。前端搜索组件按当前 locale 过滤展示结果。实现：改 `app/search.json/route.ts`（如果有的话）或 `search.json` 生成逻辑。
