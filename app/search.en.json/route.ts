import { createSearchAPI } from "fumadocs-core/search/server";
import { source } from "@/lib/source";
import { pageToIndex, isEnglishPage } from "@/lib/search-index";

export const dynamic = "force-static";

/**
 * 英文搜索索引分片：只包含 lang==="en" 的翻译版文档，
 * 用 Orama 默认英文分词（无需 mandarin tokenizer）。
 */
const api = createSearchAPI("advanced", {
  indexes: () =>
    Promise.all(source.getPages().filter(isEnglishPage).map(pageToIndex)),
  language: "english",
  search: {
    threshold: 0.3,
    tolerance: 1,
  },
});

export const GET = api.staticGET;
