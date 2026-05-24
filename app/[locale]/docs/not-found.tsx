"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/app/components/ui/button";

/**
 * /[locale]/docs/** 段专属 not-found。
 *
 * 行为：
 *   1. 用当前 pathname 查 /api/docs/resolve（后端走 doc_paths 历史表）
 *   2. 端点返回 301+Location → router.replace 到新 URL（自动补回 locale）
 *   3. 端点返回 404 / fetch 失败 / 超时 → 显示标准 404 UI
 *
 * 超时兜底 500ms：端点慢或挂了不让用户白屏等待。
 *
 * 防重定向环三层：
 *   - 前端层：location === strippedPath 时不跳（canonical 等于当前路径）
 *   - 端点层：canonical 来自 path_current，当前文件必然存在，正常不再触发 not-found
 *   - 超时层：500ms abort，异常直接降级 404
 */
export default function DocsNotFound() {
  const pathname = usePathname();
  const router = useRouter();
  const [showNotFound, setShowNotFound] = useState(false);
  // 防止 React StrictMode 双调用 useEffect 时发两次请求
  const didResolve = useRef(false);

  useEffect(() => {
    if (didResolve.current) return;
    didResolve.current = true;

    // 去掉 locale 前缀，把 /zh/docs/community/... 变成 /docs/community/...
    const strippedPath = pathname.replace(/^\/(zh|en)/, "");

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
      setShowNotFound(true);
    }, 500);

    fetch(`/api/docs/resolve?path=${encodeURIComponent(strippedPath)}`, {
      // manual 让我们自己处理 301，而不是浏览器自动跟随
      redirect: "manual",
      signal: controller.signal,
    })
      .then((res) => {
        clearTimeout(timeout);

        if (res.status === 301 || res.status === 308) {
          const location = res.headers.get("Location");
          if (location && location !== strippedPath) {
            // 拼回原始 locale，防止语言丢失
            const locale = pathname.startsWith("/en") ? "en" : "zh";
            // replace 而非 push：用户按后退不会回到 not-found 页
            router.replace(`/${locale}${location}`);
            return;
          }
        }
        // 其余情况（404、301 但 location 等于当前路径）→ 显示 404
        setShowNotFound(true);
      })
      .catch(() => {
        clearTimeout(timeout);
        // fetch 失败（abort、网络错误）→ 降级显示 404
        setShowNotFound(true);
      });

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [pathname, router]);

  // 查询中：轻量 skeleton，避免闪白屏
  if (!showNotFound) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="animate-pulse font-mono text-xs uppercase tracking-widest text-neutral-400">
          正在检索...
        </span>
      </div>
    );
  }

  // 真 404 UI —— 和根 not-found.tsx 视觉保持一致
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
      <div className="bg-[url('/cloud_2.png')] bg-cover bg-center absolute inset-0 opacity-10 pointer-events-none" />
      <div className="z-10 flex flex-col items-center space-y-6 text-center">
        <h1 className="text-9xl font-black italic tracking-tighter">404</h1>
        <h2 className="text-2xl font-bold uppercase tracking-widest">
          页面不存在 · Page not found
        </h2>
        <p className="max-w-md text-muted-foreground">
          你访问的页面可能已被移动或不存在。Try going back home.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/">返回首页 · Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
