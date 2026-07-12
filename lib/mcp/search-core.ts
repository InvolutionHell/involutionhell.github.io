import { create, insertMultiple, search } from "@orama/orama";
import { createTokenizer } from "@orama/tokenizers/mandarin";
import type { AdvancedIndex } from "fumadocs-core/search/server";
import type { StructuredData } from "fumadocs-core/mdx-plugins";
import type { SearchResult } from "@/lib/mcp/schemas";

const SITE_ORIGIN = "https://involutionhell.com";
const MAX_SNIPPET_LENGTH = 299;

const schema = {
  id: "string",
  page_id: "string",
  type: "string",
  url: "string",
  content: "string",
} as const;

interface IndexedPage {
  title: string;
  description: string;
  url: string;
  structuredData: StructuredData;
  normalized: {
    title: string;
    description: string;
    headings: string[];
    contents: string[];
  };
}

export interface SearchShard {
  db: ReturnType<typeof create<typeof schema>>;
  pages: Map<string, IndexedPage>;
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeForMatch(value: string): string {
  return normalizeText(value).toLocaleLowerCase();
}

function relevantContent(
  contents: StructuredData["contents"],
  query: string,
): string {
  const normalizedQuery = normalizeForMatch(query);
  const exact = contents.find((entry) =>
    normalizeForMatch(entry.content).includes(normalizedQuery),
  );
  if (exact) return exact.content;

  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  let best = "";
  let bestScore = 0;
  for (const entry of contents) {
    const text = normalizeForMatch(entry.content);
    const score = terms.reduce(
      (total, term) => total + (text.includes(term) ? term.length : 0),
      0,
    );
    if (score > bestScore) {
      best = entry.content;
      bestScore = score;
    }
  }

  return best || contents[0]?.content || "";
}

export function extractSnippet(
  contents: StructuredData["contents"],
  query: string,
): string {
  const text = normalizeText(relevantContent(contents, query));
  if (text.length <= MAX_SNIPPET_LENGTH) return text;

  const normalizedQuery = normalizeForMatch(query);
  const matchAt = text.toLocaleLowerCase().indexOf(normalizedQuery);
  const contentLength = MAX_SNIPPET_LENGTH - 2;
  const start = Math.max(
    0,
    Math.min(matchAt > -1 ? matchAt - 80 : 0, text.length - contentLength),
  );
  const excerpt = text.slice(start, start + contentLength);
  return `${start > 0 ? "…" : ""}${excerpt}${
    start + contentLength < text.length ? "…" : ""
  }`.slice(0, MAX_SNIPPET_LENGTH);
}

export function toAbsoluteSiteUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, SITE_ORIGIN).toString();
}

export async function createSearchShard(
  indexes: AdvancedIndex[],
  locale: "zh" | "en",
): Promise<SearchShard> {
  const db = create({
    schema,
    ...(locale === "zh"
      ? { components: { tokenizer: createTokenizer() } }
      : { language: "english" }),
  });
  const pages = new Map<string, IndexedPage>();
  const records: Array<{
    id: string;
    page_id: string;
    type: string;
    url: string;
    content: string;
  }> = [];

  for (const page of indexes) {
    pages.set(page.id, {
      title: page.title,
      description: page.description ?? "",
      url: page.url,
      structuredData: page.structuredData,
      normalized: {
        title: normalizeForMatch(page.title),
        description: normalizeForMatch(page.description ?? ""),
        headings: page.structuredData.headings.map((heading) =>
          normalizeForMatch(heading.content),
        ),
        contents: page.structuredData.contents.map((content) =>
          normalizeForMatch(content.content),
        ),
      },
    });
    let sequence = 0;
    records.push({
      id: page.id,
      page_id: page.id,
      type: "page",
      url: page.url,
      content: page.title,
    });
    if (page.description) {
      records.push({
        id: `${page.id}-${sequence++}`,
        page_id: page.id,
        type: "text",
        url: page.url,
        content: page.description,
      });
    }
    for (const heading of page.structuredData.headings) {
      records.push({
        id: `${page.id}-${sequence++}`,
        page_id: page.id,
        type: "heading",
        url: `${page.url}#${heading.id}`,
        content: heading.content,
      });
    }
    for (const content of page.structuredData.contents) {
      records.push({
        id: `${page.id}-${sequence++}`,
        page_id: page.id,
        type: "text",
        url: content.heading ? `${page.url}#${content.heading}` : page.url,
        content: content.content,
      });
    }
  }

  await insertMultiple(db, records);
  return { db, pages };
}

export async function searchShard(
  shard: SearchShard,
  query: string,
  limit: number,
): Promise<SearchResult[]> {
  const response = await search(shard.db, {
    term: query,
    properties: ["content"],
    threshold: 0.3,
    tolerance: 1,
    limit: Math.max(limit * 8, 40),
    groupBy: {
      properties: ["page_id"],
      maxResult: 8,
    },
  });

  const normalizedQuery = normalizeForMatch(query);
  const exactPageIds = [...shard.pages.entries()]
    .map(([pageId, page]) => {
      let score = 0;
      if (page.normalized.title.includes(normalizedQuery)) {
        score += 1_000;
      }
      if (page.normalized.description.includes(normalizedQuery)) {
        score += 300;
      }
      score +=
        page.normalized.headings.filter((heading) =>
          heading.includes(normalizedQuery),
        ).length * 200;
      score +=
        page.normalized.contents.filter((content) =>
          content.includes(normalizedQuery),
        ).length * 100;
      return { pageId, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.pageId);
  const fuzzyPageIds = (response.groups ?? []).map((group) =>
    String(group.values[0]),
  );
  const pageIds = [...new Set([...exactPageIds, ...fuzzyPageIds])].slice(
    0,
    limit,
  );

  return pageIds.flatMap((pageId) => {
    const page = shard.pages.get(pageId);
    if (!page) return [];
    return [
      {
        title: page.title,
        description: page.description,
        url: toAbsoluteSiteUrl(page.url),
        snippet: extractSnippet(page.structuredData.contents, query),
      },
    ];
  });
}
