// lib/doc-entry.ts

/**
 * @file lib/doc-entry.ts
 * @description
 * 文档页 → URL / 可见性的共享判定。
 *
 * 原来这两个函数是 `app/sitemap.ts` 的私有函数。`app/llms.txt/route.ts`
 * 要枚举同一批文档，如果各写一份，早晚会出现「sitemap 过滤了 draft、
 * llms.txt 没过滤」这种单边漂移 —— 草稿泄漏给 AI 引擎和泄漏给搜索引擎
 * 一样糟。抽到这里，两边共用一份，理由同 `lib/site-url.ts` 文件头。
 *
 * 刻意不 import `@/lib/source`：那条链会把整个 fumadocs-mdx 管线拖进来，
 * vitest 没配 MDX 插件会直接 parse 失败。入参用结构化的宽类型，
 * 让本文件保持纯函数、可单测。
 */

import type { PageData } from "@/app/types/doc";

/**
 * 文档是否是草稿 / 隐藏页。
 *
 * frontmatter 字段 fumadocs 会打平到 data 根部，但历史上也有代码显式写
 * `frontmatter.draft`，两处都查。入参用 `{ data?: unknown }` 而不是
 * PageData，是为了让调用方直接传 fumadocs 的 SourcePage 而不必先 cast。
 */
export function isDraftOrHidden(page: { data?: unknown }): boolean {
  const d = (page.data ?? {}) as PageData;
  return !!(
    d.draft ||
    d.hidden ||
    d.frontmatter?.draft ||
    d.frontmatter?.hidden
  );
}

/**
 * 文档 slugs → 站内路径（不含 locale 前缀）。
 *
 * 逐段 encodeURIComponent：仓库里有中文文件名（`142.环形链表II`），
 * 不编码的 URL 进 sitemap / llms.txt 会被部分抓取方判为非法。
 * 根文档（slugs 为空）落到 `/docs`。
 */
export function docPathname(slugs: string[]): string {
  const slugPath = slugs
    .filter(Boolean)
    .map((s) => encodeURIComponent(s))
    .join("/");
  return slugPath ? `/docs/${slugPath}` : "/docs";
}
