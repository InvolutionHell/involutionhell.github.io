"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

/**
 * 文档页 PV 埋点组件。
 * 挂载在 docs layout 下，监听路由变化上报 page_view 事件。
 * 用 sessionStorage 去重：同一 session 内同一路径只上报一次。
 */
export function DocsPageViewTracker() {
  const pathname = usePathname();
  // 记录上次上报的路径，避免 StrictMode 下双渲染重复发送
  const lastTrackedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    const dedupeKey = `pv:${pathname}`;
    // sessionStorage 去重：同一 session 内同一路径不重复上报
    try {
      if (sessionStorage.getItem(dedupeKey)) return;
      // 内存去重：防止 React StrictMode 双重 effect 重复调用
      if (lastTrackedRef.current === pathname) return;

      lastTrackedRef.current = pathname;
      sessionStorage.setItem(dedupeKey, "1");
    } catch {
      // storage 不可用，继续上报（放弃去重）
    }

    trackEvent("page_view", {
      path: pathname,
      title: document.title,
    });
  }, [pathname]);

  return null;
}
