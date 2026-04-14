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
    // sessionStorage 可能因为存储禁用 / 配额超限 / Safari 隐私模式抛错；
    // 埋点的去重不能因此报错破坏导航，用 try/catch 降级到内存去重
    try {
      if (sessionStorage.getItem(dedupeKey)) return;
    } catch {
      // 读失败时跳过 session 去重，后面的内存去重仍然生效
    }
    // 内存去重：防止 React StrictMode 双重 effect 重复调用
    if (lastTrackedRef.current === pathname) return;

    lastTrackedRef.current = pathname;
    try {
      sessionStorage.setItem(dedupeKey, "1");
    } catch {
      // 写失败时下一个 session / 刷新会再报一次，可接受
    }

    trackEvent("page_view", {
      path: pathname,
      title: document.title,
    });
  }, [pathname]);

  return null;
}
