"use client";

import { useEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";

/**
 * 文档页"复制链接"按钮。
 * 点击后将当前页 URL 写入剪贴板，同时触发 doc_share 埋点。
 */
export function DocShareButton() {
  const [copied, setCopied] = useState(false);
  // timer ref：每次新点击 / 组件卸载时清掉旧 timer，避免 setState on unmounted
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const handleCopy = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      // 旧 timer 先清掉，避免连点两次后提前恢复文案
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard 不可用时静默失败
    }

    // 埋点在复制动作发生后立即上报，不依赖 clipboard 是否成功
    trackEvent("doc_share", { path: window.location.pathname, url });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-2 px-3 py-1.5 font-mono text-xs uppercase tracking-widest border border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
      aria-label="复制页面链接"
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
        {/* link 图标 */}
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
      {copied ? "已复制" : "复制链接"}
    </button>
  );
}
