# i18n URL 段化架构

## 为什么是这套

社区 2026-04-16 上线的双语方案是「URL 不变 + cookie 决定语言」：

```ts
// 旧版 i18n/request.ts
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value === "en" ? "en" : "zh";
  return { locale, messages };
});
```

`cookies()` 在 RSC 里调用 → next-intl 把这个 hook 注入到整棵 RSC 树 →
**全站所有 page 都被钉成 dynamic**。318 篇 docs 每访问一次现 SSR 一次：

- `pnpm build` 表里所有 user-facing 路由都是 `ƒ Dynamic`
- `.next/prerender-manifest.json` 只剩 5 条预渲染（robots / search.json / sitemap）
- Vercel Observability 显示 30 天 Fluid Active CPU 用了 3h 51m / 4h（Hobby 96%）
- 流量越大 CPU 越涨，不可持续

2026-05 改成 next-intl 标准的 **URL routing** —— locale 从 URL 段（`/zh/...` /
`/en/...`）推断，不读 cookie，全树可静态化。

## 文件分工

```
i18n/
  routing.ts        defineRouting：locales [zh, en], localePrefix: always
  navigation.ts     createNavigation：Link / useRouter / usePathname / redirect
  request.ts        getRequestConfig：从 requestLocale 读，不再 await cookies()

proxy.ts            (Next.js 16 用 proxy.ts 不是 middleware.ts)
                    1. 老 leetcode 中文 slug 优先 301
                    2. 其它请求交给 next-intl createMiddleware

app/
  layout.tsx        极简 root layout：html/body + 全局 metadata + 全局 script
                    （theme inline / structured data / GA / Umami）
                    不读 locale，不包 NextIntlClientProvider
  [locale]/
    layout.tsx      调 setRequestLocale + 包所有 provider
                    （NextIntlClientProvider / ThemeProvider / AuthProvider /
                     fumadocs RootProvider）
                    inline script 把 documentElement.lang 改到当前 locale
    page.tsx        首页（仍 ƒ，下一轮迁）
    docs/
      page.tsx      /[locale]/docs landing
      layout.tsx    docs sidebar layout（用 source.getPageTree(locale)）
      [...slug]/
        page.tsx    文章详情，force-static + setRequestLocale + 双倍预渲染
    admin/          管理后台也并入 [locale]，写死 zh 也行（messages 里有）
    events/  feed/  login/  rank/  settings/  share/  editor/  u/

  api/              不进 [locale]，无 UI 的 fetch endpoint
  sitemap.ts        输出双语 + alternates.languages
  robots.ts         disallow 用 wildcard /\*\/admin/ 等

content/
  docs/             ← 这里是 mdx 内容（旧版混在 app/docs/，已分离）
                      fumadocs 推荐 routes / content 分离
```

## SSG 的开关

**关键开关：每个 page 和 layout 都得调 `setRequestLocale(locale)`**。少一个，
对应路由就被 next-intl 退回 dynamic。

```tsx
// app/[locale]/<some-route>/page.tsx
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale); // ← 必须，且必须在任何 next-intl hook 之前

  // ... 业务逻辑
}
```

### docs 详情页额外加 `force-static`

```tsx
// app/[locale]/docs/[...slug]/page.tsx
export const dynamic = "force-static";
```

不加这条时，即便 `setRequestLocale` 都对了，Next.js 16 仍会把这条路由
标 `ƒ Dynamic`（实测 SSG 0 页）。`force-static` 让 Next 严格按
`generateStaticParams` 预渲染所有 (locale, slug) 组合。

### generateStaticParams 双倍出货

```tsx
export async function generateStaticParams() {
  return source.generateParams("slug", "lang").map((p) => ({
    locale: p.lang as string,
    slug: p.slug as string[],
  }));
}
```

fumadocs 自带的 `generateParams('slug', 'lang')` 会按 i18n 配置自动产出
{locale × slug} 笛卡尔积。我们 mapping 一下 lang→locale（next-intl 用 locale）。

## 文档命名约定

`source.config.ts` 用 fumadocs **dot parser**：

| 文件名              | 识别为                                 |
| ------------------- | -------------------------------------- |
| `xxx.mdx`（无后缀） | zh（默认）                             |
| `xxx.en.mdx`        | en                                     |
| `xxx.zh.mdx`        | **不要用**，与无后缀冲突，build 会报错 |

