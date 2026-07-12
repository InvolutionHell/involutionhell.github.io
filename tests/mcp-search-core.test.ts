import { describe, expect, it } from "vitest";
import type { AdvancedIndex } from "fumadocs-core/search/server";
import {
  createSearchShard,
  extractSnippet,
  searchShard,
  toAbsoluteSiteUrl,
} from "@/lib/mcp/search-core";

const fixture: AdvancedIndex[] = [
  {
    id: "/docs/algorithms/array",
    title: "数组算法入门",
    description: "从数组的基本操作开始。",
    url: "/docs/algorithms/array",
    structuredData: {
      headings: [{ id: "basics", content: "基础" }],
      contents: [
        {
          heading: "basics",
          content: `${"前置说明".repeat(45)}数组支持按下标访问元素，也常用于双指针算法。${"补充内容".repeat(45)}`,
        },
      ],
    },
  },
  {
    id: "/docs/backend/database",
    title: "数据库基础",
    description: "关系数据库与事务。",
    url: "/docs/backend/database",
    structuredData: {
      headings: [],
      contents: [{ heading: undefined, content: "事务需要满足 ACID。" }],
    },
  },
];

describe("MCP search core", () => {
  it("maps fabricated index hits to article results", async () => {
    const shard = await createSearchShard(fixture, "zh");
    const results = await searchShard(shard, "数组", 1);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      title: "数组算法入门",
      description: "从数组的基本操作开始。",
      url: "https://involutionhell.com/docs/algorithms/array",
    });
    expect(results[0]?.snippet).toContain("数组");
    expect(results[0]?.snippet.length).toBeLessThan(300);
  });

  it("precomputes normalized text without changing exact-match ranking", async () => {
    const shard = await createSearchShard(fixture, "zh");
    const indexed = shard.pages.get("/docs/algorithms/array");

    expect(indexed?.normalized).toMatchObject({
      title: "数组算法入门",
      description: "从数组的基本操作开始。",
      headings: ["基础"],
    });
    expect(indexed?.normalized.contents[0]).toContain("数组支持按下标访问元素");
    expect((await searchShard(shard, "数组", 2))[0]?.title).toBe(
      "数组算法入门",
    );
  });

  it("extracts a bounded relevant snippet", () => {
    const snippet = extractSnippet(fixture[0]!.structuredData.contents, "数组");
    expect(snippet).toContain("数组");
    expect(snippet.length).toBeLessThan(300);
  });

  it("builds absolute site URLs", () => {
    expect(toAbsoluteSiteUrl("docs/example")).toBe(
      "https://involutionhell.com/docs/example",
    );
  });
});
