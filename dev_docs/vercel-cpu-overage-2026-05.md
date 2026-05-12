# Vercel CPU 超额诊断 & 修复（2026-05）

> 2026-05-12 触发：Hobby plan **Fluid Active CPU 7h54m / 4h（198%）**，
> Fast Origin Transfer 12.04 GB / 10 GB（120%）。用户报告"之前做过 SSR
> 优化但情况更糟"。本文档记录调查方法、根因、修复、验证手段。

## TL;DR（看完 Vercel dashboard 30 天图表后的修订诊断）

**真正的元凶**：5/11 一天里 PR #341（253 MDX descriptions backfill + 32 新 EN
翻译页）+ PR #342（remark h1 plugin）+ PR #343（escape-angles）连续 4 次
deploy。每次 deploy 自动 ping IndexNow → Bing/Google 5/10-5/12 大规模重抓 +
索引 32 个新 URL。Dashboard 30 天曲线显示 5/11 CPU 峰值 80-90min（pre-spike
基线 5-15min/day），完美对应 SEO PR 落地时间。

**这是 SEO 工作 successful 的代价，不是 bug**。流量是真实的搜索引擎 + 真实
用户增长，付费 Pro plan 阈值就是这么到的。

**本 PR 做的事是真实 waste 的清理**（不是 hack）：

- `/_not-found` 之前是 ƒ Dynamic（每条 scanner 都烧 Fluid）→ ○ Static
- `proxy.ts` 加 bot path 早返 404，scanner 不再进 Fluid
- `/[locale]/docs` `/events` `/login` 缺 setRequestLocale 导致退回 dynamic →
  补上 + generateStaticParams 让 SSG/ISR 真正工作

**撤回的"省 CPU hack"（写完才意识到丢了西瓜）**：

- ~~Sentry tracesSampleRate 0.1 → 0.02~~：保持 10%。observability 不能为这
  点 CPU 让步，10% 是行业标准
- ~~fetchEvents 失败一律返空~~：改成只在 `NEXT_PHASE === "phase-production-build"`
  时返空，运行时仍然 throw 让 Sentry 抓到真故障

本次修复在 `next build` 输出层面把 6 条路由从 ƒ 翻成 ● / ○：

| 路由             | 修前      | 修后         | 影响                                    |
| ---------------- | --------- | ------------ | --------------------------------------- |
| /\_not-found     | ƒ Dynamic | **○ Static** | 所有 scanner / 404 路径不再烧 Fluid CPU |
| /[locale]/docs   | ƒ         | ● SSG        | /zh/docs / /en/docs 走 CDN              |
| /[locale]/events | ƒ         | **● ISR 5m** | revalidate=300 终于真正生效             |
| /[locale]/login  | ƒ         | ● SSG        |                                         |
| /[locale]/editor | ƒ         | ● SSG        | (意外 cascade)                          |
| /[locale]/share  | ƒ         | ● SSG        | (意外 cascade)                          |

同时：

- `proxy.ts` 加 bot path 早返 404（拦在 edge，根本不进 Fluid）
- Sentry tracesSampleRate 0.1 → 0.02（5× 减少 trace 开销）

## 调查方法（验证黄金标准）

**唯一可信源：`next build` 的 Route table。** 不能靠"我以为加了 force-static
就行"——这正是上一轮优化为什么没生效。

```bash
# 修前快照
pnpm build 2>&1 | tee /tmp/build-before.txt

# 提取 Route 表
grep -E '^[┌├└] ' /tmp/build-before.txt > /tmp/routes-before.txt
```

修后跑同样命令，`diff /tmp/routes-before.txt /tmp/routes-after.txt` 直接看
哪些 ƒ 翻成 ● / ○。这是**事实**，不是推断。

## 四个被证实的根因

### H1：`/_not-found` dynamic（最大单点）

**证据**：

```
ƒ /_not-found        ← build 输出
```

```
# 18:34:34-18:34:40 一波扫描，全 → /_not-found（来源 Vercel runtime logs）
POST /zh/graphql/v2 200
POST /zh/graphql/v1 200
GET /var/www/html/.env 404
GET /css../../.env.production 404
...
```

