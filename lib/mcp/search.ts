import { source } from "@/lib/source";
import { isEnglishPage, pageToIndex } from "@/lib/search-index";
import {
  createSearchShard,
  searchShard,
  type SearchShard,
} from "@/lib/mcp/search-core";
import type { SearchInput, SearchResult } from "@/lib/mcp/schemas";
import { createRetryablePromiseCache } from "@/lib/mcp/promise-cache";

const getShard = createRetryablePromiseCache<
  SearchInput["locale"],
  SearchShard
>(async (locale) => {
  const pages = source
    .getPages(locale)
    .filter((page) =>
      locale === "en" ? isEnglishPage(page) : !isEnglishPage(page),
    );
  const indexes = await Promise.all(pages.map(pageToIndex));
  return createSearchShard(indexes, locale);
});

export async function searchSiteArticles(
  input: SearchInput,
): Promise<SearchResult[]> {
  return searchShard(await getShard(input.locale), input.query, input.limit);
}
