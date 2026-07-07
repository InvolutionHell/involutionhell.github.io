/**
 * /feed 社区页：顶部「原创文章 / 分享链接」Tab 切换。
 *
 * 默认 Tab：原创文章（无 ?tab query 等同 ?tab=posts）。
 * posts Tab：SSR 拉 GET /api/posts/feed，走相同的三次退避降级策略。
 * links Tab：维持原有 SSR + CategoryTabs 逻辑不变。
 *
 * revalidate 统一 120s，与原 links Tab 一致。
 */

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import { Suspense } from "react";
import { CategoryTabs } from "@/app/[locale]/feed/components/CategoryTabs";
import { FeedAuthWrapper } from "@/app/[locale]/feed/components/FeedAuthWrapper";
import { FeedTabSwitcher } from "@/app/[locale]/feed/components/FeedTabSwitcher";
import { PostCard } from "@/app/[locale]/feed/components/PostCard";
import type { SharedLinkView, CategorySlug } from "@/app/[locale]/feed/types";
import type { ApiResponse } from "@/app/[locale]/feed/types";
import type { PostSummaryView } from "@/app/types/post";
import Link from "next/link";
import { ensureSeoDescription } from "@/lib/seo-description";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "社区分享墙 · Involution Hell",
  description: ensureSeoDescription({
    description: "群友精选好文，随手转发，沉淀有价值的信息流。",
    title: "社区分享墙",
    sectionPath: ["feed"],
    locale: "zh",
  }),
};

// 三次退避策略（镜像原 fetchLinks，防 Cloudflare 误判 bot 导致 SSR 崩溃）
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
        console.warn("[feed/page] non-JSON 2xx response", {
          attempt: i,
          cfRay: res.headers.get("cf-ray"),
          error: String(err),
        });
        if (i === attempts.length - 1) return [];
        await sleep(i === 0 ? 300 : 800);
        continue;
      }
    }

    console.warn("[feed/page] backend non-2xx", {
      attempt: i,
      status: res.status,
      cfRay: res.headers.get("cf-ray"),
    });
    if (i === attempts.length - 1) return [];
    await sleep(i === 0 ? 300 : 800);
  }

  return [];
}

// 拉取 posts feed，三次退避策略同上
async function fetchPosts(): Promise<PostSummaryView[]> {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    console.error("[feed/page] BACKEND_URL is not configured");
    return [];
  }

  const url = `${backendUrl}/api/posts/feed?limit=50&offset=0`;

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
    init.headers = {
      accept: "application/json",
      "user-agent": "InvolutionHell-SSR/1.0 (+https://involutionhell.com)",
    };

    let res: Response;
    try {
      res = await fetch(url, init);
    } catch (err) {
      console.warn("[feed/page] posts fetch error", {
        attempt: i,
        error: String(err),
      });
      if (i === attempts.length - 1) return [];
      await sleep(i === 0 ? 300 : 800);
      continue;
    }

    if (res.ok) {
      try {
        const json = (await res.json()) as {
          success: boolean;
          data?: PostSummaryView[];
        };
        return json.success && json.data ? json.data : [];
      } catch (err) {
        console.warn("[feed/page] posts non-JSON 2xx", {
          attempt: i,
          error: String(err),
        });
        if (i === attempts.length - 1) return [];
        await sleep(i === 0 ? 300 : 800);
        continue;
      }
    }

    console.warn("[feed/page] posts backend non-2xx", {
      attempt: i,
      status: res.status,
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
  searchParams: Promise<{ tab?: string; category?: string }>;
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const t = await getTranslations("feed");
  const tCategory = await getTranslations("feed.category");

  const resolvedParams = await searchParams;
  // 默认 Tab 是 posts（无 query 或 ?tab=posts）
  const tab: "posts" | "links" =
    resolvedParams.tab === "links" ? "links" : "posts";
  const category = resolvedParams.category ?? "";

  // 按 Tab 并发拉数据，失败时降级为空数组
  let links: SharedLinkView[] = [];
  let posts: PostSummaryView[] = [];

  if (tab === "links") {
    try {
      links = await fetchLinks(category || undefined);
    } catch (err) {
      console.error("[feed/page] fetchLinks failed:", err);
    }
  } else {
    try {
      posts = await fetchPosts();
    } catch (err) {
      console.error("[feed/page] fetchPosts failed:", err);
    }
  }

  // links Tab 需要分类标签翻译（传给 client 组件）
  const { CATEGORY_SLUGS } = await import("@/app/[locale]/feed/types");
  const categoryLabels: Partial<Record<CategorySlug, string>> = {};
  if (tab === "links") {
    for (const slug of CATEGORY_SLUGS) {
      try {
        categoryLabels[slug] = tCategory(slug);
      } catch {
        categoryLabels[slug] = slug;
      }
    }
  }

  return (
    <>
      <Header />
      <main className="pt-32 pb-16 bg-[var(--background)] min-h-screen">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          {/* 页面头部 */}
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
              {tab === "links" ? (
                <Link
                  href="/feed/submit"
                  prefetch={false}
                  className="shrink-0 inline-block px-6 py-2.5 border border-[var(--foreground)] font-sans text-xs uppercase tracking-widest font-bold text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-all duration-200"
                >
                  + 丢个链接
                </Link>
              ) : (
                <Link
                  href="/editor"
                  prefetch={false}
                  className="shrink-0 inline-block px-6 py-2.5 border border-[var(--foreground)] font-sans text-xs uppercase tracking-widest font-bold text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-all duration-200"
                >
                  + 写篇文章
                </Link>
              )}
            </div>
          </header>

          {/* 一级 Tab（需要 useSearchParams，Suspense 包裹） */}
          <Suspense
            fallback={
              <div className="h-10 animate-pulse bg-neutral-100 dark:bg-neutral-900 rounded mb-6" />
            }
          >
            <FeedTabSwitcher currentTab={tab} />
          </Suspense>

          {/* links Tab：分类筛选 */}
          {tab === "links" && (
            <div className="mb-8">
              <Suspense
                fallback={
                  <div className="h-8 animate-pulse bg-neutral-100 dark:bg-neutral-900 rounded" />
                }
              >
                <CategoryTabs />
              </Suspense>
            </div>
          )}

          {/* 内容区 */}
          {tab === "posts" ? (
            posts.length === 0 ? (
              <div className="border border-dashed border-[var(--foreground)]/40 p-10 text-center text-neutral-500 font-sans text-sm leading-relaxed">
                <p>社区里还没有原创文章。</p>
                <p className="text-xs text-neutral-400 mt-2">
                  你的第一篇，可能会成为别人的路标。
                </p>
                <Link
                  href="/editor"
                  prefetch={false}
                  className="mt-4 inline-block font-mono text-xs uppercase tracking-widest text-[var(--foreground)] hover:text-[#CC0000] transition-colors"
                >
                  开始写 →
                </Link>
              </div>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} showAuthor />
                ))}
              </ul>
            )
          ) : links.length === 0 ? (
            <div className="border border-dashed border-[var(--foreground)]/40 p-10 text-center text-neutral-500 font-sans text-sm leading-relaxed">
              {t("empty")}
            </div>
          ) : (
            <FeedAuthWrapper links={links} categoryLabels={categoryLabels} />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
