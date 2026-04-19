"use client";

/**
 * /feed/submit 提交页。
 *
 * - 需要登录：未登录自动跳 /login?next=/feed/submit
 * - 表单：URL（必填）+ 推荐语 textarea（选填，max 200 字）
 * - 提交成功 toast 后跳转 /u/[userId]/shares（M8 负责实现，当前可能 404，可接受）
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SubmitPage() {
  const t = useTranslations("feed.submit");
  const { user, status } = useAuth();
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 登录态守卫：认证状态确认为未登录时跳登录页。
   * status === "loading" 阶段不跳，避免误判（localStorage 读取有延迟）。
   */
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?next=/feed/submit");
    }
  }, [status, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setSubmitting(true);
    setError(null);

    // 15s 超时保护，避免 fetch 永远 hang 卡在 "提交中..."
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15_000);

    try {
      // satoken 从 localStorage 读取，随请求头发送（与其他需鉴权的接口一致）
      const token =
        typeof window !== "undefined" ? localStorage.getItem("satoken") : null;

      const res = await fetch("/api/community/links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { satoken: token } : {}),
        },
        body: JSON.stringify({
          url: url.trim(),
          recommendation: recommendation.trim() || undefined,
        }),
        signal: ctrl.signal,
      });

      if (res.ok) {
        // 提交成功：toast 反馈 + 跳用户分享列表页
        // 使用 alert 保持轻量（与 ReportButton 一致，无额外 toast provider 依赖）
        alert(t("successToast"));
        // 路由 param 是 [username] 不是 id，必须用 user.username 而不是 user.id
        if (user?.username) {
          router.push(`/u/${user.username}/shares`);
        } else {
          router.push("/feed");
        }
      } else {
        // 解析后端错误消息
        const body = await res.json().catch(() => ({}));
        setError(
          (body as { message?: string }).message ??
            `提交失败（HTTP ${res.status}）`,
        );
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setError("请求超时（15 秒未响应），请稍后重试");
      } else {
        setError("网络错误，请稍后重试");
      }
    } finally {
      clearTimeout(timer);
      setSubmitting(false);
    }
  }

  // 认证加载中：渲染骨架避免布局跳动
  if (status === "loading") {
    return (
      <main className="pt-32 pb-16 bg-[var(--background)] min-h-screen">
        <div className="max-w-xl mx-auto px-6 lg:px-8 animate-pulse">
          <div className="h-8 bg-neutral-100 dark:bg-neutral-900 rounded mb-4" />
          <div className="h-4 bg-neutral-100 dark:bg-neutral-900 rounded w-2/3" />
        </div>
      </main>
    );
  }

  // 未登录：等待 useEffect 跳转（渲染空内容避免闪烁）
  if (status === "unauthenticated") {
    return null;
  }

  return (
    <main className="pt-32 pb-16 bg-[var(--background)] min-h-screen">
      <div className="max-w-xl mx-auto px-6 lg:px-8">
        {/* 页头 */}
        <header className="border-t-4 border-[var(--foreground)] pt-6 mb-10">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500">
            Community · Feed · Submit
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-black uppercase mt-2 tracking-tight text-[var(--foreground)]">
            {t("title")}
          </h1>
        </header>

        {/* 提交表单 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* URL 输入 */}
          <div className="space-y-2">
            <Label
              htmlFor="url"
              className="font-mono text-xs uppercase tracking-widest"
            >
              {t("urlLabel")}
            </Label>
            <Input
              id="url"
              type="url"
              placeholder={t("urlPlaceholder")}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="rounded-none border-[var(--foreground)] focus-visible:ring-0 focus-visible:border-[var(--foreground)] bg-[var(--background)] text-[var(--foreground)]"
            />
          </div>

          {/* 推荐语 textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="recommendation"
                className="font-mono text-xs uppercase tracking-widest"
              >
                {t("recommendationLabel")}
              </Label>
              {/* 字数计数 */}
              <span className="font-mono text-[10px] text-neutral-400">
                {t("charCount", { count: recommendation.length })}
              </span>
            </div>
            <textarea
              id="recommendation"
              className="w-full border border-[var(--foreground)] p-3 text-sm resize-none h-28 focus:outline-none focus:border-[var(--foreground)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-neutral-400"
              placeholder={t("recommendationPlaceholder")}
              value={recommendation}
              onChange={(e) => {
                // 限制最多 200 字
                if (e.target.value.length <= 200) {
                  setRecommendation(e.target.value);
                }
              }}
              maxLength={200}
            />
          </div>

          {/* 错误提示 */}
          {error && <p className="text-sm text-[#CC0000] font-mono">{error}</p>}

          {/* 提交按钮 */}
          <div className="flex items-center gap-4">
            <Button
              type="submit"
              disabled={submitting || !url.trim()}
              className="rounded-none px-8 py-3 font-sans text-xs uppercase tracking-widest font-bold bg-[var(--foreground)] text-[var(--background)] hover:bg-[var(--background)] hover:text-[var(--foreground)] border border-[var(--foreground)] transition-all duration-200 h-auto disabled:opacity-40"
            >
              {submitting ? t("submitting") : t("submitButton")}
            </Button>
            <button
              type="button"
              onClick={() => router.back()}
              className="font-mono text-xs uppercase tracking-widest text-neutral-500 hover:text-[var(--foreground)] transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
