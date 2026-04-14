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
 * 向 Next.js 内置 /api/analytics 发送埋点事件。
 * 失败静默，不抛异常，不影响用户主流程。
 *
 * Header 命名注意：/api/analytics 的 resolveUserId 从 `x-satoken` 读取 token（见 lib/server-auth.ts），
 * 然后在内部再以 `satoken` header 转发给后端 /auth/me 验证。所以客户端 → Next 这一跳必须用 `x-satoken`，
 * 否则 userId 永远解析不到，埋点记录的 uniqueUsers 会恒为 0。
 */
export async function trackEvent(
  eventType: string,
  eventData?: Record<string, unknown>,
): Promise<void> {
  try {
    const token = getStoredToken();
    // 用 Record<string, string> 而不是 HeadersInit（联合类型），保证可变 + 类型安全
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    // 客户端 → Next 路由必须用 x-satoken（见上方注释）
    if (token) {
      headers["x-satoken"] = token;
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
