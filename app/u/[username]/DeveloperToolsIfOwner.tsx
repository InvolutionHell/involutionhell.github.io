"use client";

/**
 * 个人主页的"开发者选项"入口块。
 *
 * 和 AdminLinkIfOwnerAdmin 的区别——这里**不限 admin**，只要是主页 owner（当前登录
 * 用户 === 这个主页本人）就看得见。理由：
 *   - 密钥管理 (Infisical) 是每个开发者都要用的，不是管理员专属。
 *     Infisical 自己按 project / environment 做权限细分，进去后看不到自己没权限的 secrets。
 *   - 以后其他"个人开发者工具"（比如 CI tokens、个人 API key 管理）也可以挂在这里
 *
 * 渲染条件：
 *   1. 已登录
 *   2. 当前登录用户就是这个主页的 owner（路人看不到）
 *
 * 注意：单独加 Link 而不是走 AdminGuard 风格，因为这是"入口按钮"不是"整页权限"，
 * 二次校验由目标服务（Infisical）自己做。
 */

import Link from "next/link";
import { useAuth } from "@/lib/use-auth";

interface Props {
  ownerGithubId: number | null;
  ownerUsername: string;
}

export function DeveloperToolsIfOwner({ ownerGithubId, ownerUsername }: Props) {
  const { user, status } = useAuth();
  if (status !== "authenticated" || !user) return null;

  const isOwner =
    (ownerGithubId != null && user.githubId === ownerGithubId) ||
    user.username === ownerUsername;
  if (!isOwner) return null;

  return (
    <Link
      href="https://secrets.involutionhell.com"
      target="_blank"
      rel="noopener noreferrer"
      className="font-mono text-[11px] uppercase tracking-widest px-2 py-1 border border-[var(--foreground)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors font-bold"
      data-umami-event="profile_devtools_secrets_click"
      title="Infisical 密钥管理 — 首次进入 GitHub 会要你再授权一次，这是正常的：Infisical 和主站是两个独立的 OAuth App（授权页会显示 owned by InvolutionHell 和相同 logo）。登录后按 project 权限查看"
    >
      密钥管理 ↗
    </Link>
  );
}
