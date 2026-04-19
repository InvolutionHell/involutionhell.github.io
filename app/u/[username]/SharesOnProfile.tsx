"use client";

/**
 * 个人主页"我的分享"嵌入式区块。
 *
 * 出现位置：profile 页原来的 GitHub repos + 文档贡献两块（已删）位置。
 *
 * 可见规则（v1）：
 * - 仅本人访问自己主页时渲染
 * - 非本人：返回 null，保持页面简洁，不展示空占位
 *
 * 数据源：GET /api/community/links/mine（需登录）
 *   - 包含本人全状态的分享（PENDING / APPROVED / FLAGGED / ARCHIVED…）
 *   - 列表默认展示最近 6 条，带状态 badge；底部"查看全部"跳 /u/{identifier}/shares
 *
 * 后端公开 API 还没做（/api/community/users/{id}/shares），所以无法展示"别人的分享"。
 * 等真需要公开展示时再开那个接口，本组件 props 不变。
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/use-auth";
import type { ApiResponse, SharedLinkView } from "@/app/feed/types";

interface Props {
  /** 当前页面主人的 GitHub 数字 ID（可能为 null 的老数据） */
  ownerGithubId: number | null;
  /** 当前页面主人的系统 username，形如 "github_114939201" */
  ownerUsername: string;
  /** URL 上的标识符（用于拼 /u/{identifier}/shares 跳转） */
  identifier: string;
}

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
  ARCHIVED: { label: "原文失效", className: "bg-zinc-100 text-zinc-600" },
};

export function SharesOnProfile({
  ownerGithubId,
  ownerUsername,
  identifier,
}: Props) {
  const { user, status } = useAuth();
  const [links, setLinks] = useState<SharedLinkView[] | null>(null);

  const isOwner = useMemo(() => {
    if (status !== "authenticated" || !user) return false;
    if (ownerGithubId != null && user.githubId === ownerGithubId) return true;
    return user.username === ownerUsername;
  }, [status, user, ownerGithubId, ownerUsername]);

  useEffect(() => {
    if (!isOwner) return;
    let aborted = false;
    (async () => {
      try {
        const res = await fetch("/api/community/links/mine", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const body = (await res.json()) as ApiResponse<SharedLinkView[]>;
        if (!aborted && body.success && body.data) setLinks(body.data);
      } catch {
        // 静默失败：个人主页上的次级栏目不值得打扰用户
      }
    })();
    return () => {
      aborted = true;
    };
  }, [isOwner]);

  // 非本人：完全不渲染，避免展示空占位
  if (!isOwner) return null;

  return (
    <section className="h-full border border-[var(--foreground)] p-6 lg:p-8 flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3 flex-wrap border-b border-[var(--foreground)] pb-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            Community · Feed
          </div>
          <h3 className="font-serif text-xl font-black uppercase mt-1 text-[var(--foreground)]">
            我的分享
          </h3>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/feed/submit"
            className="font-mono text-[10px] uppercase tracking-widest text-[#CC0000] hover:underline"
          >
            + 丢个链接
          </Link>
          <Link
            href={`/u/${identifier}/shares`}
            className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 hover:text-[var(--foreground)]"
          >
            查看全部 →
          </Link>
        </div>
      </div>

      {/* 加载中：骨架 */}
      {links === null && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-14 bg-neutral-100 dark:bg-neutral-900 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* 空态：给一个明显的 CTA 而不是冷冰冰的占位 */}
      {links !== null && links.length === 0 && (
        <div className="border border-dashed border-[var(--foreground)]/40 p-8 text-center">
          <p className="text-sm text-neutral-500">
            还没分享过任何文章。看到好东西随手丢个链接，AI 会自动归类。
          </p>
          <Link
            href="/feed/submit"
            className="mt-4 inline-block font-mono text-xs uppercase tracking-widest text-[#CC0000] hover:underline"
          >
            去分享第一篇 →
          </Link>
        </div>
      )}

      {/* 列表：最多展示 6 条，超过跳 /shares 全览 */}
      {links !== null && links.length > 0 && (
        <ol className="flex flex-col">
          {links.slice(0, 6).map((link, idx) => (
            <li
              key={link.id}
              className="flex items-center gap-3 py-3 border-b border-[var(--foreground)]/10 last:border-b-0"
            >
              <span className="font-mono text-xs text-neutral-400 w-6 flex-shrink-0">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium flex-shrink-0 ${STATUS_BADGE[link.status].className}`}
              >
                {STATUS_BADGE[link.status].label}
              </span>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-0 truncate text-sm font-medium hover:underline"
                title={link.ogTitle ?? link.url}
              >
                {link.ogTitle ?? link.url}
              </a>
              <span className="text-[10px] font-mono text-neutral-400 flex-shrink-0 hidden sm:inline">
                {link.host}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
