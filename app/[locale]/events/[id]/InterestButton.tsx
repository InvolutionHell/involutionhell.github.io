"use client";

/**
 * 活动详情页的"感兴趣"按钮（Client Component）。
 *
 * 行为：
 * - 未登录：显示"登录后感兴趣"，点击跳 /login
 * - 登录：按当前 interested 状态显示切换按钮，乐观更新 count
 * - 后端幂等接口 POST/DELETE /api/events/{id}/interest，返回新 count，以后端为准
 *
 * 不做 SWR 集成：交互简单（只关心自己的点击），直接 useState + fetch 更直白
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/use-auth";

interface Props {
  eventId: number;
  initialCount: number;
  initialInterested: boolean;
}

interface InterestResponse {
  success: boolean;
  data?: { count: number; interested: boolean };
  message?: string;
}

export function InterestButton({
  eventId,
  initialCount,
  initialInterested,
}: Props) {
  const { status } = useAuth();
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [interested, setInterested] = useState(initialInterested);
  const [loading, setLoading] = useState(false);

  if (status === "unauthenticated") {
    return (
      <button
        type="button"
        onClick={() => router.push("/login")}
        className="font-mono text-xs uppercase tracking-widest px-4 py-2 border border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
      >
        登录后标记感兴趣 · {count}
      </button>
    );
  }

  const toggle = async () => {
    if (loading || status !== "authenticated") return;
    setLoading(true);

    // 乐观更新：立刻切换 UI，失败再回滚
    const prevInterested = interested;
    const prevCount = count;
    const nextInterested = !prevInterested;
    setInterested(nextInterested);
    setCount((c) => c + (nextInterested ? 1 : -1));

    try {
      const token = localStorage.getItem("satoken");
      const res = await fetch(`/api/events/${eventId}/interest`, {
        method: nextInterested ? "POST" : "DELETE",
        headers: token ? { satoken: token } : {},
      });
      const json = (await res.json()) as InterestResponse;
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.message ?? "操作失败");
      }
      // 用后端返回的权威值覆盖乐观值，避免竞争
      setCount(json.data.count);
      setInterested(json.data.interested);
    } catch {
      // 回滚
      setInterested(prevInterested);
      setCount(prevCount);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={loading}
      onClick={toggle}
      className={`font-mono text-xs uppercase tracking-widest px-4 py-2 border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        interested
          ? "border-[#CC0000] bg-[#CC0000] text-white hover:bg-transparent hover:text-[#CC0000]"
          : "border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)]"
      }`}
    >
      {interested ? "已标记 · " : "感兴趣 · "}
      {count}
    </button>
  );
}
