"use client";

import { useCallback } from "react";

// 从 localStorage 安全读取 satoken。SSR 环境 / storage 禁用（Safari 隐私模式）均返回 null
function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("satoken");
  } catch {
    return null;
  }
}

/**
 * 向后端 /analytics/events 上报埋点事件。
 *
 * 历史：之前走 Next.js 路由 /api/analytics 做 Prisma 直写，占用 Vercel Fluid CPU；
 * 现改为走 next.config 的 /analytics/:path* rewrite 直接转发到 Java 后端，
 * Next 这一层只做 edge 代理不跑 function，CPU 用量显著降低。
 *
 * Header 约定：Java 后端 SaToken 读取 `satoken` header 识别登录用户，匿名也会放行。
 * 失败静默，不抛异常，不影响用户主流程。
 */
export async function trackEvent(
  eventType: string,
  eventData?: Record<string, unknown>,
): Promise<void> {
  try {
    const token = getStoredToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    // 登录用户附带 satoken，后端用它解析 userId；匿名时不加 header，后端按 userId=null 记录
    if (token) {
      headers["satoken"] = token;
    }

    await fetch("/analytics/events", {
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
