import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import leetcodeSlugMap from "@/generated/leetcode-slug-map.json";
import { routing } from "@/i18n/routing";
import { isPoisonedDocsPath } from "@/lib/poisoned-docs-path";

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

// generated/leetcode-slug-map.json：
//   byName   中文文件名（decode 后）→ 完整 canonical 路径（含无英文兄弟时的 zh 拼音页）
//   byNumber 题号 → 英文页，兜住「中文文件已改名成英文、旧中文 URL 在 GSC 还活着」
const slugMap = leetcodeSlugMap as {
  byName: Record<string, string>;
  byNumber: Record<string, string>;
};
const SLUG_BY_NAME = new Map<string, string>(Object.entries(slugMap.byName));
const SLUG_BY_NUMBER = new Map<string, string>(
  Object.entries(slugMap.byNumber),
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
  // Tomcat/Spring/Java/Nacos 常见框架扫描与探测路径（无点路径）
  /\/(actuator|druid|nacos|tomcat|manager\/html|web-inf|solr|invoker)(?:$|[/?#])/i,
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

  // value 是完整 canonical 路径（含 locale 前缀）。先按文件名精确查（覆盖只有 zh
  // 拼音页的情况），命不中再按题号查（兜住已改名成英文、旧中文 URL 仍存活的题）。
  //
  // 题号兜底只对“含中文的 slug”生效：canonical 英文 slug（46-permutations）和
  // 合法的拼音页都是纯 ASCII，若也按题号重定向会把英文页指向自己造成 301 死循环、
  // 或把合法 /zh 英文命名页强行打到 /en。中文旧 URL 才需要这层兜底。
  const numMatch = rawSlug.match(/(\d+)/);
  const hasNonAscii = /[^ -~]/.test(rawSlug);
  const mapped =
    SLUG_BY_NAME.get(rawSlug) ??
    (hasNonAscii && numMatch ? SLUG_BY_NUMBER.get(numMatch[1]) : undefined);
  if (mapped) {
    const url = req.nextUrl.clone();
    url.pathname = mapped;
    url.search = "";
    return NextResponse.redirect(url, 301);
  }

  // 未映射 = 英文 / ASCII slug，真实 slug == rawSlug：
  // 新前缀已经正确，放行不绕圈；老前缀只换前缀（默认 zh，_translated 等都是 zh 文件）。
  if (baseMatched === "new") return null;
  const url = req.nextUrl.clone();
  url.pathname = `${localePrefix || `/${routing.defaultLocale}`}${LEETCODE_PATH_TAIL}/${rawSlug}`;
  return NextResponse.redirect(url, 301);
}

// 裸 404，no-store 避免攻击者拿 200 当命中信号、也避免 CDN 缓存垃圾响应。
function bare404(): NextResponse {
  return new NextResponse(null, {
    status: 404,
    headers: { "cache-control": "no-store" },
  });
}

export function proxy(req: NextRequest) {
  // Scanner 路径 0 函数调用直接 404。
  if (isBotScanPath(req.nextUrl.pathname)) {
    return bare404();
  }

  // 1. Leetcode 中文 slug 优先做 301（必须在 poisoned 检查之前，
  //    否则合法的中文旧 URL 会被 404 而不是重定向到拼音页）
  const leetcodeRedirect = redirectLeetcodeIfNeeded(req);
  if (leetcodeRedirect) return leetcodeRedirect;

  // 2. 未命中 slug-map 的非 ASCII docs 路径：edge 404，不进 Fluid
  if (isPoisonedDocsPath(req.nextUrl.pathname)) {
    return bare404();
  }

  // 3. 其它请求交给 next-intl 处理 locale routing
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
  // - (?!.*[Ll]eetcode|(?:zh/|en/)?docs/).*\..*：带 . 的路径（静态资源 /
  //   sitemap.xml 等）一律排除，两个例外：
  //   1. leetcode——GSC 旧 URL 里有大量带点的中文题名（"46.全排列"、
  //      "1234. 替换…"），不放进来就触不到上面的 slug-map 301，只能硬 404。
  //      leetcode 目录下不存在带点的静态资源，开这个口子安全。
  //   2. docs——爬虫会构造带点又带中文的垃圾 docs 路径（如 ".../你的图片.jpg
  //      \"悬停名\""），必须进 middleware 让 isPoisonedDocsPath 拦下，否则
  //      直达 [...slug] lambda 触发 x-next-cache-tags 500。
  //      /docs/ URL 下没有真实静态资源（public/ 无 docs 子目录），同样安全。
  matcher:
    "/((?!api|trpc|auth|oauth|analytics|_next|_vercel|(?!.*[Ll]eetcode|(?:zh/|en/)?docs/).*\\..*).*)",
};
