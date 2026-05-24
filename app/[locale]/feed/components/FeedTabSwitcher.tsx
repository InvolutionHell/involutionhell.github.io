"use client";

import { useRouter, useSearchParams } from "next/navigation";

/**
 * 「原创文章 / 分享链接」顶级 Tab 切换。
 *
 * 通过 ?tab=posts / ?tab=links 控制当前 Tab，保持 SSR 可读且可书签化。
 * 切换 Tab 时清除 ?category query，避免分类筛选残留到原创文章 Tab。
 */
export function FeedTabSwitcher({
  currentTab,
}: {
  currentTab: "posts" | "links";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function switchTab(tab: "posts" | "links") {
    const params = new URLSearchParams();
    params.set("tab", tab);
    // 切到 links 时保留 category；切到 posts 时清除（posts 暂无分类筛选）
    if (tab === "links") {
      const category = searchParams.get("category");
      if (category) params.set("category", category);
    }
    router.replace(`/feed?${params.toString()}`);
  }

  const base =
    "px-5 py-2.5 font-mono text-xs uppercase tracking-widest transition-colors";
  const active =
    "border-b-2 border-[var(--foreground)] text-[var(--foreground)] -mb-px";
  const inactive = "text-neutral-400 hover:text-[var(--foreground)]";

  return (
    <div className="flex gap-0 border-b border-[var(--foreground)] mb-6">
      <button
        onClick={() => switchTab("posts")}
        className={`${base} ${currentTab === "posts" ? active : inactive}`}
      >
        原创文章
      </button>
      <button
        onClick={() => switchTab("links")}
        className={`${base} ${currentTab === "links" ? active : inactive}`}
      >
        分享链接
      </button>
    </div>
  );
}
