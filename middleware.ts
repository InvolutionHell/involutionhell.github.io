import { NextResponse, type NextRequest } from "next/server";

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
export function middleware(req: NextRequest) {
  // 用户已选过语言，尊重选择不覆盖
  if (req.cookies.get("locale")) {
    return NextResponse.next();
  }

  const country =
    (req as NextRequest & { geo?: { country?: string } }).geo?.country ?? "";
  const acceptLang = req.headers.get("accept-language") ?? "";

  // 默认中文；只有明确英文 Accept-Language 且非中国 IP 才切 en
  const isExplicitlyEnglish =
    !acceptLang.toLowerCase().startsWith("zh") &&
    acceptLang.toLowerCase().startsWith("en") &&
    country !== "CN";
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
