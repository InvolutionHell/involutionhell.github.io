import Link from "next/link";

interface TopDocDto {
  path: string;
  title: string;
  views: number;
}

async function fetchTopDocs(): Promise<TopDocDto[]> {
  // 同源请求 Next ISR 路由，避开对 BACKEND_URL 的硬依赖，
  // 并复用 app/api/analytics/top-docs 的 revalidate=300 缓存。
  // Server Component 中 fetch 需要绝对 URL，优先读显式站点地址，
  // 其次 VERCEL_URL（预览/生产），本地回退到 3010。
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    "http://localhost:3010";
  try {
    const res = await fetch(
      `${siteUrl}/api/analytics/top-docs?window=7d&limit=5`,
      {
        next: { revalidate: 300 },
      },
    );
    if (!res.ok) return [];
    const json = await res.json();
    // 统一 ApiResponse<{ path, title, views }[]> 结构
    return Array.isArray(json?.data) ? json.data : [];
  } catch {
    return [];
  }
}

export async function HotDocsPreview() {
  const docs = await fetchTopDocs();

  return (
    <div className="border border-[var(--foreground)] p-6 bg-[var(--background)]">
      <div className="flex items-center justify-between mb-4 border-b border-[var(--foreground)] pb-3">
        <div>
          <div className="font-serif text-lg font-black uppercase text-[var(--foreground)]">
            Hot This Week
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            本周最热
          </div>
        </div>
        <Link
          href="/rank?tab=hot&window=7d"
          className="font-mono text-[10px] uppercase tracking-widest font-bold text-[var(--foreground)] hover:text-[#CC0000] transition-colors flex items-center gap-1 group"
          data-umami-event="navigation_click"
          data-umami-event-region="hot_docs_preview"
          data-umami-event-label="MORE"
        >
          MORE
          <span className="transform group-hover:translate-x-0.5 transition-transform">
            &rarr;
          </span>
        </Link>
      </div>

      {docs.length === 0 ? (
        <p className="font-mono text-xs text-neutral-400">暂无数据</p>
      ) : (
        <ol className="flex flex-col gap-4">
          {docs.map((doc, idx) => (
            <li key={doc.path} className="flex items-start gap-3 group">
              <span className="font-mono text-[10px] text-neutral-400 w-4 shrink-0 pt-1">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <div className="flex-1 min-w-0">
                <Link
                  href={doc.path}
                  className="font-serif text-sm font-bold uppercase text-[var(--foreground)] hover:text-[#CC0000] transition-colors leading-tight line-clamp-2 block"
                  data-umami-event="navigation_click"
                  data-umami-event-region="hot_docs_preview"
                  data-umami-event-label={doc.path}
                >
                  {doc.title}
                </Link>
                <div className="font-mono text-[10px] text-neutral-400 mt-0.5">
                  {doc.views.toLocaleString()} views
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
