# CLAUDE.md — 给 Claude / AI coding agent 的项目级硬约束

`AGENT.md` 写 workflow 和 coding style。这里只写**已被 review 推回过的反模式**，
确保下次不再犯。

## 1. 最佳实践优先于"省一点资源"

线上 Vercel CPU 接近 / 超配额时，**第一反应不是降级 observability 或藏起错误**。
正确的次序：

1. 找真实的 waste（scanner 烧 Fluid、缺 SSG 配置的路由、cache miss 风暴）
2. 用 best practice 修掉 waste（让 SSG / ISR 真正生效，edge 早返）
3. 还是过线就升 Pro plan / 上 Cloudflare proxy 挡 crawler

**不要做**（"丢西瓜捡芝麻" 反模式，已被推回过）：

- ❌ 把 `Sentry tracesSampleRate` 从 0.1 调到 0.02 省 CPU —— 10% 是行业标准，
  observability 不能为这点 CPU 让步；server/edge/client 三处必须一致才能跨
  runtime 串 trace
- ❌ 把后端 fetch 失败一律返空数组 —— 这隐藏 prod 故障，把"backend 挂了"误
  显示成"暂无活动"，Sentry / 错误页都抓不到。**正确做法**：用
  `process.env.NEXT_PHASE === "phase-production-build"` guard，只在 build
  阶段降级返空（避免 SSG build 挂），运行时仍 throw
- ❌ 把活跃流量当 bug 优化掉 —— 如果 SEO PR 的 IndexNow ping 让搜索引擎重抓
  是 4× 流量增长的原因，那是工作成功的代价，应该付费而不是回滚 SEO

## 2. 路由分类必须用 `next build` 输出验证，不要凭感觉

历史教训：上一轮 SSR 优化（commit `8517332`）声称"首页 SSG 化"，但 build 表
显示**只翻转了 1 条路由**。剩 17 条还是 ƒ Dynamic，没人发现。

**强制流程**：

```bash
# 修前快照
pnpm build 2>&1 | tee /tmp/build-before.txt

# 修复后
pnpm build 2>&1 | tee /tmp/build-after.txt

# 直接 diff，看哪些 ƒ → ● / ○
diff <(grep -E '^[┌├└] ' /tmp/build-before.txt) \
     <(grep -E '^[┌├└] ' /tmp/build-after.txt)
```

**不接受"我加了 force-static 应该就行"这种自证。** 看 build 表，看
`x-vercel-cache: HIT` header，看 Vercel dashboard 24h 后实测 CPU。

### next-intl SSG 的硬要求

每个 `[locale]/*/page.tsx` 想 SSG / ISR 都必须满足**全部三条**：

1. `params: Promise<{ locale: string }>` 接收 + `await params`
2. `setRequestLocale(locale)` 调用（必须在任何 `getTranslations` / `getLocale` 之前）
3. `export function generateStaticParams() { return routing.locales.map(...); }`

缺任一条 → next-intl 退回 `cookies()` 推断 locale → 整页 ƒ Dynamic。
parent layout 的 setRequestLocale 不传染到子 page。

## 3. 注释规则（CLAUDE.md 顶层约束的项目特化）

**默认不写注释**。只在以下场景写：

- 非显然的工程约束（如 next-intl SSG 三条件、`NEXT_PHASE` guard 的作用域）
- 维护时容易踩坑的不变量（如 "BOT_PATH_PATTERNS 不要加 admin / login"）

**严禁写**（已被推回过的反模式）：

- ❌ 引 dev_docs/ 文件路径（doc 改名 / 删除时注释 rot）
- ❌ 引 PR / commit / issue 编号（提供不了上下文，要看就 `git blame`）
- ❌ "原版/之前是 X，现在改成 Y" 的历史叙事（PR 描述里写就好）
- ❌ "修复 XX bug" / "为 YY 任务加" 类引用当前任务的注释
- ❌ 大段 docstring 描述代码功能 —— 命名清楚就够

## 4. CR 反馈直接改，不分级问用户

Copilot / 人工 review 给的意见**先判真假**：

- 真问题 → 直接 commit 修，挂 `Co-authored-by: copilot-pull-request-reviewer[bot]`
- 噪音 → 直接 dismiss 并说理由

**不要**列 P0/P1/P2 让用户选 —— 我已经读完 CR 了，用户没读，让他筛选是把
任务推回给他。

## 5. Build 产物 commit 进 git 的特例

`generated/leetcode-slug-map.json` 是 `pnpm build` prebuild 产物，但**必须
commit 进 git**——`proxy.ts` 在 edge runtime 静态 import 它，不 commit
就要把 pinyin-pro 字典塞进 edge bundle（不可行）。

任何改 `content/docs/career/interview-prep/leetcode/` 下题目（新增 / 删除 /
重命名）的 PR，commit 前**必须**跑一次 `pnpm build` 让 prebuild 同步这个
JSON，否则下一个 contributor 跑 build 时会被强迫顺手清你的 orphan entry。
