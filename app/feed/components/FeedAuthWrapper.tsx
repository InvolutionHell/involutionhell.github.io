"use client";

/**
 * FeedAuthWrapper —— client 组件桥接器。
 *
 * /feed/page.tsx 是 SSR server component，无法感知 localStorage 登录态；
 * 本组件在 client 端读取 useAuth() 后，把 isLoggedIn 传给 LinkCard，
 * 使举报按钮可以区分已登录 / 未登录行为。
 *
 * 接收 server 端已预计算好的 links 和**分类标签映射表**（纯数据），
 * 不接收函数 prop —— Next 16 对 server→client 边界严格禁止函数 prop
 * （会报 "Functions cannot be passed directly to Client Components"）。
 */

import { useAuth } from "@/lib/use-auth";
import { LinkCard } from "@/app/feed/components/LinkCard";
import type { SharedLinkView, CategorySlug } from "@/app/feed/types";

interface FeedAuthWrapperProps {
  links: SharedLinkView[];
  /** server 端预翻译好的 slug → 中文显示名 map */
  categoryLabels: Partial<Record<CategorySlug, string>>;
}

export function FeedAuthWrapper({
  links,
  categoryLabels,
}: FeedAuthWrapperProps) {
  const { status } = useAuth();
  // loading 阶段默认视为未登录，避免 UI 闪烁
  const isLoggedIn = status === "authenticated";

  return (
    // 响应式 grid：桌面 3 列 / 平板 2 列 / 手机 1 列
    <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {links.map((link) => (
        <LinkCard
          key={link.id}
          link={link}
          categoryLabel={(link.category && categoryLabels[link.category]) ?? ""}
          isLoggedIn={isLoggedIn}
        />
      ))}
    </ul>
  );
}
