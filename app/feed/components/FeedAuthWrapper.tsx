"use client";

/**
 * FeedAuthWrapper —— client 组件桥接器。
 *
 * /feed/page.tsx 是 SSR server component，无法感知 localStorage 登录态；
 * 本组件在 client 端读取 useAuth() 后，把 isLoggedIn 传给 LinkCard，
 * 使举报按钮可以区分已登录 / 未登录行为。
 *
 * 接收 server 端已预计算好的 links 和 categoryLabel 函数，
 * 只负责登录态桥接，不做额外数据请求。
 */

import { useAuth } from "@/lib/use-auth";
import { LinkCard } from "@/app/feed/components/LinkCard";
import type { SharedLinkView, CategorySlug } from "@/app/feed/types";

interface FeedAuthWrapperProps {
  links: SharedLinkView[];
  /** 由 server 端传入的分类标签计算函数（已含 i18n 翻译） */
  getCategoryLabel: (slug: CategorySlug | null) => string;
}

export function FeedAuthWrapper({
  links,
  getCategoryLabel,
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
          categoryLabel={getCategoryLabel(link.category)}
          isLoggedIn={isLoggedIn}
        />
      ))}
    </ul>
  );
}
