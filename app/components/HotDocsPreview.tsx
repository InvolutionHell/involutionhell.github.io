import Link from "next/link";
import { getTranslations } from "next-intl/server";

interface TopDocDto {
  path: string;
  title: string;
  views: number;
}

async function fetchTopDocs(): Promise<TopDocDto[]> {
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
      {
        next: { revalidate: 300 },
        // UA 必须带 "InvolutionHell-SSR" token，否则 Cloudflare Bot Fight Mode
        // 会按 Vercel runner IP 信誉判定为 bot 拦截（CF Custom Rule 用这个
        // token 识别"自己人"放行）。其他 SSR fetcher（fetchProfile / events /
        // feed）都已经带，唯独本组件之前漏了导致首页 "本周最热" 一直空。
        headers: {
          accept: "application/json",
          "user-agent": "InvolutionHell-SSR/1.0 (+https://involutionhell.com)",
        },
      },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch {
    return [];
  }
}

/**
 * HotDocsPreview 的骨架屏。
 * 在首页被 <Suspense> 包裹时作为 fallback，让页面 shell 先 stream 给浏览器，
 * 等后端 /analytics/top-docs 返回后再替换成真实内容。
 * 结构刻意贴合真组件（同样的 5 行 + 标题栏），避免 CLS。
 */
export function HotDocsPreviewSkeleton() {
  return (
    <div className="border border-[var(--foreground)] p-6 bg-[var(--background)]">
      <div className="flex items-center justify-between mb-4 border-b border-[var(--foreground)] pb-3">
        <div>
          <div className="font-serif text-lg font-black uppercase text-[var(--foreground)]">
            Hot This Week
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            Loading…
          </div>
        </div>
      </div>
      <ol className="flex flex-col gap-4" aria-hidden>
        {Array.from({ length: 5 }).map((_, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <span className="font-mono text-[10px] text-neutral-400 w-4 shrink-0 pt-1">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <div className="flex-1 min-w-0">
              <div className="h-4 bg-neutral-200 dark:bg-neutral-800 w-11/12 animate-pulse" />
              <div className="h-3 bg-neutral-200 dark:bg-neutral-800 w-16 mt-1.5 animate-pulse" />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export async function HotDocsPreview() {
  const docs = await fetchTopDocs();
  const t = await getTranslations("hotDocs");

  return (
    <div className="border border-[var(--foreground)] p-6 bg-[var(--background)]">
      <div className="flex items-center justify-between mb-4 border-b border-[var(--foreground)] pb-3">
        <div>
          <div className="font-serif text-lg font-black uppercase text-[var(--foreground)]">
            Hot This Week
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            {t("subtitle")}
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
        <p className="font-mono text-xs text-neutral-400">{t("empty")}</p>
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
