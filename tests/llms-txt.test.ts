import { describe, expect, it } from "vitest";

import { docPathname, isDraftOrHidden } from "@/lib/doc-entry";
import { buildLlmsTxt, type LlmsTxtEntry } from "@/lib/llms-txt";

const SITE = "https://involutionhell.com";

function entry(overrides: Partial<LlmsTxtEntry> = {}): LlmsTxtEntry {
  return {
    pathname: "/zh/docs/career/foo",
    title: "Foo",
    description: "关于 Foo 的说明",
    section: "中文 · career",
    ...overrides,
  };
}

describe("buildLlmsTxt", () => {
  it("按 section 分组，顺序跟首次出现一致", () => {
    const out = buildLlmsTxt(
      [
        entry({ section: "中文 · career", title: "A" }),
        entry({ section: "English · learn", title: "B" }),
        entry({ section: "中文 · career", title: "C" }),
      ],
      SITE,
    );
    expect(out.indexOf("## 中文 · career")).toBeLessThan(
      out.indexOf("## English · learn"),
    );
    // C 要回到第一组里，而不是自己另起一组
    const careerBlock = out.slice(
      out.indexOf("## 中文 · career"),
      out.indexOf("## English · learn"),
    );
    expect(careerBlock).toContain("[A]");
    expect(careerBlock).toContain("[C]");
    expect(out.match(/## 中文 · career/g)).toHaveLength(1);
  });

  it("链接是带域名的绝对地址 —— 抓取方不一定知道自己从哪个域拿的文件", () => {
    const out = buildLlmsTxt([entry({ pathname: "/zh/docs/x" })], SITE);
    expect(out).toContain(`(${SITE}/zh/docs/x)`);
  });

  it("头部声明 CC BY-NC-SA，向引用方讲清署名要求", () => {
    const out = buildLlmsTxt([entry()], SITE);
    expect(out).toContain("CC BY-NC-SA");
  });

  it("没有 description 时不留空冒号", () => {
    const out = buildLlmsTxt([entry({ description: undefined })], SITE);
    expect(out).toContain(
      "- [Foo](https://involutionhell.com/zh/docs/career/foo)\n",
    );
    expect(out).not.toContain("foo): \n");
  });

  it("超长描述截断，不让个别条目撑肥整份索引", () => {
    const out = buildLlmsTxt([entry({ description: "长".repeat(500) })], SITE);
    const line = out.split("\n").find((l) => l.startsWith("- [Foo]"))!;
    expect(line).toContain("…");
    expect(line.length).toBeLessThan(400);
  });

  it("标题里的方括号会破坏 markdown 链接，必须去掉", () => {
    const out = buildLlmsTxt(
      [entry({ title: "LeetCode [142] 环形链表" })],
      SITE,
    );
    expect(out).toContain("- [LeetCode 142 环形链表](");
  });

  it("描述里的换行折成空格，一条目一行", () => {
    const out = buildLlmsTxt(
      [entry({ description: "第一行\n\n第二行" })],
      SITE,
    );
    expect(out).toContain(": 第一行 第二行");
  });
});

describe("docPathname", () => {
  it("中文 slug 逐段编码", () => {
    expect(docPathname(["career", "142.环形链表II"])).toBe(
      "/docs/career/142.%E7%8E%AF%E5%BD%A2%E9%93%BE%E8%A1%A8II",
    );
  });

  it("斜杠不会被编码掉（分段拼接而不是整串编码）", () => {
    expect(docPathname(["a", "b", "c"])).toBe("/docs/a/b/c");
  });

  it("根文档落到 /docs", () => {
    expect(docPathname([])).toBe("/docs");
    expect(docPathname([""])).toBe("/docs");
  });
});

describe("isDraftOrHidden", () => {
  it("打平的字段和 frontmatter 里的都算数", () => {
    expect(isDraftOrHidden({ data: { draft: true } })).toBe(true);
    expect(isDraftOrHidden({ data: { hidden: true } })).toBe(true);
    expect(isDraftOrHidden({ data: { frontmatter: { draft: true } } })).toBe(
      true,
    );
    expect(isDraftOrHidden({ data: { frontmatter: { hidden: true } } })).toBe(
      true,
    );
  });

  it("正常文档和空 data 都放行", () => {
    expect(isDraftOrHidden({ data: { title: "x" } })).toBe(false);
    expect(isDraftOrHidden({})).toBe(false);
  });
});
