"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics";

/**
 * 文档页"复制链接"按钮。
 * 点击后将当前页 URL 写入剪贴板，同时触发 doc_share 埋点。
 */
export function DocShareButton() {
  const [copied, setCopied] = useState(false);
  const t = useTranslations("docShare");
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const handleCopy = async () => {
    // 用户点"复制链接"必然是要发到外面（DC/微信/X）
    // 给链接打上 UTM，回流时能在 GA Source 维度看到 doc_share，区别于 (direct)
    const target = new URL(window.location.href);
    target.searchParams.set("utm_source", "doc_share");
    target.searchParams.set("utm_medium", "user_share");
    const url = target.toString();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard 不可用时静默失败
    }

    trackEvent("doc_share", { path: window.location.pathname, url });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-2 px-3 py-1.5 font-mono text-xs uppercase tracking-widest border border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
      aria-label={t("ariaLabel")}
    >
      <svg
        aria-hidden="true"
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
      {copied ? t("copied") : t("copy")}
    </button>
  );
}