历史上仓库里有 8 对 conflict（无后缀 = 英文 + `.zh.mdx` = 中文翻译），改造时
统一 swap 成「无后缀 = zh + `.en.mdx` = 英文翻译」。

### 加新文章

```bash
# 中文原文（默认 locale）
content/docs/learn/<分区>/<新文章>.mdx

# 英文翻译（可选）
content/docs/learn/<分区>/<新文章>.en.mdx
```

frontmatter 不需要写 `lang` 字段。fumadocs 按文件名后缀识别。

### 缺译怎么办

`lib/source.ts` 配 `fallbackLanguage: "zh"`：访问 `/en/docs/<slug>` 但 `.en.mdx`
不存在时，自动渲染原文（zh）。文档站合理体验（缺译显示中文 > 显示空白）。

## 加新 user-facing 路由

新建 page 时直接抄这个 boilerplate，就能保证 SSG + i18n 同时正确：

```tsx
// app/[locale]/<your-route>/page.tsx
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

interface Props {
  params: Promise<{ locale: string }>;
}

// 没 server fetch 才能加 force-static；如果 page 里有 await fetch(...)
// 就别加（会和 fetch 冲突报错），靠 setRequestLocale 也能让 RSC 静态化。
export const dynamic = "force-static";

export default async function Page({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale); // ← 必须，且必须排在任何 next-intl hook 之前

  // ... 业务逻辑
  return <div>...</div>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return {
    alternates: {
      canonical: `/${locale}/<your-route>`,
      languages: {
        "zh-CN": "/zh/<your-route>",
        "en-US": "/en/<your-route>",
        "x-default": "/zh/<your-route>",
      },
    },
  };
}
```

**几条容易踩的坑**：

1. **`setRequestLocale` 必须在第一位**。排在 `useTranslations` / `getMessages`
   / `getTranslations` 之前。否则 next-intl 会回退到从 cookies/headers 推断
   locale，整页变 dynamic。
2. **导航 API 用 `@/i18n/navigation` 而不是 `next/navigation`**。在 [locale]
   段下的客户端组件如果 `import { useRouter } from 'next/navigation'`，
   `router.push("/foo")` 会跳到 `/foo` 而不是 `/<locale>/foo`，丢 locale 段。
   ```tsx
   // ✅ 正确
   import { useRouter, Link } from "@/i18n/navigation";
   // ❌ 错误（在 [locale] 段下不要用）
   import { useRouter } from "next/navigation";
   import Link from "next/link";
   ```
3. **components 在 `app/components/`（不在 [locale] 下）**。组件本身不需要
   locale 段，导入用 `@/app/components/X`。
4. **server fetch 让 page 退回 dynamic**。如果非要 fetch backend，参考首页
   的做法：建一个 `/api/public/<x>` ISR 代理（revalidate=300），组件改 client
   useEffect fetch，page 本身保持纯静态。
5. **layout.tsx 嵌套时也要调 `setRequestLocale`**。Next.js 独立渲染 layout
   和 page；page 调了 layout 没调照样退化 dynamic。每层都要补。

## 加新 backend rewrite（next.config.mjs）

**⚠️ 任何不带 `/api/` 前缀的 rewrite source，都要同步更新 `proxy.ts` 的
matcher 排除组**，否则 next-intl middleware 会把请求 redirect 到
`/<locale>/<your-path>/...`，rewrite source 不匹配带 locale 的 URL，落到
`[locale]/<your-path>/...` 404。

历史事故（PR #335）：`/oauth/render/github` 被 redirect 到
`/en/oauth/render/github`，登录炸了 3 分钟。

正确流程：

```ts
// 1. next.config.mjs
async rewrites() {
  return [
    { source: "/foobar/:path*", destination: `${backendUrl}/foobar/:path*` },
  ];
}

// 2. proxy.ts ← 必须同步加 foobar 到排除组
matcher: "/((?!api|trpc|auth|oauth|analytics|foobar|_next|_vercel|.*\\..*).*)",
```

`tests/proxy-matcher.test.ts` 静态扫 `next.config.mjs` 所有 rewrite source，
对每个第一段路径 verify 它在 matcher 排除组里；忘了同步会 CI fail。

## 切换语言

`<LocaleToggle />` 用 next-intl 的 `useRouter().replace(pathname, { locale })`。
原理：

1. `usePathname()` 返回去 locale 的 pathname（例如当前 URL 是 `/zh/docs/x`，
   pathname = `/docs/x`）