**根因**：原 `app/not-found.tsx` 用 `await getTranslations("notFound")`。
`getTranslations` 内部走 `cookies()` 推断 locale，把这条路由钉成 dynamic。
每条扫描 + 每条真实 404 都是一次 Fluid 调用。

**修复**：去掉 `getTranslations`，改成 hardcoded 双语 hard-coded text（"页面
不存在 · Page not found"）。根 not-found 本就不知道用户期望哪种语言，双语并列
最稳。

**验证**：`next build` 显示 `○ /_not-found`，curl bot 路径应该非常快：

```bash
$ time curl -so /dev/null -w "%{http_code} %{time_total}s\n" \
    https://involutionhell.com/zh/some-fake-path
404 0.045s   # ← 应该 < 100ms（CDN 静态文件）
# 修前会是 200-500ms（Fluid 函数渲染）
```

### H1b：Bot scanner 还是会过 i18n middleware → SSR

即便 not-found 静态化，扫描器路径会先被 next-intl middleware 加 `/zh/` 前缀，
然后撞 `[locale]/[...slug]` 的 catch-all（● SSG 命中静态资源是 OK 的）或
admin 路由（ƒ Dynamic，仍然烧 CPU）。

**修复**：`proxy.ts` 在 i18n middleware 之前加 `isBotScanPath()` 早返 404。
列表包含 OWASP/nikto/dirbuster 常见指纹（`.php` / `wp-` / `.env` / `graphql` /
`werkzeug/console` / `phpmyadmin` 等）。明确**不包括** `login`/`admin` 等
真实业务路径。

**验证**：

```bash
# 应该 < 50ms（edge middleware 直接返）
$ curl -so /dev/null -w "%{http_code} %{time_total}s\n" \
    https://involutionhell.com/wp-admin/
404 0.030s

# Bot 扫 .php / .env / wp-* / graphql 全是 404 来自 edge
```

### H2：13 条 `[locale]/*` 缺 setRequestLocale → 全部 ƒ

**证据**（修前）：

```bash
$ grep -l "setRequestLocale" app/[locale]/*/page.tsx
# 几乎为空，仅 docs/page.tsx 命中
```

**根因**：next-intl 的 SSG 启用条件是**每个 page** 都得调 `setRequestLocale`。
parent layout（`[locale]/layout.tsx`）调了不够。缺这一步时 next-intl 内部
fallback 到 `cookies()`/`headers()`，让整棵 RSC 树变 dynamic。

参考 layout.tsx 的注释：

> 缺这一行的话，next-intl 会回退到从 cookies()/headers() 推断 locale，
> 整棵 RSC 树重新变 dynamic，绕了一圈又回到老问题。

**修复**：给 `/events` `/login` 加 `params: Promise<{locale:string}>` +
`await params; setRequestLocale(locale)` + `generateStaticParams() =>
routing.locales.map(l => ({locale: l}))`。

`/[locale]/docs/page.tsx` 已有 setRequestLocale 但仍然 ƒ —— 加 `export const
dynamic = "force-static"` 显式 opt-in。

**Build 期容错**：`/events` 走 SSG 后会在 build 时尝试 fetch backend。原版
fetch 失败抛错 → 整次 build 挂。改成失败降级返回空数组，build 出"暂无活动"
壳，ISR=300s 之后台拿到真数据。也是更鲁棒的设计。

**验证**：

```bash
# 修前
ƒ /[locale]/events
ƒ /[locale]/login
ƒ /[locale]/docs

# 修后
● /[locale]/events    5m   1y    # ← 真 ISR 了
● /[locale]/login
● /[locale]/docs
```

线上 curl：

```bash
$ curl -sI https://involutionhell.com/zh/events | grep -iE "x-vercel-cache|age"
x-vercel-cache: HIT    # ← CDN 命中
age: 142
```

### H3：~~Sentry tracesSampleRate 0.1 → 0.02~~（撤回）

