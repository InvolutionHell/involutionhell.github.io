import { describe, expect, it } from "vitest";
import { publishInputSchema, searchInputSchema } from "@/lib/mcp/schemas";

describe("MCP tool input schemas", () => {
  it("applies search defaults", () => {
    expect(searchInputSchema.parse({ query: "数组" })).toEqual({
      query: "数组",
      locale: "zh",
      limit: 8,
    });
  });

  it.each([
    { query: "" },
    { query: "   " },
    { query: "array", locale: "fr" },
    { query: "array", limit: 0 },
    { query: "array", limit: 21 },
    { query: "array", limit: 1.5 },
  ])("rejects invalid search input %#", (input) => {
    expect(searchInputSchema.safeParse(input).success).toBe(false);
  });

  it("accepts publish input and preserves Markdown whitespace", () => {
    const content = "  indented Markdown\n";
    expect(
      publishInputSchema.parse({ title: " Post ", content_md: content }),
    ).toEqual({ title: "Post", content_md: content });
  });

  it.each([
    { content_md: "body" },
    { title: "", content_md: "body" },
    { title: "Post", content_md: "" },
    { title: "Post", content_md: "   " },
    { title: "Post", content_md: "body", tags: [""] },
    { title: "Post", content_md: "body", slug: "" },
  ])("rejects invalid publish input %#", (input) => {
    expect(publishInputSchema.safeParse(input).success).toBe(false);
  });

  it.each([
    { query: "q".repeat(201) },
    { title: "t".repeat(201), content_md: "body" },
    { title: "Post", content_md: "c".repeat(100_001) },
    { title: "Post", content_md: "body", description: "d".repeat(501) },
    {
      title: "Post",
      content_md: "body",
      tags: Array.from({ length: 11 }, () => "tag"),
    },
    { title: "Post", content_md: "body", tags: ["t".repeat(51)] },
    { title: "Post", content_md: "body", slug: "s".repeat(101) },
  ])("rejects input just over a length limit %#", (input) => {
    const schema = "query" in input ? searchInputSchema : publishInputSchema;
    expect(schema.safeParse(input).success).toBe(false);
  });
});
