"use client";

import Link from "next/link";
import { useAuth } from "@/lib/use-auth";
import { useTranslations } from "next-intl";

interface Props {
  /** 当前页面主人的 GitHub 数字 ID（可能为 null 的老数据） */
  ownerGithubId: number | null;
  /** 当前页面主人的系统 username，形如 "github_114939201" */
  ownerUsername: string;
  /** URL 上的标识符（/u/<identifier>），用于拼编辑页 URL 保持一致 */
  identifier: string;
}

/**
 * 只有登录用户自己访问自己主页时渲染"编辑"链接；其他情况返回 null。
 * useAuth 是客户端 hook，所以这个组件必须是 client，但它本身极轻（不打 API）。
 */
export function EditLinkIfOwner({
  ownerGithubId,
  ownerUsername,
  identifier,
}: Props) {
  const { user, status } = useAuth();
  const t = useTranslations("profile");
  if (status !== "authenticated" || !user) return null;

  const isOwner =
    (ownerGithubId != null && user.githubId === ownerGithubId) ||
    user.username === ownerUsername;
  if (!isOwner) return null;

  return (
    <Link
      href={`/u/${identifier}/edit`}
      className="font-mono text-[11px] uppercase tracking-widest hover:text-[#CC0000] transition-colors flex items-center gap-1 font-bold"
      data-umami-event="profile_edit_click"
    >
      {t("editProfile")}
    </Link>
  );
}
