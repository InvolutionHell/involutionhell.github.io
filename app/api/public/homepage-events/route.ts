import { NextResponse } from "next/server";
import { fetchHomepageEvents } from "@/lib/events-fetch";

/**
 * 首页活动数据的客户端代理 API。
 *
 * 为什么需要这个端点（i18n 改造收尾，2026-05）：
 *   首页 page.tsx 之前用 server component await fetchHomepageEvents()，把
 *   首页钉成 ƒ Dynamic（任何 server fetch 都阻挡 SSG）。改造让 FloatWindow /
 *   ActivityTicker 改 client component 自己 fetch，但他们直接打后端会涉及
 *   CORS + NEXT_PUBLIC_BACKEND_URL 暴露。走自家 API 中转更干净：
 *   - 浏览器调 /api/public/homepage-events（同源，无 CORS）
 *   - 路由 server-side 调后端 /api/events（BACKEND_URL 不暴露）
 *   - revalidate: 300 让 Next.js Data Cache 命中 5 分钟内的请求，最多
 *     每 5min 一次 server fetch，Vercel CPU 几乎为零
 *
 * 即使首页 SSG，每个浏览器加载会发一次这条请求，但因为 fetch cache + ISR
 * 命中（HTTP 304），Vercel Function 大部分时候不会冷启动。
 */

// ISR：5 分钟缓存（与 lib/events-fetch.ts 内部 revalidate 对齐）
export const revalidate = 300;

export async function GET() {
  const events = await fetchHomepageEvents();
  return NextResponse.json(events, {
    headers: {
      // 浏览器侧也缓存 5 分钟，刷新页面期间不再打 origin
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });
}
