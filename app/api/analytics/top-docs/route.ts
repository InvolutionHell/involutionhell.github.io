import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export const revalidate = 300;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const window = searchParams.get("window") ?? "7d";
  const limit = Math.min(Number(searchParams.get("limit") ?? "5"), 20);

  const since = new Date();
  if (window === "7d") {
    since.setDate(since.getDate() - 7);
  } else if (window === "30d") {
    since.setDate(since.getDate() - 30);
  } else {
    since.setFullYear(since.getFullYear() - 10);
  }

  const rows = await prisma.analyticsEvent.findMany({
    where: {
      eventType: "page_view",
      createdAt: { gte: since },
      eventData: { path: { startsWith: "/docs/" } },
    },
    select: { eventData: true },
  });

  // 统计各路径 PV
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const data = row.eventData as { path?: string; title?: string } | null;
    const path = data?.path;
    if (path) counts[path] = (counts[path] ?? 0) + 1;
  }

  const top = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([path, views]) => ({ path, views }));

  return Response.json(top);
}
