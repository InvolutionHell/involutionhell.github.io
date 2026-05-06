"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { HomepageEvent } from "@/lib/events-fetch";

/**
 * 首页顶部活动轮播。
 *
 * 数据源：后端 /api/events（管理员在 /admin/events 维护）。
 *
 * 为什么是 Client Component（i18n 改造收尾，2026-05）：
 *   原来是 async server component，server fetch 让首页 page.tsx 整页变 ƒ
 *   Dynamic（任何 server fetch 都阻挡 SSG）。改 client + 自家 ISR 代理后：
 *   - 首页 page.tsx 可以纯静态预渲染，Vercel CPU 归零
 *   - 数据走 /api/public/homepage-events（revalidate=300，5min 缓存）
 *   - 浏览器拿到 304 命中本地缓存，不打 Vercel Function
 *   - 首屏没有 ticker（events 还在 fetch），hydrate 后出现，不影响 LCP
 *     （ticker 不是 LCP 元素）
 */

const MAX_ITEMS = 3;
const ROTATION_MS = 8000;

type ActivityTickerProps = {
  className?: string;
};

export function ActivityTicker({ className }: ActivityTickerProps) {
  const [events, setEvents] = useState<HomepageEvent[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/homepage-events", { cache: "force-cache" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: HomepageEvent[]) => {
        if (!cancelled) setEvents(data.slice(0, MAX_ITEMS));
      })
      .catch(() => {
        // 静默失败：ticker 不显示比报错更友好
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (events.length === 0) return null;

  const animationDurationMs = ROTATION_MS * Math.max(events.length, 1);
  const lastEventIndex = events.length - 1;

  return (
    <div
      className={cn(
        "ticker flex items-center w-full h-8 overflow-hidden",
        className,
      )}
    >
      <div
        className="ticker-track items-center"
        style={{ animationDuration: `${animationDurationMs}ms` }}
      >
        <div className="flex items-center gap-6 pr-6 shrink-0">
          {events.map((event, idx) => (
            <TickerItem
              key={`primary-${event.name}-${idx}`}
              event={event}
              isLast={idx === lastEventIndex}
            />
          ))}
        </div>
        <div
          className="flex items-center gap-6 pr-6 shrink-0"
          aria-hidden="true"
        >
          {events.map((event, idx) => (
            <TickerItem
              key={`secondary-${event.name}-${idx}`}
              event={event}
              isLast={idx === lastEventIndex}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TickerItem({
  event,
  isLast,
}: {
  event: HomepageEvent;
  isLast: boolean;
}) {
  // 轮播点击始终跳站内详情页（后端必然返回带 id 的 EventView）
  const href = `/events/${event.id}`;
  const linkLabel = `${event.name} — ${event.deprecated ? "Archives Available" : "Event Active"}`;
  const linkClass =
    "font-sans text-xs font-bold uppercase tracking-widest hover:text-[#CC0000]";

  return (
    <div className="flex items-center gap-4 whitespace-nowrap">
      {isLast ? (
        <span className="bg-[#CC0000] text-white px-2 py-0.5 font-mono text-[10px] uppercase tracking-tighter shrink-0">
          Update
        </span>
      ) : null}
      {/* 站内链接：用 next/link 保留 client-side navigation + prefetch */}
      <Link href={href} className={linkClass}>
        {linkLabel}
      </Link>
      <span className="text-neutral-400 font-mono text-[10px]">&bull;</span>
      <span className="font-mono text-[10px] text-neutral-500 uppercase">
        Edition 1.0.0
      </span>
    </div>
  );
}
