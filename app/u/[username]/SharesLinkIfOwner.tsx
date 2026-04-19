"use client";

import Link from "next/link";
import { useAuth } from "@/lib/use-auth";

interface Props {
  /** 当前页面主人的 GitHub 数字 ID（可能为 null 的老数据） */
  ownerGithubId: number | null;
  /** 当前页面主人的系统 username，形如 "github_114939201" */
  ownerUsername: string;
  /** URL 上的标识符（/u/<identifier>），shares 页 route 用相同 identifier */
  identifier: string;
}

/**
 * 个人主页"我的分享"入口。
 *
 * 只在"本人访问自己主页"时渲染——其他用户访问时不展示，
 * 避免暴露非本人看不到内容的死链（shares 页面本身也会做二次校验）。
 *
 * 判定逻辑照搬 EditLinkIfOwner：优先 githubId 匹配，退回 username。
 */
export function SharesLinkIfOwner({
  ownerGithubId,
  ownerUsername,
  identifier,
}: Props) {
  const { user, status } = useAuth();
  if (status !== "authenticated" || !user) return null;

  const isOwner =
    (ownerGithubId != null && user.githubId === ownerGithubId) ||
    user.username === ownerUsername;
  if (!isOwner) return null;

  return (
    <Link
      href={`/u/${identifier}/shares`}
      className="font-mono text-[11px] uppercase tracking-widest hover:text-[#CC0000] transition-colors flex items-center gap-1 font-bold"
      data-umami-event="profile_shares_click"
    >
      我的分享
    </Link>
  );
}
