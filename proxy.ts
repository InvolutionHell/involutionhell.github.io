import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import leetcodeSlugMap from "@/generated/leetcode-slug-map.json";
import { routing } from "@/i18n/routing";

/**
 * Edge proxy（Next.js 16 旧称 middleware）。
 *
 * 职责：
 *   1. Leetcode 老 URL / 中文 slug 优先做 301 到拼音 slug（必须排在 i18n
 *      逻辑前，否则会先被 next-intl 加 locale 前缀，破坏 SLUG_MAP 命中）
 *   2. 其它请求交给 next-intl 中间件处理 locale 检测 + URL prefix
 *
 * i18n 改造（2026-05）变化：
 *   - 旧版自己写 IP geo + Accept-Language + cookie 写入逻辑
 *   - next-intl 的 createMiddleware 已经原生支持 Accept-Language 协商 +
 *     NEXT_LOCALE cookie 持久化，不需要重复造轮子，所以删掉旧逻辑
 *   - URL 段化后，匹配规则 matcher 也得放宽到全站（不限于 /docs/:path*）
 */

const SLUG_MAP = new Map<string, string>(
  Object.entries(leetcodeSlugMap as Record<string, string>),
);

// 既要兼容老的不带 locale 前缀的 URL（/docs/...），也要兼容已经带 locale 的
// （/zh/docs/... 或 /en/docs/...）。
const LEETCODE_PATH_TAIL = "/docs/career/interview-prep/leetcode";
const LEETCODE_OLD_PATH_TAIL = "/docs/CommunityShare/Leetcode";

const intlMiddleware = createMiddleware(routing);

// Bot / vulnerability scanner path patterns —— 在 edge 早返 404，不让进 Fluid。
// 维护约束：
//   1. 只放 100% 业务用不到的指纹（不要加 admin / login，业务有真路由）
//   2. **不要放含 `.` 的路径**：下面 matcher 用 `.*\\..*` 排除所有 dot-path，
//      middleware 根本不会被调起。带点的 scanner（.env / .php / .git/ / .war
//      等）会直接走到 Next 默认 404 → 命中我们的 ○ Static `/_not-found`，
//      已经是 CDN-served，不烧 Fluid。重复在这里写 dot-path 是死代码。
const BOT_PATH_PATTERNS = [
  // wp-* 系列：WordPress 扫描
  /\/wp-(admin|content|includes|login|json|config)(?:$|[/?#])/i,
  // GraphQL / GQL endpoint 扫描（本站没 GraphQL）
  /\/(graphql|gql|api\/graphql|v\d+\/graphql)(?:$|[/?#])/i,
  // Werkzeug / Flask debug console
  /\/werkzeug\/console/i,
  // 常见 admin / debug panels 探测路径（本站 admin 在 /[locale]/admin，
  // 这些是其他平台特有路径，扫到必是 bot）
  /\/(phpmyadmin|adminer|pma|dbadmin|mysqladmin)(?:$|[/?#])/i,
];

function isBotScanPath(pathname: string): boolean {
  for (const re of BOT_PATH_PATTERNS) {
    if (re.test(pathname)) return true;
  }
  return false;
}

function redirectLeetcodeIfNeeded(req: NextRequest): NextResponse | null {
  const { pathname } = req.nextUrl;

  // 同时识别带 locale 段（/:locale/docs/...）和不带的（/docs/...）
  const localePrefixMatch = pathname.match(/^\/(zh|en)(\/.*)$/);
  const stripped = localePrefixMatch ? localePrefixMatch[2] : pathname;
  const localePrefix = localePrefixMatch ? `/${localePrefixMatch[1]}` : "";

  let baseMatched: "old" | "new" | null = null;
  let rest = "";
  if (stripped.startsWith(LEETCODE_OLD_PATH_TAIL + "/")) {
    baseMatched = "old";
    rest = stripped.slice(LEETCODE_OLD_PATH_TAIL.length + 1);
  } else if (stripped.startsWith(LEETCODE_PATH_TAIL + "/")) {
    baseMatched = "new";
    rest = stripped.slice(LEETCODE_PATH_TAIL.length + 1);
  } else {
    return null;
  }

  if (!rest) return null;

  // pathname 已 decode，再 decode 一次防爬虫二次编码
  let rawSlug: string;
  try {
    rawSlug = decodeURIComponent(rest);
  } catch {
    rawSlug = rest;
  }

  const mapped = SLUG_MAP.get(rawSlug);
  const targetSlug = mapped ?? rawSlug;

  // 新路径 + ASCII slug 命中原样：放行，不绕圈
  if (baseMatched === "new" && !mapped) return null;

  // 否则 301 到（带 locale 前缀的）拼音 URL
  const url = req.nextUrl.clone();
  url.pathname = `${localePrefix}${LEETCODE_PATH_TAIL}/${targetSlug}`;
  return NextResponse.redirect(url, 301);
}

export function proxy(req: NextRequest) {
  // Scanner 路径 0 函数调用直接 404，no-store 避免攻击者拿 200 当命中信号。
  if (isBotScanPath(req.nextUrl.pathname)) {
    return new NextResponse(null, {
      status: 404,
      headers: { "cache-control": "no-store" },
    });
  }

  // 1. Leetcode 中文 slug 优先做 301
  const leetcodeRedirect = redirectLeetcodeIfNeeded(req);
  if (leetcodeRedirect) return leetcodeRedirect;

  // 2. 其它请求交给 next-intl 处理 locale routing
  return intlMiddleware(req);
}

export const config = {
  // Match all pathnames except for
  // - api / trpc：API 路由不进 i18n（无 UI，纯 fetch）
  // - auth / oauth / analytics：next.config rewrites 直通后端的路径
  //   （登录 / OAuth / 埋点）。被 next-intl 加了 locale 前缀后，
  //   rewrite source（/oauth/:path*）不匹配带 locale 的版本（/en/oauth/...），
  //   落到 [locale]/oauth/... 404。所以必须排除掉，让请求直接走 rewrite。
  // - _next / _vercel：Next.js 内部
  // - .*\..*：任何带 . 的路径（静态资源 / sitemap.xml / robots.txt 等）
  matcher: "/((?!api|trpc|auth|oauth|analytics|_next|_vercel|.*\\..*).*)",
};
