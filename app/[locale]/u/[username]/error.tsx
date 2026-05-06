"use client";

// 个人主页路由的错误边界。
//
// 为什么要单独加这个文件：
// 原先 /u/[username] 的 SSR 抓取如果命中 Cloudflare 偶发 403 / 后端 5xx，
// 会直接冒泡到 Next 默认的全局错误页（"Application error: a server-side exception
// has occurred while loading involutionhell.com"），用户看到的是一堆 digest 没有
// 任何可操作的信息。这里给一个本地化的、带"重试"按钮的降级界面。
//
// 注意：
// - 必须是 client component（"use client"），因为需要 useEffect / onClick。
// - 不要依赖任何服务端 state，error 本身就是 SSR 失败的产物。
// - reset() 来自 Next，会尝试重新渲染该路由段（会重新触发 SSR fetch），适合瞬时抖动场景。

import Link from "next/link";
import { useEffect } from "react";

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 把 digest 和 message 打到浏览器控制台，方便用户把 digest 回贴给我们排查。
    // 服务端那份 stack 在 Vercel runtime logs 里（fetchProfile 里也已经记录）。
    console.error("[UserProfile error boundary]", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className="min-h-screen bg-[var(--background)] flex items-center justify-center px-6 py-24">
      <div className="max-w-xl w-full border border-[var(--foreground)] p-8 lg:p-12 flex flex-col gap-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#CC0000]">
          Profile · Temporary Failure
        </div>
        <h1 className="font-serif text-3xl md:text-4xl font-black uppercase tracking-tight text-[var(--foreground)]">
          个人主页暂时加载失败
        </h1>
        <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          服务端在拉取这个用户的资料时遇到了一次瞬时错误（可能是上游 CDN
          拦截或后端抖动）。通常重试一次就能恢复。
        </p>
        {error.digest ? (
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            Error digest: {error.digest}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={reset}
            className="font-mono text-xs uppercase tracking-widest px-4 py-2 border border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] hover:bg-[#CC0000] hover:border-[#CC0000] transition-colors"
          >
            重试
          </button>
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-widest px-4 py-2 border border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
          >
            返回首页
          </Link>
          <Link
            href="/rank"
            className="font-mono text-xs uppercase tracking-widest px-4 py-2 border border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
          >
            查看排行榜
          </Link>
        </div>
      </div>
    </main>
  );
}
