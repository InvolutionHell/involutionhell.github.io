import { NextResponse } from "next/server";

interface TopDocDto {
  path: string;
  title: string;
  views: number;
}

/**
 * 首页 "本周最热" 数据的客户端代理 API。
 *
 * 与 /api/public/homepage-events 同一思路（i18n 改造收尾，2026-05）：
 *   原来的 HotDocsPreview server component 直接 await fetchTopDocs，server
 *   fetch 让 Hero 段所在的整个首页 RSC tree 变 ƒ Dynamic。改为 client fetch
 *   走自家代理：
 *   - 浏览器调 /api/public/top-docs（同源，无 CORS）
 *   - 路由 server-side 调后端 /analytics/top-docs（BACKEND_URL 不暴露）
 *   - revalidate=300 让 Next.js Data Cache 命中，最多每 5min 一次后端调用
 *   - 浏览器侧 cache-control 5min 复用响应
 *
 * 后端拒服务时静默返回空数组，HotDocsPreview 显示"empty"。
 */
export const revalidate = 300;

export async function GET() {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    return NextResponse.json([], {
      headers: { "cache-control": "public, max-age=300, s-maxage=300" },
    });
  }

  try {
    const res = await fetch(
      `${backendUrl}/analytics/top-docs?window=7d&limit=5`,
      {
        next: { revalidate: 300 },
        // UA 带 InvolutionHell-SSR token，让 Cloudflare Bot Fight Mode 放行
        // （CF Custom Rule 用这个 token 识别"自己人"）。
        headers: {
          accept: "application/json",
          "user-agent": "InvolutionHell-SSR/1.0 (+https://involutionhell.com)",
        },
      },
    );
    if (!res.ok) {
      return NextResponse.json([], {
        headers: { "cache-control": "public, max-age=60" },
      });
    }
    const json = await res.json();
    const data: TopDocDto[] = Array.isArray(json?.data) ? json.data : [];
    return NextResponse.json(data, {
      headers: { "cache-control": "public, max-age=300, s-maxage=300" },
    });
  } catch {
    return NextResponse.json([], {
      headers: { "cache-control": "public, max-age=60" },
    });
  }
}
