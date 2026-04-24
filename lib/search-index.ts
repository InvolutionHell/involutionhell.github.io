import type { AdvancedIndex } from "fumadocs-core/search/server";
import { source } from "@/lib/source";
import { basename, extname } from "path";

type Page = ReturnType<typeof source.getPages>[number];

/**
 * fumadocs 页面 data 里可能携带的结构化搜索数据。
 * 形状与 fumadocs-core 的 StructuredData 对齐（headings + contents），
 * 但我们从 page.data 运行时读出来，所以显式写成本地类型别名，不依赖内部导出。
 */
interface PageStructuredData {
  headings: { id: string; content: string }[];
  contents: { heading: string | undefined; content: string }[];
}

/**
 * fumadocs page.data 在构建产物里的 runtime shape。
 * 老路径：structuredData 直接 inline；新路径：通过 load() 异步拉。
 */
interface PageDataShape {
  structuredData?: PageStructuredData;
  load?: () => Promise<{ structuredData: PageStructuredData }>;
  title?: string;
  description?: string;
}

/**
 * 把一个 fumadocs 页面转成 Orama 索引项（复用 fumadocs-core 默认实现逻辑），
 * 单独抽出来是因为我们需要分片（zh / en），用 createSearchAPI 手动传 indexes。
 */
export async function pageToIndex(page: Page): Promise<AdvancedIndex> {
  const data = page.data as PageDataShape;

  let structuredData: PageStructuredData | undefined;
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
 * 翻译版 frontmatter 会声明 `lang: "en"` 且通常 `translatedFrom: "zh"`。
 */
export function isEnglishPage(page: Page): boolean {
  const lang = (page.data as { lang?: string }).lang;
  return lang === "en";
}
