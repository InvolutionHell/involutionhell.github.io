import { NextResponse, type NextRequest } from "next/server";
import leetcodeSlugMap from "@/generated/leetcode-slug-map.json";

/**
 * Leetcode 旧 URL / 中文 slug 301 到拼音 slug 的新路径。
 *
 * 背景：
 *   lib/source.ts 的 transformer 把 career/interview-prep/leetcode/ 下含中文的文件名转成拼音 slug。
 *   但 GSC 旧索引里存着 /docs/CommunityShare/Leetcode/<中文原文件名> 的 URL，
 *   next.config.mjs 的 wildcard 只做前缀替换，没做 slug 拼音化，跳过去依然 404。
 *   在这里用构建时生成的 slug map 做 O(1) 查表，单跳 301 到正确拼音 URL。
 *
 * 覆盖的请求形态：
 *   1. /docs/CommunityShare/Leetcode/<中文 slug>            → 拼音新路径
 *   2. /docs/CommunityShare/Leetcode/<拼音或纯 ASCII slug>  → 新路径同 slug（兼容老收藏）
 *   3. /docs/career/interview-prep/leetcode/<中文 slug>      → 同目录拼音 slug（防止用户手抖）
 *
 * 为什么不走 next.config 的 redirects：
 *   path-to-regexp 对方括号 / 空格 / 中文的处理不稳，不如 middleware 字面匹配可靠。
 */
// 用 Map 而不是 plain object，杜绝 __proto__ / constructor 这类原型链 key 被当成命中
// 导致 redirect 目标异常（例如 mapped 返回 Object 构造函数）。
const SLUG_MAP = new Map<string, string>(
  Object.entries(leetcodeSlugMap as Record<string, string>),
);
const LEETCODE_NEW_BASE = "/docs/career/interview-prep/leetcode";
const LEETCODE_OLD_BASE = "/docs/CommunityShare/Leetcode";

function redirectLeetcodeIfNeeded(req: NextRequest): NextResponse | null {
  const { pathname } = req.nextUrl;

  let baseMatched: "old" | "new" | null = null;
  let rest = "";
  if (pathname.startsWith(LEETCODE_OLD_BASE + "/")) {
    baseMatched = "old";
    rest = pathname.slice(LEETCODE_OLD_BASE.length + 1);
  } else if (pathname.startsWith(LEETCODE_NEW_BASE + "/")) {
    baseMatched = "new";
    rest = pathname.slice(LEETCODE_NEW_BASE.length + 1);
  } else {
    return null;
  }

  if (!rest) return null;

  // Next.js pathname 已经 decode，但保险起见再 decode 一次，兼容爬虫可能发来的二次编码
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

  // 新路径 + 中文 slug / 旧路径任意 slug：301 到新路径 + 拼音（或原 ASCII）slug
  const url = req.nextUrl.clone();
  url.pathname = `${LEETCODE_NEW_BASE}/${targetSlug}`;
  return NextResponse.redirect(url, 301);
}

/**
 * IP geo 判断默认 locale，并写入 cookie 供 Server Component 读取。
 *
 * 优先级：
 *   1. 已有 locale cookie → 尊重用户选择，直接放行
 *   2. Vercel edge runtime 的 request.geo.country（免费，无需第三方服务）
 *   3. Accept-Language header 兜底
 *   4. 以上均无法判断 → 默认 zh（文档主体语言）
 *
 * cookie 有效期 1 年，用户在 /settings 页切换语言时会覆盖此 cookie。
 */
export function proxy(req: NextRequest) {
  // Leetcode 老 URL / 中文 slug 优先做 301，避免后续 locale 逻辑给 404 页种 cookie
  const leetcodeRedirect = redirectLeetcodeIfNeeded(req);
  if (leetcodeRedirect) return leetcodeRedirect;

  // 用户已选过语言，尊重选择不覆盖
  if (req.cookies.get("locale")) {
    return NextResponse.next();
  }

  const country =
    (req as NextRequest & { geo?: { country?: string } }).geo?.country ?? "";
  const acceptLang = req.headers.get("accept-language") ?? "";

  // 解析 Accept-Language header 按 q 值排序的优先级列表
  // 例如 "fr-CA,fr;q=0.9,en;q=0.8,zh;q=0.5" → [fr-CA, fr, en, zh]
  // 之前只 startsWith 判断会忽略 q 值较低但明确列出的语言。
  const preferred = acceptLang
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const q = qParam ? parseFloat(qParam.slice(2)) : 1;
      return { tag: tag.toLowerCase(), q: Number.isFinite(q) ? q : 0 };
    })
    .filter((item) => item.tag)
    .sort((a, b) => b.q - a.q);

  const firstMatch = preferred.find((item) =>
    /^(en|zh)(-|$)/.test(item.tag),
  )?.tag;

  // 默认中文；只有 Accept-Language 首选为英文且非中国 IP 才切 en
  const isExplicitlyEnglish =
    firstMatch?.startsWith("en") === true && country !== "CN";
  const locale = isExplicitlyEnglish ? "en" : "zh";

  const res = NextResponse.next();
  res.cookies.set("locale", locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });
  return res;
}

export const config = {
  // 只匹配文档页，不需要对 API 路由、静态文件等运行 geo 判断
  matcher: ["/docs/:path*"],
};
