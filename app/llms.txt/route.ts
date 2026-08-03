// app/llms.txt/route.ts

/**
 * @file app/llms.txt/route.ts
 * @description
 * `/llms.txt` 路由（llmstxt.org 约定）。
 *
 * force-static 是必需的，不是优化：内容只依赖构建期的 MDX，漏了它这条路由
 * 会退化成每次请求现枚举全站文档的 dynamic 路由。
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
