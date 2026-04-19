"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/use-auth";
import { LinkCard } from "@/app/feed/components/LinkCard";
import type { ApiResponse, SharedLinkView } from "@/app/feed/types";

/**
 * 用户自己的分享列表页（"我提交的"）。
 *
 * 可见性规则（v1 最简）：
 *   - 本人登录：渲染自己所有状态的分享（PENDING / APPROVED / FLAGGED / ARCHIVED…）
 *   - 其他人访问：v1 暂时不展示列表，提示"仅本人可见"
 *
 * 为什么纯 client：列表需要 satoken 才能拉，SSR 没法带 header，就不费劲走 server fetch 了。
 * 将来如果要做公开展示别人的 APPROVED 分享，需要后端新增
 * GET /api/community/users/{username}/shares 再改这里（M8+ 的事）。
 */

// 页面的 status 展示 badge 颜色映射
const STATUS_BADGE: Record<
  SharedLinkView["status"],
  { label: string; className: string }
> = {
  PENDING: { label: "审核中", className: "bg-amber-100 text-amber-900" },
  APPROVED: { label: "已通过", className: "bg-emerald-100 text-emerald-900" },
  PENDING_MANUAL: {
    label: "人工待审",
    className: "bg-orange-100 text-orange-900",
  },
  FLAGGED: { label: "需要复核", className: "bg-red-100 text-red-900" },
  REJECTED: { label: "已拒绝", className: "bg-zinc-200 text-zinc-700" },
  ARCHIVED: { label: "原文已失效", className: "bg-zinc-100 text-zinc-600" },
};

interface PageProps {
  params: Promise<{ username: string }>;
}

export default function SharesPage({ params }: PageProps) {
  const { username } = use(params);
  const { user, status } = useAuth();
  const tFeed = useTranslations("feed");
  const tCategory = useTranslations("feed.category");
  const [links, setLinks] = useState<SharedLinkView[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 是否为本人访问自己的页面。
  // URL 的 [username] 参数可能是 "github_114939201" 也可能是 "114939201"（纯 githubId）
  // —— 个人主页 canonical URL 已用 githubId，所以两种格式都要支持。
  // 判定逻辑照搬 EditLinkIfOwner：githubId 优先，username 兜底。
  const isOwner = useMemo(() => {
    if (status !== "authenticated" || !user) return false;
    if (user.githubId != null && String(user.githubId) === username)
      return true;
    if (user.username === username) return true;
    return false;
  }, [status, user, username]);

  useEffect(() => {
    // 只给本人拉数据，其他访客根本不请求后端
    if (!isOwner) return;
    let aborted = false;
    (async () => {
      try {
        const res = await fetch("/api/community/links/mine", {
          cache: "no-store",
        });
        if (!res.ok) {
          if (!aborted) setLoadError(`HTTP ${res.status}`);
          return;
        }
        const body = (await res.json()) as ApiResponse<SharedLinkView[]>;
        if (!aborted) {
          if (body.success && body.data) setLinks(body.data);
          else setLoadError(body.message ?? "加载失败");
        }
      } catch (err) {
        if (!aborted) setLoadError(String(err));
      }
    })();
    return () => {
      aborted = true;
    };
  }, [isOwner]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">我提交的分享</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isOwner
            ? "所有已提交的链接及审核状态。PENDING 表示 AI 正在审核，通常 10 秒 ~ 数分钟。"
            : "仅本人可见。"}
        </p>
      </header>

      {/* 非本人访问：给一个回到公共 /feed 的入口，避免页面显得空 */}
      {!isOwner && (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          <p>这是 {username} 的私有分享列表，只有本人登录后可见。</p>
          <Link
            href="/feed"
            className="mt-4 inline-block text-primary underline underline-offset-4"
          >
            浏览公共分享墙 →
          </Link>
        </div>
      )}

      {isOwner && loadError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          加载失败：{loadError}
        </div>
      )}

      {isOwner && !loadError && links === null && (
        <p className="text-sm text-muted-foreground">加载中...</p>
      )}

      {isOwner && links !== null && links.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          <p>{tFeed("empty")}</p>
          <Link
            href="/feed/submit"
            className="mt-4 inline-block text-primary underline underline-offset-4"
          >
            去提交第一条 →
          </Link>
        </div>
      )}

      {isOwner && links !== null && links.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <div key={link.id} className="relative">
              {/* 状态 badge 叠在卡片左上角，本人才看得到（只有这页拉） */}
              <span
                className={`absolute left-3 top-3 z-10 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[link.status].className}`}
              >
                {STATUS_BADGE[link.status].label}
              </span>
              <LinkCard
                link={link}
                categoryLabel={link.category ? tCategory(link.category) : ""}
                isLoggedIn={true}
              />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
