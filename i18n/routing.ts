import { defineRouting } from "next-intl/routing";

/**
 * 全站 i18n 路由配置（next-intl URL routing）。
 *
 * 为什么 always prefix（zh 也带 /zh/）：
 *   1. 多语言扩展时维护更整齐，不存在"默认语言不带前缀"特例
 *   2. Google 国际 SEO 友好：每个语言独立 URL，索引权重不会混在一起
 *   3. canonical / hreflang 规则统一，避免特例分支
 *
 * 历史背景（why this rewrite）：
 *   原方案用 cookie + RSC 切语言（i18n/request.ts await cookies()），
 *   导致全站 RSC 树被钉成 dynamic，318 篇 docs 每访问一次现 SSR 一次，
 *   Vercel Fluid Active CPU 月用量逼近 4h（Hobby 上限）。
 *   切换到 URL 段后所有 user-facing 路由可以 SSG，CPU 接近归零。
 */
export const routing = defineRouting({
  locales: ["zh", "en"],
  defaultLocale: "zh",
  // always: 默认语言也带前缀（详见上方注释）
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
