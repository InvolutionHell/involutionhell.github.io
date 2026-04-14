"use client";

import { useReducer, useEffect } from "react";
import Link from "next/link";

type HotDoc = {
  path: string;
  title?: string;
  views: number;
};

type WindowParam = "7d" | "30d" | "all";

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ok"; docs: HotDoc[] };

type Action =
  | { type: "fetch" }
  | { type: "ok"; docs: HotDoc[] }
  | { type: "error" };

function reducer(_: State, action: Action): State {
  if (action.type === "fetch") return { status: "loading" };
  if (action.type === "ok") return { status: "ok", docs: action.docs };
  return { status: "error" };
}

// 默认走 Next.js rewrite 同源代理（见 next.config.mjs 的 /analytics/:path*），
// 若需要跨域直连后端（比如本地 Next.js 未启动但要用 curl/别的客户端测接口），
// 可设置 NEXT_PUBLIC_BACKEND_URL=http://localhost:8081 覆盖。
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

export function HotDocsTab({ initialWindow }: { initialWindow: WindowParam }) {
  const [windowParam, setWindowParam] = useReducer(
    (_: WindowParam, next: WindowParam) => next,
    initialWindow,
  );
  const [state, dispatch] = useReducer(reducer, { status: "loading" });

  useEffect(() => {
    dispatch({ type: "fetch" });
    let cancelled = false;
    fetch(`${BACKEND_URL}/analytics/top-docs?window=${windowParam}&limit=20`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<{
          success: boolean;
          data: HotDoc[];
        }>;
      })
      .then((body) => {
        if (!body.success) throw new Error();
        if (!cancelled) dispatch({ type: "ok", docs: body.data ?? [] });
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [windowParam]);

  const handleWindowChange = (w: WindowParam) => {
    setWindowParam(w);
    const url = new URL(globalThis.location.href);
    url.searchParams.set("window", w);
    globalThis.history.replaceState(null, "", url.toString());
  };

  const windowOptions: { label: string; value: WindowParam }[] = [
    { label: "7D", value: "7d" },
    { label: "30D", value: "30d" },
    { label: "ALL TIME", value: "all" },
  ];

  return (
    <div>
      {/* 窗口切换 */}
      <div className="flex gap-0 mb-8 border border-[var(--foreground)]">
        {windowOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleWindowChange(opt.value)}
            className={`flex-1 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
              windowParam === opt.value
                ? "bg-[var(--foreground)] text-[var(--background)]"
                : "bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--foreground)]/10"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 加载状态 */}
      {state.status === "loading" && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="border border-[var(--foreground)] p-4 animate-pulse bg-[var(--foreground)]/5 h-16"
            />
          ))}
        </div>
      )}

      {/* 错误状态 */}
      {state.status === "error" && (
        <div className="border border-[var(--foreground)] p-8 text-center">
          <p className="font-mono text-sm uppercase tracking-widest text-neutral-500">
            加载失败，请稍后重试
          </p>
        </div>
      )}

      {/* 空状态 */}
      {state.status === "ok" && state.docs.length === 0 && (
        <div className="border border-[var(--foreground)] p-8 text-center">
          <p className="font-mono text-sm uppercase tracking-widest text-neutral-500">
            数据积累中…
          </p>
        </div>
      )}

      {/* 列表 */}
      {state.status === "ok" && state.docs.length > 0 && (
        <div className="flex flex-col gap-3">
          {state.docs.map((doc, idx) => (
            <Link
              key={doc.path}
              href={doc.path}
              className="group w-full flex items-center gap-4 border border-[var(--foreground)] p-4 bg-[var(--background)] hard-shadow-hover transition-all"
            >
              <div className="font-mono text-2xl font-bold w-12 text-center text-[var(--foreground)] shrink-0">
                #{idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-serif text-xl font-bold text-[var(--foreground)] truncate group-hover:underline decoration-2 decoration-[#CC0000] underline-offset-4">
                  {doc.title || doc.path}
                </div>
                <div className="font-mono text-xs uppercase text-neutral-500 mt-1 truncate">
                  {doc.path}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-serif font-black text-2xl text-[#CC0000]">
                  {doc.views.toLocaleString()}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                  VIEWS
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
