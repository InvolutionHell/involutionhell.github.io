"use client";

import { useEffect, useReducer } from "react";
import Image from "next/image";
import type { HistoryItem } from "@/app/types/docs-history";

// author 缺失时用 1x1 透明占位图，避免 <Image> 收到空 src 报错
const FALLBACK_AVATAR =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><rect width='24' height='24' fill='%23e5e7eb'/></svg>";

interface DocHistoryPanelProps {
  path: string;
}

// 将 items / error / loading 合并成一个 discriminated union，
// 避免 effect 里多次同步 setState 触发 react-hooks/set-state-in-effect
// 同时天然保证三种状态互斥（不会同时出现"错误提示 + 旧列表"）
type State =
  | { status: "loading" }
  | { status: "ok"; items: HistoryItem[] }
  | { status: "error"; message: string };

type Action =
  | { type: "fetch" }
  | { type: "ok"; items: HistoryItem[] }
  | { type: "error"; message: string };

function reducer(_: State, action: Action): State {
  if (action.type === "fetch") return { status: "loading" };
  if (action.type === "ok") return { status: "ok", items: action.items };
  return { status: "error", message: action.message };
}

// 将 ISO 日期转为相对时间描述（中文）
function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} 个月前`;
  return `${Math.floor(months / 12)} 年前`;
}

// 骨架屏占位行
function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-2.5 animate-pulse">
      <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 shrink-0" />
      <div className="flex-1 flex flex-col gap-1">
        <div className="h-3 w-2/3 rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-2.5 w-1/3 rounded bg-neutral-100 dark:bg-neutral-800" />
      </div>
    </div>
  );
}

export function DocHistoryPanel({ path }: DocHistoryPanelProps) {
  const [state, dispatch] = useReducer(reducer, { status: "loading" });

  useEffect(() => {
    // 用 dispatch 而不是多次 setState，规避 react-hooks/set-state-in-effect lint；
    // path 变化时立刻回到 loading，避免"错误提示 + 旧列表"并存
    dispatch({ type: "fetch" });
    let cancelled = false;
    fetch(`/api/docs/history?path=${encodeURIComponent(path)}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json.success) {
          dispatch({ type: "ok", items: json.data ?? [] });
        } else {
          dispatch({
            type: "error",
            message: json.error ?? "无法加载历史",
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          dispatch({ type: "error", message: "无法加载历史" });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return (
    <div className="font-serif">
      {/* 报纸风格标题 */}
      <h2 className="text-xs font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-3 border-b border-neutral-200 dark:border-neutral-700 pb-2">
        最近更新
      </h2>

      {/* 加载中 */}
      {state.status === "loading" && (
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}

      {/* 错误 */}
      {state.status === "error" && (
        <p className="text-xs font-mono text-neutral-400 dark:text-neutral-500 py-2">
          {state.message}
        </p>
      )}

      {/* 空结果 */}
      {state.status === "ok" && state.items.length === 0 && (
        <p className="text-xs font-mono text-neutral-400 dark:text-neutral-500 py-2">
          暂无更新记录
        </p>
      )}

      {/* 历史列表 */}
      {state.status === "ok" && state.items.length > 0 && (
        <ol className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {state.items.map((item) => (
            <li key={item.sha}>
              <a
                href={item.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 py-2.5 group hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded transition-colors px-1 -mx-1"
              >
                {/* 头像 */}
                <Image
                  src={item.avatarUrl || FALLBACK_AVATAR}
                  alt={item.authorLogin}
                  width={24}
                  height={24}
                  className="rounded-full mt-0.5 shrink-0"
                  unoptimized
                />

                <div className="flex-1 min-w-0">
                  {/* commit message，截断超长内容 */}
                  <p className="text-sm leading-snug text-neutral-800 dark:text-neutral-200 truncate group-hover:text-[#CC0000] transition-colors">
                    {item.message}
                  </p>
                  {/* 作者 + 时间，monospace 风格 */}
                  <p className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500 mt-0.5">
                    {item.authorName}
                    <span className="mx-1 opacity-40">·</span>
                    {relativeTime(item.date)}
                  </p>
                </div>
              </a>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
