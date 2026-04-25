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
 * 策略（实事求是版）：
 * 1. `NEXT_PUBLIC_SITE_URL` 显式设置 → 用它（保留 override 能力，几乎没人会用）。
 * 2. Vercel preview / branch deploy → `VERCEL_URL`（系统注入，每个 preview 一个临时域名）。
 * 3. 本地 dev / test → `http://localhost:3000`（项目里 OAuth 回调、rewrites 都按这个约定）。
 * 4. 其它（含 prod）→ 硬编码常量 `https://involutionhell.com`。
 *
 * 为什么 prod 不要求 env：这台站 prod 域名永远是 involutionhell.com，是事实而非配置；
 * `docs/architecture/frontend-backend-separation.md:96-103` 反对的是 "BACKEND_URL ?? localhost"
 * 那种把内部接口悄悄改路线的兜底，公开站点根 URL 当代码常量更安全（漏配也不会指错地址）。
 */

/** 生产域名常量。Prod 域永远是它，不靠 env。 */
const PROD_SITE_URL = "https://involutionhell.com";

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
 * 模块加载时调用一次，结果赋给 SITE_URL。优先级见文件头 docstring。
 */
function resolveSiteUrl(): string {
  // 1. 显式 env override（罕用；保留口子方便临时调试 / staging 自定义域名）。
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (raw && raw.trim().length > 0) {
    return normalizeSiteUrl(raw);
  }

  // 2. Vercel preview / branch deploy：用系统注入的 VERCEL_URL。
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
    return normalizeSiteUrl(process.env.VERCEL_URL);
  }

  // 3. 本地 dev / test。
  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  // 4. Prod (含 Vercel production deploy)：硬编码常量。
  return PROD_SITE_URL;
}

/**
 * 模块加载时计算一次，给 robots / sitemap / 其它需要站点根的地方直接 import 用。
 */
export const SITE_URL = resolveSiteUrl();
