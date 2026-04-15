import type { AdvancedIndex } from "fumadocs-core/search/server";
import { source } from "@/lib/source";
import { basename, extname } from "path";

type Page = ReturnType<typeof source.getPages>[number];

/**
 * 把一个 fumadocs 页面转成 Orama 索引项（复用 fumadocs-core 默认实现逻辑），
 * 单独抽出来是因为我们需要分片（zh / en），用 createSearchAPI 手动传 indexes。
 */
export async function pageToIndex(page: Page): Promise<AdvancedIndex> {
  const data = page.data as {
    structuredData?: unknown;
    load?: () => Promise<{ structuredData: unknown }>;
    title?: string;
    description?: string;
  };

  let structuredData: unknown;
  if ("structuredData" in data && data.structuredData) {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

/**
 * 判断一个 fumadocs 页面是否为英文翻译版。
 * 翻译版 frontmatter 会声明 `lang: "en"` 且通常 `translatedFrom: "zh"`。
 */
export function isEnglishPage(page: Page): boolean {
  const lang = (page.data as { lang?: string }).lang;
  return lang === "en";
}
