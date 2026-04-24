// lib/site-url.ts

/**
 * @file lib/site-url.ts
 * @description
 * 站点根 URL 的 single source of truth。
 *
 * 之前 `app/sitemap.ts` 和 `app/robots.ts` 各自维护了一份 `normalizeSiteUrl` +
 * `RAW_SITE_URL` / `SITE_URL` 逻辑，完全同形。抽到这里避免两边独立 drift —— 任何
 * 调整（比如以后加 trailing-slash 归一、加端口清洗、换 env 名）只改这一个地方。
 *
 * 注意：保留与原实现完全一致的语义，只换引用来源，不变值。sitemap.ts 的单元不变性
 * 依赖这一点。
 */

/**
 * 原始 env 值，fallback 到生产域名。
 * 不直接 export —— 消费方只应该拿规范化后的 SITE_URL。
 */
const RAW_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://involutionhell.com";

/**
 * 规范化站点 URL：
 * 1. 没协议头的补 `https://`
 * 2. 去掉任意数量的尾部斜杠
 *
 * 例：
 *   "example.com"           → "https://example.com"
 *   "https://example.com/"  → "https://example.com"
 *   "https://example.com//" → "https://example.com"
 */
export function normalizeSiteUrl(url: string): string {
  const withProto = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  return withProto.replace(/\/+$/, "");
}

/**
 * 模块加载时计算一次，给 robots / sitemap / 其它需要站点根的地方直接 import 用。
 */
export const SITE_URL = normalizeSiteUrl(RAW_SITE_URL);
