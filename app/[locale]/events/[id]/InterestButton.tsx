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

import { useEffect, useRef, useState } from "react";
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
  // 失败提示（issue #302 P1-1）：之前 catch 静默吞错，乐观 UI 回滚后用户
  // 看到数字"动了一下又回去"以为按钮坏了。短暂展示一行红字 3 秒消失，
  // 与 SettingsForm 的 toast 思路一致但内联化（按钮位置紧凑，不强插全局 toast）
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 卸载时清掉 timer，避免对已 unmount 的组件 setState 报警
  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  function flashError(msg: string) {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    setErrorMsg(msg);
    errorTimerRef.current = setTimeout(() => setErrorMsg(null), 3000);
  }

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
    } catch (err) {
      // 回滚 + 显式 toast，避免静默吞错（issue #302 P1-1）
      setInterested(prevInterested);
      setCount(prevCount);
      flashError(err instanceof Error ? err.message : "操作失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
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
      {errorMsg && (
        <span
          role="alert"
          aria-live="polite"
          className="font-mono text-xs text-red-600 dark:text-red-400"
        >
          {errorMsg}
        </span>
      )}
    </div>
  );
}
