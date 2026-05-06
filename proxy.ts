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
  // 1. Leetcode 中文 slug 优先做 301
  const leetcodeRedirect = redirectLeetcodeIfNeeded(req);
  if (leetcodeRedirect) return leetcodeRedirect;

  // 2. 其它请求交给 next-intl 处理 locale routing
  return intlMiddleware(req);
}

export const config = {
  // Match all pathnames except for
  // - api / trpc：API 路由不进 i18n（无 UI，纯 fetch）
  // - _next / _vercel：Next.js 内部
  // - .*\..*：任何带 . 的路径（静态资源 / sitemap.xml / robots.txt 等）
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
