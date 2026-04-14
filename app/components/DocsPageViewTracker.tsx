"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * 文档页面访问埋点组件。
 *
 * 放在 app/docs/layout.tsx 下，pathname 变化时向自家 /api/analytics 上报一次 page_view，
 * 供将来基于 AnalyticsEvent 表做文档热度分析（当前 A-2 功能的热榜是用 GA4 数据，此处并行积累自家数据）。
 *
 * 去重策略：同一浏览器会话内同一 path 只报一次（sessionStorage key = "pv_reported:<path>"）。
 * 为什么用 sessionStorage 不用 localStorage：关闭标签页后应当算新会话，否则长期复访的用户会被严重低估。
 *
 * 无返回 UI（return null），仅作副作用组件使用。
 */
export function DocsPageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    // 同会话同 path 已上报则跳过，避免刷新/快速切换重复计数
    const key = `pv_reported:${pathname}`;
    if (sessionStorage.getItem(key)) return;

    sessionStorage.setItem(key, "1");

    // 如果用户登录了，带上 Sa-Token 让后端能把事件关联到 userId；匿名用户后端会写入 userId=null
    const token =
      typeof window !== "undefined" ? localStorage.getItem("satoken") : null;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["x-satoken"] = token;

    // 埋点失败静默吞掉：不能因为分析接口挂了影响文档页的正常阅读体验
    fetch("/api/analytics", {
      method: "POST",
      headers,
      body: JSON.stringify({
        eventType: "page_view",
        eventData: { path: pathname, title: document.title },
      }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
