import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/source", () => ({ source: { getPages: () => [] } }));

import { isEnglishPage } from "@/lib/search-index";

describe("search index locale classification", () => {
  it("classifies English source filenames even without lang frontmatter", () => {
    expect(
      isEnglishPage({
        path: "learn/cs/data-structures/array/index.en.mdx",
        data: {},
      }),
    ).toBe(true);
    expect(isEnglishPage({ path: "career/example.en.md", data: {} })).toBe(
      true,
    );
    expect(isEnglishPage({ path: "career/example.md", data: {} })).toBe(false);
  });

  it("retains explicit lang frontmatter classification", () => {
    expect(
      isEnglishPage({ path: "career/legacy.mdx", data: { lang: "en" } }),
    ).toBe(true);
  });
});
