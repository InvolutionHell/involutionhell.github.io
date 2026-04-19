/**
 * /feed 社区分享墙列表页。
 *
 * SSR 直连后端拉已审核通过（APPROVED）的链接，revalidate: 120 减少 DB 压力。
 * 分类过滤通过 URL searchParam ?category=<slug> 实现，SSR 可直接读取。
 *
 * 登录态检测：由于认证走 localStorage（client-only），isLoggedIn 无法在 SSR 层知道，
 * 故 LinkCard 中的举报按钮默认以未登录态渲染，由 ReportButton 内部在 client 端
 * 补充真实登录判断。这里通过 FeedAuthWrapper 传递 client 端的 isLoggedIn 状态。
 */

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import { Suspense } from "react";
import { CategoryTabs } from "@/app/feed/components/CategoryTabs";
import { FeedAuthWrapper } from "@/app/feed/components/FeedAuthWrapper";
import type { SharedLinkView, CategorySlug } from "@/app/feed/types";
import type { ApiResponse } from "@/app/feed/types";
import Link from "next/link";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "社区分享墙 · Involution Hell",
  description: "群友精选好文，随手转发，沉淀有价值的信息流。",
};

/**
 * 从后端拉取 APPROVED 的链接列表。
 * category 为空时拉全部，否则按 slug 过滤。
 */
async function fetchLinks(category?: string): Promise<SharedLinkView[]> {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    // 配置缺失时给清晰错误，而非静默空列表
    throw new Error("BACKEND_URL is not configured");
  }

  // 构造查询参数
  const params = new URLSearchParams({ limit: "50", offset: "0" });
  if (category) params.set("category", category);

  const res = await fetch(
    `${backendUrl}/api/community/links?${params.toString()}`,
    {
      next: { revalidate: 120 },
      headers: {
        accept: "application/json",
        "user-agent": "InvolutionHell-SSR/1.0 (+https://involutionhell.com)",
      },
    },
  );

  if (!res.ok) {
    // 后端 5xx / 网络错误才抛，前端会走 error.tsx（如果有的话）
    throw new Error(
      `/api/community/links backend ${res.status} ${res.statusText}`,
    );
  }

  const json = (await res.json()) as ApiResponse<SharedLinkView[]>;
  return json.success && json.data ? json.data : [];
}

interface FeedPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const t = await getTranslations("feed");
  const tCategory = await getTranslations("feed.category");

  // Next.js 15+ searchParams 是 Promise，需要 await
  const resolvedParams = await searchParams;
  const category = resolvedParams.category ?? "";

  // 获取链接列表，出错时降级为空数组（不让整页崩溃）
  let links: SharedLinkView[] = [];
  try {
    links = await fetchLinks(category || undefined);
  } catch (err) {
    // SSR 拉取失败时记录日志，降级展示空状态，不崩溃整页
    console.error("[feed/page] fetchLinks failed:", err);
  }

  /**
   * 预计算每条链接的分类显示名（i18n）。
   * 在 server 端翻译，避免 LinkCard（server component）里调 useTranslations（client hook）。
   */
  function getCategoryLabel(slug: CategorySlug | null): string {
    if (!slug) return "";
    try {
      return tCategory(slug);
    } catch {
      return slug;
    }
  }

  return (
    <>
      <Header />
      <main className="pt-32 pb-16 bg-[var(--background)] min-h-screen">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          {/* 页面头部，风格对齐 /events */}
          <header className="border-t-4 border-[var(--foreground)] pt-6 mb-10">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500">
              Community · Feed
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mt-2">
              <div>
                <h1 className="font-serif text-4xl md:text-5xl font-black uppercase tracking-tight text-[var(--foreground)]">
                  {t("title")}
                </h1>
                <p className="mt-3 text-sm md:text-base text-neutral-600 dark:text-neutral-400 max-w-2xl leading-relaxed">
                  {t("subtitle")}
                </p>
              </div>
              {/* 提交按钮 */}
              <Link
                href="/feed/submit"
                className="shrink-0 inline-block px-6 py-2.5 border border-[var(--foreground)] font-sans text-xs uppercase tracking-widest font-bold text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-all duration-200"
              >
                + 丢个链接
              </Link>
            </div>
          </header>

          {/* 分类 tab（client component，依赖 router/searchParams） */}
          <div className="mb-8">
            {/* Suspense 包裹是因为 CategoryTabs 内部调用 useSearchParams，
                Next.js 要求 useSearchParams 的父级有 Suspense 边界 */}
            <Suspense
              fallback={
                <div className="h-8 animate-pulse bg-neutral-100 dark:bg-neutral-900 rounded" />
              }
            >
              <CategoryTabs />
            </Suspense>
          </div>

          {/* 链接卡片瀑布流 */}
          {links.length === 0 ? (
            // 空状态提示
            <div className="border border-dashed border-[var(--foreground)]/40 p-10 text-center text-neutral-500 font-sans text-sm leading-relaxed">
              {t("empty")}
            </div>
          ) : (
            // FeedAuthWrapper 是 client 组件，负责读取登录态后注入到 LinkCard
            <FeedAuthWrapper
              links={links}
              getCategoryLabel={getCategoryLabel}
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
