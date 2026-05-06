"use client";

import Link from "next/link";
import { useAuth } from "@/lib/use-auth";

/**
 * 个人主页的"管理员界面"入口。
 *
 * 渲染条件（三者必须同时满足）：
 *   1. 当前已登录
 *   2. 当前登录用户就是这个主页的 owner（避免路人看到 "管理员界面" 按钮产生社交困惑）
 *   3. 当前用户的 roles 包含 admin
 *
 * 也就是说：只有管理员访问自己主页时才看得到这个按钮。其他角色（其他登录用户、
 * 匿名访客）一律 return null，连 DOM 都不存在。
 *
 * 用 client component 是因为依赖 useAuth（satoken 存在 localStorage，SSR 拿不到）。
 */

interface Props {
  ownerGithubId: number | null;
  ownerUsername: string;
}

export function AdminLinkIfOwnerAdmin({ ownerGithubId, ownerUsername }: Props) {
  const { user, status } = useAuth();
  if (status !== "authenticated" || !user) return null;

  const isOwner =
    (ownerGithubId != null && user.githubId === ownerGithubId) ||
    user.username === ownerUsername;
  if (!isOwner) return null;

  const isAdmin = user.roles?.includes("admin") ?? false;
  if (!isAdmin) return null;

  return (
    <Link
      href="/admin"
      className="font-mono text-[11px] uppercase tracking-widest px-2 py-1 border border-[#CC0000] text-[#CC0000] hover:bg-[#CC0000] hover:text-white transition-colors font-bold"
      data-umami-event="profile_admin_click"
    >
      管理员界面
    </Link>
  );
}
