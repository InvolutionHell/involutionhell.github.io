import { createSearchAPI } from "fumadocs-core/search/server";
import { source } from "@/lib/source";
import { pageToIndex, isEnglishPage } from "@/lib/search-index";

export const dynamic = "force-static";

/**
 * 英文搜索索引分片：按 frontmatter 或 .en 文件名识别翻译版文档，
 * 用 Orama 默认英文分词（无需 mandarin tokenizer）。
 */
const api = createSearchAPI("advanced", {
  indexes: () =>
    Promise.all(source.getPages("en").filter(isEnglishPage).map(pageToIndex)),
  language: "english",
  search: {
    threshold: 0.3,
    tolerance: 1,
  },
});

export const GET = api.staticGET;
