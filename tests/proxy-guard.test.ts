/**
 * #370：非 ASCII 的未知 docs 路径必须在 edge 被 404 短路，否则会进
 * [...slug] lambda，Vercel 运行时把中文写进 x-next-cache-tags 响应头
 * 触发 500（vercel/next.js#92145，上游未修）。
 *
 * 同时守住 matcher 的两个不变量：
 *   - docs 带点路径必须能进 middleware（isPoisonedDocsPath 生效的前提，
 *     崩溃 URL 里恰好带 .jpg）
 *   - 非 docs 的 dot-path（静态资源）和 backend rewrite 路径仍被排除
 */
import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isPoisonedDocsPath } from "@/lib/poisoned-docs-path";

const ROOT = join(__dirname, "..");

/**
 * 从 proxy.ts 源码提取 matcher 字符串并按 Next 的锚定语义编译。
 * 源码文本里的 `\\` 在 JS 字符串字面量里是 `\`，先还原再建 RegExp。
 */
function matcherRegex(): RegExp {
  const content = readFileSync(join(ROOT, "proxy.ts"), "utf-8");
  const m = content.match(/matcher:\s*["'`]([^"'`]+)["'`]/);
  if (!m) throw new Error("无法定位 proxy.ts 的 matcher 字段");
  return new RegExp(`^${m[1].replace(/\\\\/g, "\\")}$`);
}

describe("isPoisonedDocsPath", () => {
  test.each<[string, boolean]>([
    // Sentry INVOLUTIONHELL-FRONTEND-4 的原始崩溃路径
    ['/zh/docs/learn/cs/dev-tips/你的图片.jpg "自定义鼠标悬停显示名"', true],
    // 畸形 percent-encoding：decodeURIComponent 会 throw，同样 404
    ["/docs/%e4%b8", true],
    // ASCII 垃圾路径归 page.tsx 的 resolve→404 流程管，不在这里拦
    ["/docs/learn/ai/multimodal/[object Object]", false],
    // 正常 docs 页
    ["/zh/docs/learn/ai/multimodal-overview", false],
    ["/en/docs/career/interview-prep/leetcode/46-quan-pai-lie", false],
    // 不越界到 docs 以外的路由
    ["/zh/u/中文名", false],
    ["/", false],
  ])("%s → %s", (path, expected) => {
    expect(isPoisonedDocsPath(path)).toBe(expected);
  });
});

describe("matcher：docs 带点路径进 middleware，其余排除规则不回归", () => {
  const re = matcherRegex();

  test.each([
    "/zh/docs/foo.jpg",
    "/docs/a/b.png",
    '/zh/docs/learn/cs/dev-tips/你的图片.jpg "自定义鼠标悬停显示名"',
    // leetcode 带点中文旧 URL：一直要能进 middleware 吃 slug-map 301
    "/docs/CommunityShare/Leetcode/46.全排列",
  ])("进 middleware: %s", (p) => {
    expect(re.test(p)).toBe(true);
  });

  test.each([
    "/mascot.png",
    "/sitemap.xml",
    // backend rewrite 路径（参考 PR #335 登录事故，另见 proxy-matcher.test.ts）
    "/oauth/render/github",
    "/api/admin/events",
  ])("仍被排除: %s", (p) => {
    expect(re.test(p)).toBe(false);
  });
});
