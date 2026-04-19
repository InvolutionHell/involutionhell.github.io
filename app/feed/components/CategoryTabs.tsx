"use client";

/**
 * 分类 tab 导航组件。
 * 通过 URL searchParams（?category=<slug>）来控制当前选中项，
 * 保持 SSR 可读且可书签化，避免纯 client state 无法分享链接。
 */

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { type CategorySlug, CATEGORY_SLUGS } from "@/app/feed/types";
import { cn } from "@/lib/utils";

export function CategoryTabs() {
  const t = useTranslations("feed.category");
  const router = useRouter();
  const searchParams = useSearchParams();

  // 当前选中的分类 slug，空字符串代表"全部"
  const current = (searchParams.get("category") ?? "") as CategorySlug | "";

  /**
   * 点击分类时更新 URL query，不需要 push history stack——
   * 用 replace 避免用户反复点分类时返回键卡死。
   */
  function handleSelect(slug: CategorySlug | "") {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set("category", slug);
    } else {
      params.delete("category");
    }
    router.replace(`/feed?${params.toString()}`);
  }

  const allTabs: Array<{ slug: CategorySlug | ""; label: string }> = [
    { slug: "", label: t("all") },
    ...CATEGORY_SLUGS.map((slug) => ({
      slug,
      label: t(slug),
    })),
  ];

  return (
    // 横向滚动容器，移动端展示全部分类时不截断
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {allTabs.map(({ slug, label }) => (
        <button
          key={slug || "__all__"}
          onClick={() => handleSelect(slug)}
          className={cn(
            // 基础样式：小号等宽字体，边框按钮形态
            "shrink-0 px-3 py-1.5 font-mono text-xs uppercase tracking-widest border transition-colors duration-150 whitespace-nowrap",
            current === slug
              ? // 选中态：反色高亮
                "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]"
              : // 未选中态：透明背景，hover 轻高亮
                "border-[var(--foreground)]/40 text-neutral-500 hover:border-[var(--foreground)] hover:text-[var(--foreground)]",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
