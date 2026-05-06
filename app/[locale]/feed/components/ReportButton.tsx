"use client";

/**
 * 举报按钮 + 举报 Dialog 组件。
 * - 未登录：点击时 toast 提示需要登录
 * - 已登录：弹出 Dialog，填写可选原因后提交 POST /api/community/links/{id}/report
 * 参照 Contribute.tsx 的 Dialog 模式实现。
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Flag } from "lucide-react";

interface ReportButtonProps {
  /** 被举报的链接 ID */
  linkId: number;
  /** 当前用户是否已登录（由父组件/页面传入，避免在每张卡片都重新请求 session） */
  isLoggedIn: boolean;
}

export function ReportButton({ linkId, isLoggedIn }: ReportButtonProps) {
  const t = useTranslations("feed.report");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false); // 举报成功后隐藏按钮

  /**
   * 未登录时点击举报，弹浏览器原生 alert（轻量，避免引入额外 toast provider 依赖）。
   * 后续如果需要引导跳登录页，可改成 router.push。
   */
  function handleUnauth(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation(); // 阻止冒泡，不触发整卡链接跳转
    alert(t("loginRequired"));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/community/links/${linkId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      if (res.ok) {
        setDone(true);
        setOpen(false);
        // 举报成功后短暂显示反馈——用 alert 保持轻量；后续可改 sonner toast
        alert(t("successToast"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  // 已举报成功，不再显示按钮
  if (done) return null;

  // 未登录：直接用普通按钮，点击触发提示
  if (!isLoggedIn) {
    return (
      <button
        onClick={handleUnauth}
        className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-neutral-400 hover:text-[#CC0000] transition-colors"
        aria-label={t("submitButton")}
      >
        <Flag className="h-3 w-3" />
        {t("submitButton")}
      </button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          // 阻止事件冒泡，避免触发整卡的 <a> 跳原文
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-neutral-400 hover:text-[#CC0000] transition-colors"
          aria-label={t("submitButton")}
        >
          <Flag className="h-3 w-3" />
          {t("submitButton")}
        </button>
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("reasonLabel")}</label>
          <textarea
            className="w-full border border-[var(--foreground)]/30 rounded-none p-2 text-sm resize-none h-24 focus:outline-none focus:border-[var(--foreground)] bg-[var(--background)] text-[var(--foreground)]"
            placeholder={t("reasonPlaceholder")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={200}
          />
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-none"
          >
            {t("submitButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
