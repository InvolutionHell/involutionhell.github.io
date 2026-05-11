/**
 * ensureSeoDescription 单元测试。
 *
 * 背景：Bing Webmaster 报 118 个页面 meta description 太短。引入 lib/seo-description.ts
 * 做代码层兜底。这里覆盖 4 类关键 case：缺失 / 空 / 极短 / 合格保留原样。
 *
 * 注意：MIN_SEO_DESCRIPTION_LENGTH = 80，超过这个长度的输入会原样返回。
 */
import { describe, expect, test } from "vitest";
import {
  ensureSeoDescription,
  MIN_SEO_DESCRIPTION_LENGTH,
} from "../lib/seo-description";

describe("ensureSeoDescription", () => {
  test("description 缺失时拼接 title + 分区 + tagline", () => {
    const out = ensureSeoDescription({
      title: "2335. Minimum Time to Fill Cups",
      sectionPath: ["career", "interview-prep", "leetcode"],
      locale: "zh",
    });
    expect(out.length).toBeGreaterThanOrEqual(MIN_SEO_DESCRIPTION_LENGTH);
    expect(out).toContain("2335. Minimum Time to Fill Cups");
    expect(out).toContain("career › interview-prep › leetcode");
    expect(out).toContain("Involution Hell");
  });

  test("description 为空字符串走兜底", () => {
    const out = ensureSeoDescription({
      description: "",
      title: "AI 小镇",
      sectionPath: ["projects"],
      locale: "zh",
    });
    expect(out.length).toBeGreaterThanOrEqual(MIN_SEO_DESCRIPTION_LENGTH);
    expect(out).toContain("AI 小镇");
  });

  test("极短 description 保留并追加兜底", () => {
    const out = ensureSeoDescription({
      description: "复读机或可提高大模型能力",
      title: "Prompt Repetition Paper",
      sectionPath: ["community", "papers"],
      locale: "zh",
    });
    expect(out.length).toBeGreaterThanOrEqual(MIN_SEO_DESCRIPTION_LENGTH);
    expect(out).toContain("复读机或可提高大模型能力");
    expect(out).toContain("Prompt Repetition Paper");
  });

  test("合格长度 description 原样返回（信任作者）", () => {
    const author =
      "构建轻量化的多模态理解与生成系统，实现从视觉感知到语言表达的闭环，并引入强化学习与答案可视化生成。" +
      "覆盖视觉编码、跨模态对齐训练、端到端策略评估与可解释性分析全流程。"; // > 80 chars
    expect(author.length).toBeGreaterThanOrEqual(MIN_SEO_DESCRIPTION_LENGTH);
    const out = ensureSeoDescription({
      description: author,
      title: "Multimodal RL",
      locale: "zh",
    });
    expect(out).toBe(author);
  });

  test("locale=en 用英文 tagline", () => {
    const out = ensureSeoDescription({
      description: "",
      title: "76. Minimum Window Substring",
      sectionPath: ["career", "interview-prep", "leetcode"],
      locale: "en",
    });
    expect(out).toContain("Topic: 76. Minimum Window Substring.");
    expect(out).toContain("Section: career › interview-prep › leetcode.");
    expect(out.toLowerCase()).toContain("open-source community");
    // 不能漏到中文 tagline
    expect(out).not.toContain("社区文档");
  });

  test("locale 缺省视为中文", () => {
    const out = ensureSeoDescription({
      description: "短",
      title: "Test",
    });
    expect(out).toContain("社区文档");
  });

  test("sectionPath 含 URL-encoded 中文目录会被 decode 还原", () => {
    const out = ensureSeoDescription({
      description: "",
      title: "测试页",
      sectionPath: ["career", encodeURIComponent("面试准备")],
      locale: "zh",
    });
    expect(out).toContain("career › 面试准备");
  });

  test("sectionPath 含非法 URL 序列时退回原值不抛异常", () => {
    expect(() =>
      ensureSeoDescription({
        description: "",
        title: "Test",
        sectionPath: ["career", "%E4%B8"], // 截断的 UTF-8
        locale: "zh",
      }),
    ).not.toThrow();
  });

  test("null/undefined description 不抛异常", () => {
    expect(() =>
      ensureSeoDescription({ description: null, title: "X" }),
    ).not.toThrow();
    expect(() =>
      ensureSeoDescription({ description: undefined, title: "X" }),
    ).not.toThrow();
  });

  test("作者写了短 description 末尾会补标点防黏连", () => {
    const out = ensureSeoDescription({
      description: "短描述",
      title: "Test",
      locale: "zh",
    });
    // 应该包含 "短描述。" 不是 "短描述主题"
    expect(out).toContain("短描述。");
  });

  test("作者已带句号则不重复补", () => {
    const out = ensureSeoDescription({
      description: "短描述。",
      title: "Test",
      locale: "zh",
    });
    expect(out).not.toContain("短描述。。");
  });
});
