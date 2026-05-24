"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/use-auth";
import type { PostSummaryView, ApiResponse } from "@/app/types/post";

interface Props {
  ownerGithubId: number | null;
  ownerUsername: string;
  /** URL 上的标识符（/u/<identifier>），posts 链接用相同 identifier */
  identifier: string;
}

/**
 * 个人主页文章区块入口。
 *
 * 本人访问：显示文章数量 + 跳 /u/{identifier}/posts。
 * 他人访问：只显示跳转链接，数量由公开 feed 近似（为避免多余请求，
 *   初期 MVP 统一显示「查看文章 →」不带数量）。
 *
 * 样式：在 stats 三列下方追加独立链接行，对齐 Task #1 设计说明。
 */
export function PostsLinkOnProfile({
  ownerGithubId,
  ownerUsername,
  identifier,
}: Props) {
  const { user, status } = useAuth();
  const [postCount, setPostCount] = useState<number | null>(null);

  const isOwner = useMemo(() => {
    if (status !== "authenticated" || !user) return false;
    if (ownerGithubId != null && user.githubId === ownerGithubId) return true;
    if (user.username === ownerUsername) return true;
    return false;
  }, [status, user, ownerGithubId, ownerUsername]);

  // 本人才拉 mine 接口以获取文章数（含草稿），他人不请求
  useEffect(() => {
    if (!isOwner) return;
    let aborted = false;
    (async () => {
      try {
        const token = localStorage.getItem("satoken") ?? "";
        const res = await fetch("/api/posts/mine", {
          cache: "no-store",
          // rewrite 透传：后端读 satoken，不是 x-satoken
          headers: token ? { satoken: token } : {},
        });
        if (!res.ok) return;
        const body = (await res.json()) as ApiResponse<PostSummaryView[]>;
        if (!aborted && body.success && body.data) {
          setPostCount(body.data.length);
        }
      } catch {
        // 静默失败，不影响主页主体展示
      }
    })();
    return () => {
      aborted = true;
    };
  }, [isOwner]);

  const href = `/u/${identifier}/posts`;

  return (
    <div className="border-t border-[var(--foreground)] pt-3 flex items-center justify-between">
      <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
        文章
      </span>
      <Link
        href={href}
        className="font-mono text-[10px] text-[var(--foreground)] hover:text-[#CC0000] transition-colors tabular-nums"
      >
        {isOwner && postCount !== null ? `${postCount} 篇 →` : "查看文章 →"}
      </Link>
    </div>
  );
}
