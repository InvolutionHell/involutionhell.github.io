"use client";

/**
 * Hero 区的"分享链接"按钮。
 *
 * 视觉与样式**完全复制** Contribute 主 CTA，和它并排形成双 CTA：
 * - Contribute → 正式投稿 Fumadocs 知识库（走 GitHub PR）
 * - ShareLink  → 随手分享公众号/知乎等文章到社区墙（/feed）
 *
 * 两者语义平级，视觉也平级——这是用户拍板的设计（之前尝试的次级文字链 UI 不够突出）。
 * 按钮点击跳 /feed（先看一眼再决定是否提交），右上角徽章保留与 Contribute 对称的图标位。
 */

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link2, Plus } from "lucide-react";

export function ShareLink() {
  const t = useTranslations("shareLink");

  return (
    <div className="relative inline-flex w-full sm:w-auto">
      {/* 主按钮跳 /feed（社区分享墙），样式与 Contribute 主按钮完全同构 */}
      <Link
        href="/feed"
        className="w-full sm:w-auto"
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
      {/* 右上角徽章：跳 /feed/submit 直接开提交表单，对应 Contribute 的指南 "?" 徽章 */}
      <Link
        href="/feed/submit"
        aria-label={t("submitAriaLabel")}
        title={t("submitAriaLabel")}
        className="absolute top-0 right-0 flex h-10 w-10 translate-x-1/2 -translate-y-1/2 items-center justify-center border border-[var(--foreground)] bg-[var(--background)] text-[var(--foreground)] font-mono hover:bg-[#CC0000] hover:text-white transition-colors z-20"
        data-umami-event="share_link_submit_shortcut"
      >
        <Plus className="h-4 w-4" strokeWidth={3} />
        <span className="sr-only">{t("submitAriaLabel")}</span>
      </Link>
    </div>
  );
}
