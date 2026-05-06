import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

/**
 * next-intl 请求级配置：决定当前请求用哪个 locale + 加载哪份 messages。
 *
 * 关键变化：
 *   旧版从 cookie 读 locale → RSC 树被钉成 dynamic（cookies() 副作用），
 *   全站 318 篇 docs 每访问一次现 SSR 一次，Vercel Fluid CPU 月用满 4h。
 *   新版从 requestLocale 读（next-intl 从 [locale] 段 + middleware 推断），
 *   不再 await cookies()，配合 setRequestLocale 全站 RSC 可静态渲染。
 *
 * setRequestLocale 必须在 [locale]/layout.tsx 第一行调用；admin / api 等
 * 不在 [locale] 下的路由没调到，requestLocale 为 undefined，fallback 到
 * defaultLocale (zh)，admin 永远显示中文。
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
