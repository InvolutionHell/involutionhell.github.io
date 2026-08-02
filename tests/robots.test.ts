import { describe, expect, it } from "vitest";

import robots from "@/app/robots";

/**
 * 这组测试守的是一条策略不变量，不是实现细节：
 * 训练型爬虫要被整站挡掉，引用型爬虫必须留在 `*` 组里被放行。
 * 两边错任何一边都不会有任何报错 —— 要么内容白送进训练集，
 * 要么再也拿不到 AI 引用，只能靠测试拦。
 */
describe("robots", () => {
  const result = robots();
  const rules = Array.isArray(result.rules) ? result.rules : [result.rules!];
  const wildcard = rules.find((r) => r.userAgent === "*")!;
  const blocked = rules.filter((r) => r !== wildcard);
  const blockedAgents = blocked.flatMap((r) =>
    Array.isArray(r.userAgent) ? r.userAgent : [r.userAgent!],
  );

  it("`*` 放行全站，但挡住登录态和接口路径", () => {
    expect(wildcard.allow).toBe("/");
    expect(wildcard.disallow).toContain("/api/");
    expect(wildcard.disallow).toContain("/*/admin/");
    expect(wildcard.disallow).toContain("/*/editor/");
  });

  // 列全当前策略里的每一个训练型 UA：少列几个的话，从 app/robots.ts 删掉
  // 没列到的那些测试照样绿，等于白守。新增不用同步（放宽是安全方向）。
  it("训练型爬虫整站 disallow", () => {
    for (const ua of [
      "GPTBot",
      "ClaudeBot",
      "anthropic-ai",
      "Google-Extended",
      "Applebot-Extended",
      "meta-externalagent",
      "FacebookBot",
      "Bytespider",
      "Amazonbot",
      "CCBot",
      "Omgilibot",
      "DataForSeoBot",
    ]) {
      expect(blockedAgents).toContain(ua);
    }
    for (const rule of blocked) {
      expect(rule.disallow).toBe("/");
    }
  });

  it("引用型爬虫不在屏蔽名单里 —— 挡了就等于放弃 AI 引用", () => {
    for (const ua of [
      "OAI-SearchBot",
      "ChatGPT-User",
      "Claude-User",
      "PerplexityBot",
    ]) {
      expect(blockedAgents).not.toContain(ua);
    }
  });

  it("屏蔽组不能开 allow —— UA 专属组整体覆盖 `*`，写 allow 会把整站放回去", () => {
    for (const rule of blocked) {
      expect(rule.allow).toBeUndefined();
    }
  });

  it("带上 sitemap", () => {
    expect(result.sitemap).toMatch(/\/sitemap\.xml$/);
  });
});
