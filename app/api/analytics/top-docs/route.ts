import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { source } from "@/lib/source";

export const revalidate = 300;

/** 将 NaN/非正数的 limit 回退到默认值，同时加上限保护 */
function parseLimit(raw: string | null, fallback = 5, max = 20): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.floor(n), max);
}

/**
 * 从 path 尝试解析为文档标题：/docs/ai/rl → 查 fumadocs source
 * 查不到时回退为 path 最后一段。
 */
function resolveTitle(path: string): string {
  // /docs/ai/rl → ["ai", "rl"]
  const slug = path
    .replace(/^\/docs\/?/, "")
    .split("/")
    .filter(Boolean);
  if (slug.length === 0) return path;
  const page = source.getPage(slug);
  if (page?.data?.title) return page.data.title as string;
  return slug[slug.length - 1];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const window = searchParams.get("window") ?? "7d";
  const limit = parseLimit(searchParams.get("limit"));

  const since = new Date();
  if (window === "7d") {
    since.setDate(since.getDate() - 7);
  } else if (window === "30d") {
    since.setDate(since.getDate() - 30);
  } else {
    since.setFullYear(since.getFullYear() - 10);
  }

  // Prisma 对 JSON 字段的 startsWith 过滤不能直接嵌套写在 where，
  // 这里先按 eventType + createdAt 过滤，再在内存里按 path 前缀筛
  const rows = await prisma.analyticsEvent.findMany({
    where: {
      eventType: "page_view",
      createdAt: { gte: since },
    },
    select: { eventData: true },
  });

  // 统计各路径 PV（内存过滤 /docs/ 前缀）
  const counts: Record<string, { count: number; title?: string }> = {};
  for (const row of rows) {
    const data = row.eventData as { path?: string; title?: string } | null;
    const path = data?.path;
    if (path && path.startsWith("/docs/")) {
      if (!counts[path]) counts[path] = { count: 0, title: data?.title };
      counts[path].count += 1;
      // 优先保留带 title 的埋点数据
      if (!counts[path].title && data?.title) counts[path].title = data.title;
    }
  }

  const top = Object.entries(counts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([path, { count, title }]) => ({
      path,
      title: title ?? resolveTitle(path),
      views: count,
    }));

  // 统一 ApiResponse 包裹，和后端 /analytics/top-docs 以及 /rank HotDocsTab 一致
  return Response.json({ success: true, data: top });
}
