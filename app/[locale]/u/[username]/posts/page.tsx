"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/use-auth";
import { PostCard } from "@/app/[locale]/feed/components/PostCard";
import type { PostSummaryView, ApiResponse } from "@/app/types/post";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default function UserPostsPage({ params }: PageProps) {
  const { username } = use(params);
  const { user, status } = useAuth();
  const [posts, setPosts] = useState<PostSummaryView[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 判定本人：githubId 优先，username 兜底（镜像 shares/page.tsx 逻辑）
  const isOwner = useMemo(() => {
    if (status !== "authenticated" || !user) return false;
    if (user.githubId != null && String(user.githubId) === username)
      return true;
    if (user.username === username) return true;
    return false;
  }, [status, user, username]);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        // 本人用 /mine（拿全部状态），他人用 /api/posts/{username}/feed（仅 PUBLISHED+PUBLIC）
        // 当前 MVP：统一用公开 feed 接口（按 username 过滤）。
        // 后端 GET /api/posts/feed 不支持 username 过滤时，改走 GET /api/posts/{username}/feed
        // 或前端二次过滤 mine 接口。
        // 目前走：owner 用 mine（带 satoken），他人用 username 公开列表（无 satoken）。
        let url: string;
        const headers: Record<string, string> = {};

        if (isOwner) {
          url = "/api/posts/mine";
          const token =
            typeof window !== "undefined"
              ? (localStorage.getItem("satoken") ?? "")
              : "";
          // rewrite 透传：后端读 satoken，不是 x-satoken
          if (token) headers["satoken"] = token;
        } else {
          // 公开接口：/api/posts/{username}/feed（如后端未实现则降级为 feed 过滤）
          url = `/api/posts/${encodeURIComponent(username)}/feed`;
        }

        const res = await fetch(url, { cache: "no-store", headers });
        if (!res.ok) {
          if (!aborted) setLoadError(`HTTP ${res.status}`);
          return;
        }
        const body = (await res.json()) as ApiResponse<PostSummaryView[]>;
        if (!aborted) {
          if (body.success && body.data) setPosts(body.data);
          else setLoadError(body.message ?? "加载失败");
        }
      } catch (err) {
        if (!aborted) setLoadError(String(err));
      }
    })();
    return () => {
      aborted = true;
    };
  }, [isOwner, username]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-1">
          Community · Posts
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isOwner ? "我的文章" : `@${username} 的文章`}
        </h1>
        {isOwner && (
          <p className="mt-2 text-sm text-muted-foreground">
            发布即可见，想进知识库时点文章里的「投稿进知识库」。
          </p>
        )}
      </header>

      {loadError && (
        <div className="rounded-none border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          加载失败：{loadError}
        </div>
      )}

      {!loadError && posts === null && (
        <p className="text-sm text-muted-foreground">加载中...</p>
      )}

      {!loadError && posts !== null && posts.length === 0 && (
        <div className="border border-dashed border-[var(--foreground)]/40 p-10 text-center text-neutral-500 font-sans text-sm leading-relaxed">
          {isOwner ? (
            <>
              <p>还没有发布过文章，写第一篇让大家看到你。</p>
              <Link
                href="/editor"
                prefetch={false}
                className="mt-4 inline-block font-mono text-xs uppercase tracking-widest text-[var(--foreground)] hover:text-[#CC0000] transition-colors"
              >
                去写 →
              </Link>
            </>
          ) : (
            <p>这位同学还没有发布过文章。</p>
          )}
        </div>
      )}

      {!loadError && posts !== null && posts.length > 0 && (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            // 个人主页列表隐藏作者头像（showAuthor=false，本页已知作者是 username）
            <PostCard key={post.id} post={post} showAuthor={false} />
          ))}
        </ul>
      )}
    </main>
  );
}
