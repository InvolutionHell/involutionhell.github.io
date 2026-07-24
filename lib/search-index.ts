import type { AdvancedIndex } from "fumadocs-core/search/server";
// StructuredData 是 fumadocs-core 的公开导出（从 mdx-plugins 入口），
// 直接用上游类型，不再在本地维护同形副本以免两边 drift。
import type { StructuredData } from "fumadocs-core/mdx-plugins";
import { source } from "@/lib/source";
import { basename, extname } from "path";
import { type PageData } from "@/app/types/doc";

type Page = ReturnType<typeof source.getPages>[number];

/**
 * 把一个 fumadocs 页面转成 Orama 索引项（复用 fumadocs-core 默认实现逻辑），
 * 单独抽出来是因为我们需要分片（zh / en），用 createSearchAPI 手动传 indexes。
 */
export async function pageToIndex(page: Page): Promise<AdvancedIndex> {
  const data = page.data as PageData;

  let structuredData: StructuredData | undefined;
  if (data.structuredData) {
    structuredData = data.structuredData;
  } else if (typeof data.load === "function") {
    structuredData = (await data.load()).structuredData;
  }

  if (!structuredData) {
    throw new Error(
      `[search-index] 页面缺少 structuredData: ${page.path ?? page.url}`,
    );
  }

  return {
    id: page.url,
    title: data.title ?? basename(page.path, extname(page.path)),
    description: data.description,
    url: page.url,
    structuredData,
  };
}

/**
 * 判断一个 fumadocs 页面是否为英文翻译版。
 * 兼容 frontmatter 语言标记和 Fumadocs 保留的原始 source path。
 */
export function isEnglishPage(page: { data: unknown; path: string }): boolean {
  const lang = (page.data as PageData).lang;
  return lang === "en" || /\.en\.mdx?$/i.test(page.path);
}
