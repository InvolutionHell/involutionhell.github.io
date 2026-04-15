import Link from "next/link";

interface TopDocDto {
  path: string;
  title: string;
  views: number;
}

async function fetchTopDocs(): Promise<TopDocDto[]> {
  // 直连 Java 后端 /analytics/top-docs（GA4 数据 + Caffeine 缓存），
  // Next 不再做聚合，把 CPU 留给后端。
  // BACKEND_URL 不设置时不做任何硬编码 fallback：不同开发者端口不一致（8080/8081/其他），
  // 生产环境必须显式配置，本地未配也直接 no-op 返回空，而不是假装连 8081。
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[HotDocsPreview] BACKEND_URL 未配置，跳过 Top Docs 请求。本地请在 .env.local 设置。",
      );
    }
    return [];
  }
  try {
    const res = await fetch(
      `${backendUrl}/analytics/top-docs?window=7d&limit=5`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return [];
    const json = await res.json();
    // 后端 ApiResponse<List<TopDocDto>> 结构：{ success, data: [...] }
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
