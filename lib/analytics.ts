"use client";

import { useCallback } from "react";

// 从 localStorage 安全读取 satoken，SSR 环境直接返回 null
function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("satoken");
}

/**
 * 向后端 /api/analytics 发送埋点事件。
 * 失败静默，不抛异常，不影响用户主流程。
 */
export async function trackEvent(
  eventType: string,
  eventData?: Record<string, unknown>,
): Promise<void> {
  try {
    const token = getStoredToken();
    const headers: HeadersInit = { "Content-Type": "application/json" };
    // 携带 satoken 让服务端关联用户身份；匿名访问时 header 不传
    if (token) {
      headers["satoken"] = token;
    }

    await fetch("/api/analytics", {
      method: "POST",
      headers,
      body: JSON.stringify({ eventType, eventData: eventData ?? {} }),
    });
  } catch {
    // 埋点失败不影响用户操作，静默丢弃
  }
}

/**
 * 在客户端组件中使用的埋点 hook。
 * 返回 memoized 的 trackEvent，避免每次渲染都新建引用。
 */
export function useAnalytics() {
  const track = useCallback(
    (eventType: string, eventData?: Record<string, unknown>) =>
      trackEvent(eventType, eventData),
    [],
  );
  return { trackEvent: track };
}
