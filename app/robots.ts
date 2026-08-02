// app/robots.ts

/**
 * @file app/robots.ts
 * @description
 * 站点 robots.txt 生成器（Next.js App Router 约定文件）。
 *
 * i18n URL 段化改造（2026-05）后：admin / editor / settings / login 都搬进
 * 了 /[locale]/ 段，disallow 规则改用 wildcard /:locale/xxx/ 匹配两种语言。
 * Google / Bing 都支持 * wildcard（事实标准，不在 RFC 里）。
 *
 * 屏蔽：
 * - /:locale/admin/    后台管理页，登录态专属
 * - /:locale/editor/   编辑器页，登录态专属
 * - /:locale/settings/ 用户设置，登录态专属
 * - /:locale/login     登录页，入索引反而诱导钓鱼
 * - /api/              所有服务端接口，不是给爬虫看的（不在 [locale] 下）
 *
 * sitemap 指向 app/sitemap.ts 产出的 /sitemap.xml，hostname 复用同一份
 * NEXT_PUBLIC_SITE_URL。
 *
 * AI 爬虫按用途分：引用型（实时取用并附出处链接）放行，训练型（收进语料、
 * 不给回链）整站 disallow —— 内容是 CC BY-NC-SA。
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/robots
 */

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

/**
 * 登录态 / 接口路径，任何爬虫都不该进。
 * `*` 组和下面每个 UA 专属组都要带上（专属组覆盖 `*`，不继承）。
 */
const PRIVATE_PATHS = [
  "/*/admin/",
  "/*/editor/",
  "/*/settings/",
  "/*/login",
  "/api/",
  // posts 详情页元数据已设 noindex，robots.txt 双重保险
  "/*/u/*/posts/",
];

/**
 * 训练语料型爬虫，整站 disallow。
 *
 * 刻意不含 OAI-SearchBot / ChatGPT-User / Claude-User / PerplexityBot：
 * 它们靠 `*` 组放行就够了。**不要**为它们再开一个 Allow 组 —— robots.txt 里
 * UA 专属组整体覆盖 `*` 而不是叠加，开了就得把 PRIVATE_PATHS 再抄一遍，
 * 抄漏一条等于把后台放给它们。
 */
const AI_TRAINING_CRAWLERS = [
  "GPTBot", // OpenAI 训练语料
  "ClaudeBot", // Anthropic 爬虫
  "anthropic-ai", // Anthropic 旧 UA
  "Google-Extended", // Gemini 训练 / grounding
  "Applebot-Extended", // Apple 智能训练
  "meta-externalagent", // Meta AI 训练
  "FacebookBot", // Meta 语料采集
  "Bytespider", // 字节
  "Amazonbot",
  "CCBot", // Common Crawl，多数开源模型语料的上游
  "Omgilibot",
  "DataForSeoBot", // SEO 数据转售
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: AI_TRAINING_CRAWLERS,
        disallow: "/",
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
