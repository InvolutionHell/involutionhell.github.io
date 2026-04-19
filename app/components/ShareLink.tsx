"use client";

/**
 * Hero 区的"分享链接"按钮。
 *
 * 视觉与 Contribute 主 CTA 完全同构，并排形成双投稿入口：
 * - Contribute → 正式投稿 Fumadocs 知识库（走 GitHub PR）
 * - ShareLink  → 随手丢一篇外部文章到社区分享墙（/feed/submit）
 *
 * 两者语义平级：都是"投稿"动作。对应的"阅读"入口在右侧 Join the Resistance
 * 卡片里（访问文章 / 看看最近在读），不放在 Hero 主 CTA 区，避免混淆。
 *
 * 之前本按钮跳 /feed 并带一个 "+" 徽章跳 /feed/submit——语义错位，已修正。
 */

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";

export function ShareLink() {
  const t = useTranslations("shareLink");

  return (
    <Link
      href="/feed/submit"
      className="inline-flex w-full sm:w-auto"
      data-umami-event="share_link_trigger"
      data-umami-event-location="hero"
    >
      <Button
        variant="hero"
        size="lg"
        className="relative isolate w-full sm:w-auto h-20 px-14 rounded-none
                   text-2xl font-serif font-black uppercase italic tracking-tighter
                   bg-[var(--foreground)] text-[var(--background)] border border-[var(--foreground)]
                   hover:bg-[var(--background)] hover:text-[var(--foreground)] transition-all duration-300"
      >
        <span className="relative z-10 flex items-center gap-4">
          <Link2 className="h-6 w-6" />
          <span>{t("button")}</span>
        </span>
      </Button>
    </Link>
  );
}
