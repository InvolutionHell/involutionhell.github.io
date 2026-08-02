// lib/doc-entry.ts

/**
 * @file lib/doc-entry.ts
 * @description
 * sitemap 与 llms.txt 共用的文档过滤 / URL 编码，两边必须同进同退：
 * 只有一边过滤 draft 的话，草稿会静默泄漏给另一边的抓取方。
 *
 * 刻意不 import `@/lib/source`：那条链会把整个 fumadocs-mdx 管线拖进来，
 * vitest 没配 MDX 插件会直接 parse 失败。入参因此用结构化宽类型。
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
