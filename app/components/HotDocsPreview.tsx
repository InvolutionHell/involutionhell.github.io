"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface TopDocDto {
  path: string;
  title: string;
  views: number;
}

/**
 * HotDocsPreview 的骨架屏。
 * 数据加载期间显示，避免 CLS（结构刻意贴合真组件，5 行 + 标题栏）。
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

/**
 * HotDocsPreview - 首页 "本周最热" 文档榜。
 *
 * 客户端化（i18n 改造收尾，2026-05）：
 *   原来是 async server component（await fetchTopDocs + getTranslations），
 *   server fetch 让首页 RSC tree 整体 ƒ Dynamic。改 client 后：
 *   - 数据走 /api/public/top-docs（revalidate=300 ISR + 浏览器 5min 缓存）
 *   - 翻译用 next-intl 的 useTranslations（client hook）
 *   - 首屏先显示 Skeleton，hydrate 后 fetch + 替换为真实内容（不影响 LCP）
 */
export function HotDocsPreview() {
  const t = useTranslations("hotDocs");
  const [docs, setDocs] = useState<TopDocDto[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/top-docs", { cache: "force-cache" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: TopDocDto[]) => {
        if (!cancelled) setDocs(data);
      })
      .catch(() => {
        if (!cancelled) setDocs([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // fetch 未完成：渲染 Skeleton（与 Suspense fallback 同形态）
  if (docs === null) {
    return <HotDocsPreviewSkeleton />;
  }

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
