"use client";

/**
 * /share — 极简快速分享入口。
 *
 * 设计目标：
 *   - **短路径**：方便口头传播（"去 involutionhell.com/share 丢链接"）
 *   - **极简 UI**：无 Header / Footer，单页居中卡片 + 一个 URL 输入 + 一个按钮
 *   - **支持预填**：`/share?url=<外站 URL>&text=<推荐语>`，配合浏览器书签脚本（bookmarklet）
 *     或微信分享菜单跳转使用
 *   - **成功后停留不跳**：展示"再来一条 / 看看大家分享了啥"两个入口
 *
 * 典型使用姿势：
 *   1. 群里发 "好文章丢这里 → involutionhell.com/share?url=https%3A%2F%2Fmp.weixin.qq.com%2F..."
 *   2. 浏览器书签栏添加：
 *      javascript:location.href='https://involutionhell.com/share?url='+encodeURIComponent(location.href)
 *      任何网页一点书签跳过来预填。
 *
 * 与 /feed/submit 的区别：后者是完整站点布局下的提交页；本页去除了所有导航，
 * 专门给"点击即分享"场景用。两者调同一个后端 POST /api/community/links。
 */

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link2, CheckCircle2 } from "lucide-react";

// 内层组件：读 searchParams 需要 Suspense 边界（Next 15+ 要求）
function ShareInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, status } = useAuth();

  // 从 URL 预填：?url=... / ?text=...（decodeURIComponent 由 URL 构造器负责）
  const prefillUrl = searchParams.get("url") ?? "";
  const prefillText = searchParams.get("text") ?? "";

  const [url, setUrl] = useState(prefillUrl);
  const [recommendation, setRecommendation] = useState(prefillText);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 成功后停留在本页展示感谢卡片，而非跳走——方便连续分享
  const [succeeded, setSucceeded] = useState(false);

  // 未登录：带 next 跳登录，回跳后保留原始 url/text query 以免用户重新粘贴
  useEffect(() => {
    if (status !== "unauthenticated") return;
    const currentQs = new URLSearchParams();
    if (prefillUrl) currentQs.set("url", prefillUrl);
    if (prefillText) currentQs.set("text", prefillText);
    const back = `/share${currentQs.toString() ? "?" + currentQs.toString() : ""}`;
    router.replace(`/login?next=${encodeURIComponent(back)}`);
  }, [status, router, prefillUrl, prefillText]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setSubmitting(true);
    setError(null);

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15_000);

    try {
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
        setSucceeded(true);
        setUrl("");
        setRecommendation("");
      } else {
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

  // 认证加载中：骨架占位
  if (status === "loading") {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-neutral-100 dark:bg-neutral-900 rounded" />
        <div className="h-12 bg-neutral-100 dark:bg-neutral-900 rounded" />
        <div className="h-24 bg-neutral-100 dark:bg-neutral-900 rounded" />
      </div>
    );
  }

  // 未登录：等待 effect 跳转，不渲染内容
  if (status === "unauthenticated") return null;

  // 成功卡片：突出"再来一条"，让连续分享 1 次点击完成
  if (succeeded) {
    return (
      <div className="space-y-6 text-center">
        <CheckCircle2
          className="mx-auto h-16 w-16 text-emerald-600"
          strokeWidth={1.5}
        />
        <div>
          <h2 className="font-serif text-3xl font-black uppercase tracking-tight">
            已丢进漩涡
          </h2>
          <p className="mt-2 text-sm text-neutral-500">
            AI 正在审核分类，通过后会出现在社区分享墙。
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            type="button"
            onClick={() => {
              setSucceeded(false);
              setError(null);
            }}
            className="rounded-none bg-[var(--foreground)] text-[var(--background)] hover:bg-[var(--background)] hover:text-[var(--foreground)] border border-[var(--foreground)] font-mono uppercase tracking-widest"
          >
            再来一条
          </Button>
          <Link
            href="/feed"
            className="inline-flex items-center justify-center px-6 py-2 rounded-none border border-[var(--foreground)] font-mono uppercase tracking-widest text-xs hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
          >
            去看看大家分享了啥 →
          </Link>
          {user?.username && (
            <Link
              href={`/u/${user.username}/shares`}
              className="inline-flex items-center justify-center px-6 py-2 rounded-none font-mono uppercase tracking-widest text-xs text-neutral-500 hover:text-[var(--foreground)]"
            >
              我的分享
            </Link>
          )}
        </div>
      </div>
    );
  }

  // 主表单
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center space-y-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500">
          Involution Hell · Quick Share
        </div>
        <h1 className="font-serif text-3xl md:text-4xl font-black uppercase tracking-tight inline-flex items-center gap-3">
          <Link2 className="h-7 w-7" strokeWidth={2.5} />
          丢个链接
        </h1>
        <p className="text-xs text-neutral-500">
          粘 URL + 一句话推荐，AI 会审核并分类到社区分享墙。
        </p>
      </div>

      <div className="space-y-2">
        <label className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
          文章链接
        </label>
        <Input
          type="url"
          required
          autoFocus
          placeholder="https://mp.weixin.qq.com/s/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="rounded-none border-[var(--foreground)] font-mono text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
          一句话推荐（选填，≤200 字）
        </label>
        <textarea
          placeholder="为什么推荐这篇？"
          value={recommendation}
          onChange={(e) => {
            if (e.target.value.length <= 200) setRecommendation(e.target.value);
          }}
          maxLength={200}
          rows={3}
          className="w-full rounded-none border border-[var(--foreground)] bg-transparent px-3 py-2 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[var(--foreground)]"
        />
      </div>

      {error && (
        <p className="text-sm text-[#CC0000] font-mono text-center">{error}</p>
      )}

      <Button
        type="submit"
        disabled={submitting || !url.trim()}
        className="w-full h-14 rounded-none bg-[var(--foreground)] text-[var(--background)] hover:bg-[var(--background)] hover:text-[var(--foreground)] border border-[var(--foreground)] font-serif text-lg uppercase italic tracking-tighter disabled:opacity-40"
      >
        {submitting ? "提交中..." : "分享"}
      </Button>

      <div className="text-center">
        <Link
          href="/feed"
          className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 hover:text-[var(--foreground)]"
        >
          跳过，去看看大家分享了啥 →
        </Link>
      </div>
    </form>
  );
}

export default function SharePage() {
  // 全屏居中卡片；刻意不套 Header / Footer，保持"一屏点击即用"
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
      <div className="w-full max-w-md border border-[var(--foreground)] p-6 md:p-10 bg-[var(--background)]">
        <Suspense
          fallback={
            <div className="h-8 bg-neutral-100 dark:bg-neutral-900 animate-pulse rounded" />
          }
        >
          <ShareInner />
        </Suspense>
      </div>
    </main>
  );
}