2. `router.replace(pathname, { locale: "en" })` 自动加 `/en` 前缀 →
   实际跳转 `/en/docs/x`
3. next-intl 同时把 `NEXT_LOCALE` cookie 同步到 `en`，供下次访问根路径
   `/` 时 middleware 选默认 locale 用

切换是真 URL 跳转，浏览器历史会留两条记录（`router.replace` 只覆盖当前记录）。

## SEO

### hreflang / canonical

`docs/[...slug]/page.tsx` 的 `generateMetadata` 输出：

```
canonical: /<locale>/docs/<slug>
languages:
  zh-CN: /zh/docs/<slug>
  en-US: /en/docs/<slug>
  x-default: /zh/docs/<slug>
```

每个 locale 各自 canonical，避免 zh / en 互相竞争 PageRank。

### sitemap

`app/sitemap.ts` 每个 URL 输出双语 entry，并填 `alternates.languages`。Google
按 `xhtml:link rel="alternate" hreflang` 元素建立两个 URL 之间的关系，正确处理
搜索结果按用户语言展示。

### robots

`disallow` 用 wildcard 形式 `/*/admin/` 等匹配两种 locale 前缀。

## proxy 流程

每个请求 → `proxy.ts` →

1. 命中老 leetcode 路径 → 301 到拼音新 URL（带 locale 前缀）
2. 否则 → next-intl `createMiddleware`：
   - 不带 locale 前缀 → 308 redirect 到 `/<defaultLocale>/...`（可能是 `/zh`
     或按 cookie / Accept-Language）
   - 带 locale 前缀 → 直通

matcher 排除 `api / trpc / _next / _vercel / 任何带 . 的路径`。admin 不再排除
（已并入 `[locale]/admin`）。

## 调试常见问题

### 添加新 page 后 build 表里仍是 `ƒ Dynamic`

90% 是 page 或它的 layout 缺 `setRequestLocale`。先在 page 里加，再看 layout
有没有调。`setRequestLocale` 必须排在任何 next-intl hook（`useTranslations` /
`getMessages` / `getTranslations`）之前。

### 加了 `setRequestLocale` 还是 `ƒ`

可能 page 或 layout 调了 server fetch（例如 `await fetch(BACKEND_URL)`）。
任何 server fetch 都会让该路由 dynamic。要么改成 client fetch，要么 build 时
prebuild 到 JSON（参考 `generated/site-leaderboard.json` 模式）。

### `Both middleware file and proxy file detected`

Next.js 16 只接受 `proxy.ts`，不再接受 `middleware.ts`。两个文件不能共存。

### docs sidebar 缺翻译版变体

老版用手写 `pickVariantsByLocale` 剪 sidebar tree。新版用 `source.getPageTree(locale)`，fumadocs i18n 已经按 locale 隔离，不再需要手写过滤。`SectionIndex` 组件
和 `docs/layout.tsx` 都靠这套。

### Edit on GitHub 链接 404

`DOCS_BASE` 在 `lib/github.ts` 应是 `content/docs`。如果改了 mdx 路径，要
同步改这个常量 + `lib/contributors.ts` 的 `normalizeRelativePath`。

## 已知未做（下一轮 PR）

| 路由                     | 当前 | 阻碍                                       | 处理思路                                  |
| ------------------------ | ---- | ------------------------------------------ | ----------------------------------------- |
| `/[locale]`              | ƒ    | `await fetchHomepageEvents()` server fetch | FloatWindow 自己 client fetch；首页变 SSG |
| `/[locale]/events`       | ƒ    | server fetch backend                       | client component 化；或 ISR 化            |
| `/[locale]/feed`         | ƒ    | server fetch                               | 同上                                      |
| `/[locale]/u/[username]` | ƒ    | 用户数据是 dynamic                         | 保持 dynamic 即可（量小）                 |
| `/[locale]/admin/*`      | ƒ    | 鉴权页面，不需要 SSG                       | 保持 dynamic                              |

实际**只有首页值得做**（占当前 CPU 25%）。其它要么数据动态，要么访问量小。

## 参考

- next-intl URL routing 标准 setup: <https://next-intl-docs.vercel.app/docs/routing>
- fumadocs i18n: <https://fumadocs.dev/docs/headless/internationalization>
- 老 cookie 方案的 commit: `d0a420d` (2026-04-16 i18n 双语系统初版)
- URL 段化改造的 PR: #330
