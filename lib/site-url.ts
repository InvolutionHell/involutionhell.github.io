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
 * 关于 fallback（2026 年 Round 4 改）：原实现用 `?? "https://involutionhell.com"`
 * 做生产兜底，违反 `docs/architecture/frontend-backend-separation.md:96-103` 的
 * "生产环境不做硬编码 fallback" 约定 —— 在 preview/staging 漏配 env 时会静默产出
 * 指向 prod 域的 sitemap/robots，典型的"漏配变静默错地址"失败模式。
 *
 * 新策略：
 * - 生产 (NODE_ENV === "production")：env 缺失 → 模块加载时抛错，构建/启动失败。
 * - 开发/测试：env 缺失 → fallback 到 http://localhost:3000（与 next start 默认端口
 *   和项目里 OAuth 回调、rewrites 的 localhost:3000 约定一致），保留本地联调无门槛。
 */

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
 * 解析并校验 NEXT_PUBLIC_SITE_URL。抽成函数纯粹为了把 "prod 必须有 / dev 可 fallback"
 * 逻辑集中在一处。模块加载时调用一次，结果赋给 SITE_URL。
 */
function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (raw && raw.trim().length > 0) {
    return normalizeSiteUrl(raw);
  }

  if (process.env.NODE_ENV === "production") {
    // 故意抛错：漏配 env 时构建/启动直接失败，比静默产出指向错误域名的 sitemap 安全。
    throw new Error(
      "[lib/site-url] NEXT_PUBLIC_SITE_URL is required in production " +
        "(see docs/architecture/frontend-backend-separation.md:96-103).",
    );
  }

  // dev / test：沿用项目里 localhost:3000 的约定（next start 默认端口、OAuth 回调、rewrites 都是 3000）。
  return "http://localhost:3000";
}

/**
 * 模块加载时计算一次，给 robots / sitemap / 其它需要站点根的地方直接 import 用。
 */
export const SITE_URL = resolveSiteUrl();
