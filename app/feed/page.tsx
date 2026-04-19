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
 * 从后端拉取 APPROVED 的链接列表，带 Cloudflare Managed Challenge 重试。
 *
 * 背景：Vercel SSR 出口偶发被 CF 403 挑战（同 fetchProfile 的坑）。
 * 单次失败就 throw 会让首页/feed 显示 500。
 *
 * 策略（对齐 fetchProfile）：
 *   - 第 1 次：走 Next Data Cache（revalidate: 120），命中快
 *   - 第 2/3 次：cache: no-store 绕过缓存，分别退避 300ms / 800ms
 *   - 全败返回 [] 而非抛错——让页面降级展示空态，不崩
 *   - 每次失败记录 status / cf-ray，便于 Vercel 日志定位
 */
async function fetchLinks(category?: string): Promise<SharedLinkView[]> {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    console.error("[feed/page] BACKEND_URL is not configured");
    return [];
  }

  const params = new URLSearchParams({ limit: "50", offset: "0" });
  if (category) params.set("category", category);
  const url = `${backendUrl}/api/community/links?${params.toString()}`;

  const attempts: Array<{ revalidate: number } | { noStore: true }> = [
    { revalidate: 120 },
    { noStore: true },
    { noStore: true },
  ];

  for (let i = 0; i < attempts.length; i++) {
    const attempt = attempts[i];
    const init: RequestInit & { next?: { revalidate: number } } =
      "noStore" in attempt
        ? { cache: "no-store" }
        : { next: { revalidate: attempt.revalidate } };
    // 显式 UA 降低被 Cloudflare 误判 bot 的概率
    init.headers = {
      accept: "application/json",
      "user-agent": "InvolutionHell-SSR/1.0 (+https://involutionhell.com)",
    };

    let res: Response;
    try {
      res = await fetch(url, init);
    } catch (err) {
      console.warn("[feed/page] fetch network error", {
        attempt: i,
        error: String(err),
      });
      if (i === attempts.length - 1) return [];
      await sleep(i === 0 ? 300 : 800);
      continue;
    }

    if (res.ok) {
      try {
        const json = (await res.json()) as ApiResponse<SharedLinkView[]>;
        return json.success && json.data ? json.data : [];
      } catch (err) {
        // 2xx 但非 JSON（例如 CF 偶发返回 200 的 challenge HTML）
        console.warn("[feed/page] non-JSON 2xx response", {
          attempt: i,
          cfRay: res.headers.get("cf-ray"),
          contentType: res.headers.get("content-type"),
          error: String(err),
        });
        if (i === attempts.length - 1) return [];
        await sleep(i === 0 ? 300 : 800);
        continue;
      }
    }

    // 非 2xx（含 403 CF challenge / 5xx）：记录 + 重试
    console.warn("[feed/page] backend non-2xx", {
      attempt: i,
      status: res.status,
      cfRay: res.headers.get("cf-ray"),
      cfMitigated: res.headers.get("cf-mitigated"),
    });
    if (i === attempts.length - 1) return [];
    await sleep(i === 0 ? 300 : 800);
  }

  return [];
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
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

  // Server 端预计算 slug → 中文显示名 map。传给 FeedAuthWrapper（client）
  // 时必须是纯数据（函数 prop 在 Next 16 会报 "Functions cannot be passed to
  // Client Components"）。8 个 slug 一次翻译完毕，零额外开销。
  const { CATEGORY_SLUGS } = await import("@/app/feed/types");
  const categoryLabels: Partial<Record<CategorySlug, string>> = {};
  for (const slug of CATEGORY_SLUGS) {
    try {
      categoryLabels[slug] = tCategory(slug);
    } catch {
      categoryLabels[slug] = slug;
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
            <FeedAuthWrapper links={links} categoryLabels={categoryLabels} />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
