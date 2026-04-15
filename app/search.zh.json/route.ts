import { createSearchAPI } from "fumadocs-core/search/server";
import { createTokenizer } from "@orama/tokenizers/mandarin";
import { source } from "@/lib/source";
import { pageToIndex, isEnglishPage } from "@/lib/search-index";

export const dynamic = "force-static";

/**
 * 中文搜索索引分片：包含所有原文（中文 + 未标语言的默认文档）+ 显式 lang="zh" 的翻译版。
 * 排除 lang==="en" 的英文翻译版，后者由 /search.en.json 负责。
 *
 * 这样拆分是为了避开 Vercel 单个 ISR 响应 19.07MB 的硬上限（FALLBACK_BODY_TOO_LARGE）。
 * 文档数量继续增长时可进一步按目录切分。
 */
const api = createSearchAPI("advanced", {
  // Dynamic 形式：createSearchAPI 期望 () => T[] | Promise<T[]>，不是裸 Promise
  indexes: () =>
    Promise.all(
      source
        .getPages()
        .filter((page) => !isEnglishPage(page))
        .map(pageToIndex),
    ),
  components: {
    tokenizer: createTokenizer(),
  },
  search: {
    threshold: 0.3,
    tolerance: 1,
  },
});

export const GET = api.staticGET;