最初打算改 10% → 2% 省 CPU。CR 后撤回——Sentry trace 在 30 天 CPU 占比远不及
crawler 流量，2% 省的是芝麻丢的是西瓜（observability）。10% 是行业标准，
client/server/edge 三处必须一致才能跨 runtime 串联请求链路。

**结论**：保持 0.1，不动 Sentry config。

### H4：dashboard 数据让根因更清晰（SEO 重抓风暴）

补观察后修订：

| 日期                 | CPU          | 主要 deploy                                              |
| -------------------- | ------------ | -------------------------------------------------------- |
| 4/14 - 5/5           | 5-15min/day  | 普通流量 + 周期扫描 baseline                             |
| 5/11 15:01-15:39 UTC | 30 → 50min   | PR #341：253 MDX descriptions backfill + 32 新 EN 翻译   |
| 5/11 16:02-18:41 UTC | 50 → 80min   | PR #342：remark heading shift + leetcode dedup           |
| 5/11 19:01-19:27 UTC | **90min 峰** | PR #343 + #340 deps，4 小时内 4 次 deploy ISR cache wipe |
| 5/12                 | ~45min       | crawler 余波未消，但日益下降                             |

`.github/workflows/deploy.yml` 的 `INDEXNOW_API` 让每次 deploy 都**主动告诉**
Bing / Google "URL 变了，快重抓"。PR #341 一次性改 253 个 MDX + 加 32 个新
URL，触发的就是这一波重抓。

**结论**：5.11 之后激增是真实流量。本 PR 修的是**不该花的 CPU**（scanner /
缺 SSG 的路由），让真实流量的边际成本最小化，但解决不了"SEO 太成功"这件事。
长期路径：上 Pro plan 或 Cloudflare proxy 挡 crawler。

## 还没修但记录在案的问题

| 问题                                                              | 影响                                                         | 为啥不在本 PR 修                                                       |
| ----------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `/api/docs-tree` 声明 `force-static` 但 build 仍 ƒ                | 中（每次访问 1 invocation）                                  | 需要改成 build 时生成 JSON 写 public/，路由读静态文件。改动较大单独 PR |
| `/feed/page.tsx` 用 server-side `searchParams` 把页面钉死 dynamic | 中（爬虫扫 8 分类 tab = 16 invocations/min）                 | 需要把 category 过滤改成 client-side fetch / route param。设计上重     |
| `/rank/page.tsx` 同上                                             | 低（rank 流量不大）                                          | 同上                                                                   |
| `/[locale]/u/[username]/*` 三条 ƒ                                 | 中（爬虫扫随机 username = 一次 SSR + backend 404）           | 需要 dynamicParams + 限流                                              |
| Uptime monitor 每分钟打 `/`（GET / 307 GET /zh 200）              | 验证后**不是 Fluid 主因**（/zh 是 ● SSG 走 CDN，不烧 Fluid） | 不修。可选优化：提供 `/api/health` edge 静态 200 减少 edge requests    |

## 量化预期

**修前**：368K function invocations / mo，CPU 7h54m / 4h（**超 198%**）。

**修后估算**：

- /\_not-found 静态化 + bot blocklist：拦截 ~30% 的 scanner 流量 → 函数调用 -30%
- 5 条 [locale]/\* SSG：~15-20% 调用归零（这些是真实用户 + 爬虫的常见目标）
- Sentry 0.1 → 0.02：每次调用 CPU 开销 -5-10%

**保守预期**：CPU 从 7h54m → ~3-4h（贴近 4h 配额，可能略超）。
**乐观预期**：CPU < 2h，远低于配额。

24-48h 后 dashboard 数据出来才能确定。如果还超，下一轮修剩下的 `/feed`
和 `/rank` searchParams 问题。

## 后续工作

- [ ] 修 `/api/docs-tree` build-time 生成
- [ ] /feed /rank 搜索参数从 server-side 改 client-side
- [ ] /[locale]/u/[username] ISR + dynamicParams
- [ ] 给 admin 路由加 edge-middleware 早返 401，不让 bot 触发 Fluid
- [ ] （可选）Cloudflare proxy 挡在 Vercel 前过滤 bot
