// app/llms.txt/route.ts

/**
 * @file app/llms.txt/route.ts
 * @description
 * `/llms.txt` 路由（llmstxt.org 约定）。AI 引擎抓站时先读它拿全站索引。
 *
 * 为什么是 route handler 而不是 public/llms.txt：文档是 MDX，会增删改，
 * 手维护一份静态索引必然过期。这里从 `source` 现枚举，和 sitemap 同源。
 *
 * force-static：内容全部来自构建期的 MDX，没有请求相关的东西，
 * 构建时产出一次即可，别让它变成每次请求现算的 dynamic 路由
 * （i18n/routing.ts 文件头记着上次全站 dynamic 把 Vercel CPU 打爆的事）。
 *
 * @see https://llmstxt.org
 */

import type { PageData } from "@/app/types/doc";
import { routing } from "@/i18n/routing";
import { docPathname, isDraftOrHidden } from "@/lib/doc-entry";
import { buildLlmsTxt, type LlmsTxtEntry } from "@/lib/llms-txt";
import { SITE_URL } from "@/lib/site-url";
import { source } from "@/lib/source";

export const dynamic = "force-static";

/** 分组小标题里 locale 的显示名，未知 locale 直接显示代码。 */
const LOCALE_LABEL: Record<string, string> = { zh: "中文", en: "English" };

export function GET() {
  const entries: LlmsTxtEntry[] = [];

  for (const locale of routing.locales) {
    for (const page of source.getPages(locale)) {
      // 和 sitemap 同一套过滤：草稿泄漏给 AI 引擎和泄漏给搜索引擎一样糟
      if (isDraftOrHidden(page)) continue;

      const data = (page.data ?? {}) as PageData;
      // slugs[0] 是顶层分区（career / learn / projects），拿来当分组
      const topLevel = page.slugs[0] ?? "docs";

      entries.push({
        pathname: `/${locale}${docPathname(page.slugs)}`,
        title: data.title ?? page.slugs.at(-1) ?? "Untitled",
        description: data.description,
        section: `${LOCALE_LABEL[locale] ?? locale} · ${topLevel}`,
      });
    }
  }

  return new Response(buildLlmsTxt(entries, SITE_URL), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
