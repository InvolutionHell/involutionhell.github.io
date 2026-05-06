"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import type { HomepageEvent } from "@/lib/events-fetch";
import { cn } from "@/lib/utils";
import { X, ChevronDown, ChevronUp, ExternalLink, Play } from "lucide-react";
import styles from "./FloatWindow.module.css";

/**
 * FloatWindow - 复古报纸风格的活动预告悬浮窗。
 * 仅显示最新的一条活动，仅在首页（locale 段下的 /） 可见。
 *
 * 数据来源（i18n 改造收尾，2026-05）：
 *   - 之前由上游 Server Component（app/page.tsx）调 fetchHomepageEvents
 *     后通过 event prop 传入；这让首页变 ƒ Dynamic
 *   - 改为本组件自己 client fetch /api/public/homepage-events，首页可以
 *     SSG 静态化。组件仍然按"第一条未过期活动"的逻辑挑一条展示。
 */

export function FloatWindow() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [event, setEvent] = useState<HomepageEvent | null>(null);

  // 仅在首页（/zh、/en 或裸 /）可见。i18n 段化后 pathname 是 /<locale>。
  const isHomePage =
    pathname === "/" || pathname === "/zh" || pathname === "/en";

  useEffect(() => {
    if (!isHomePage) return;
    let cancelled = false;
    fetch("/api/public/homepage-events", { cache: "force-cache" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: HomepageEvent[]) => {
        if (cancelled) return;
        // 未过期的活动排前面（API 已排序），挑第一条非 deprecated
        const latest = data.find((e) => !e.deprecated) ?? null;
        setEvent(latest);
      })
      .catch(() => {
        // 静默失败：组件不显示比报错更友好
      });
    return () => {
      cancelled = true;
    };
  }, [isHomePage]);

  const handleDismiss = useCallback(() => setIsDismissed(true), []);
  const handleToggle = useCallback(() => setIsCollapsed((prev) => !prev), []);

  if (!isHomePage || isDismissed || !event || event.deprecated) return null;

  const currentEvent = event;

  return (
    <motion.div
      layout
      drag
      dragMomentum={false}
      whileDrag={{ cursor: "grabbing" }}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "fixed z-50 bottom-6 right-6",
        isCollapsed ? "w-auto" : "w-[280px]",
        "cursor-grab active:cursor-grabbing", // tailwind fallback cursor
      )}
      onPointerDown={(e) => e.stopPropagation()} // Prevent conflicts
    >
      <AnimatePresence mode="wait">
        {isCollapsed ? (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleToggle}
            className={cn(
              "group flex h-8 items-center gap-2 px-4",
              // Newsprint 风格：锐利边角，纯黑实线边框
              "bg-[#111111] text-[#F9F9F7] border border-[#111111]",
              "hover:bg-[#F9F9F7] hover:text-[#111111]", // 悬停时反色
              "font-mono text-xs uppercase tracking-widest",
              "transition-colors duration-200",
              "shadow-[4px_4px_0px_0px_#111111] hover:translate-x-[-1px] hover:translate-y-[-1px]",
            )}
          >
            <span className="w-2 h-2 bg-[#CC0000] animate-pulse" />
            <span className="font-bold">Latest</span>
            <ChevronUp className="w-3.5 h-3.5 shrink-0 group-hover:-translate-y-0.5 transition-transform" />
          </motion.button>
        ) : (
          /* 展开状态 - 报纸卡片 */
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              styles.newsprintTexture,
              styles.hardShadowHover,
              "relative border border-[#111111] dark:border-[#F9F9F7]", // 显式边框
              "flex flex-col",
            )}
          >
            {/* Header Bar */}
            <div className="flex h-8 items-center justify-between px-3 border-b border-[#111111] dark:border-[#F9F9F7] bg-[#111111] dark:bg-[#F9F9F7]">
              <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-[#F9F9F7] dark:text-[#111111]">
                The Daily Feed
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggle}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="text-[#F9F9F7] dark:text-[#111111] hover:text-[#CC0000] transition-colors"
                  aria-label="Minimize"
                >
                  <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                </button>
                <button
                  onClick={handleDismiss}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="text-[#F9F9F7] dark:text-[#111111] hover:text-[#CC0000] transition-colors"
                  aria-label="Close"
                >
                  <X className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-0">
              {/* 图片区域 - 默认为灰度（暗黑模式除外） */}
              {/*
                用原生 <img> 不走 next/image：活动后台允许管理员填外链封面 URL，
                next/image 需要提前把外链域名加到 next.config.mjs remotePatterns 白名单，
                否则运行时会 500，把 FloatWindow 整个挂掉。原生 <img> 只负责渲染，
                安全性由后端 EventRequest.coverUrl 做 URL scheme 校验承担。
                /events 列表页也是这个策略，保持一致。
              */}
              <div className="relative aspect-[16/9] border-b border-[#111111] dark:border-[#F9F9F7] overflow-hidden group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentEvent.coverUrl}
                  alt={currentEvent.name}
                  className="absolute inset-0 w-full h-full object-cover transition-all duration-500"
                  draggable={false}
                />
                {/* 突发新闻徽章 */}
                {!currentEvent.deprecated && (
                  <div className="absolute top-2 left-2 bg-[#CC0000] text-white px-2 py-0.5 text-[9px] font-mono tracking-widest uppercase font-bold">
                    Breaking
                  </div>
                )}
              </div>

              {/* 标题与描述 */}
              <div className="p-4 bg-transparent">
                <h4 className="font-serif text-lg font-bold leading-tight text-[#111111] dark:text-[#F9F9F7] mb-2">
                  {currentEvent.name}
                </h4>
                <p className="font-serif text-sm leading-relaxed text-[#111111]/80 dark:text-[#F9F9F7]/80 line-clamp-3 mb-4 text-justify">
                  {currentEvent.deprecated
                    ? "This event has concluded. View the archives for full coverage."
                    : "Join us for this significant community event. Detailed coverage inside."}
                </p>

                {/* 操作按钮 */}
                {currentEvent.deprecated && currentEvent.playback ? (
                  <a
                    href={currentEvent.playback}
                    target="_blank"
                    rel="noopener noreferrer"
                    onPointerDown={(e) => e.stopPropagation()}
                    className={cn(
                      "flex items-center justify-center gap-2 w-full px-4 py-2",
                      "border border-[#111111] dark:border-[#F9F9F7]",
                      "bg-transparent hover:bg-[#111111] hover:text-[#F9F9F7]",
                      "dark:hover:bg-[#F9F9F7] dark:hover:text-[#111111]",
                      "font-mono text-xs uppercase tracking-widest font-bold",
                      "transition-colors duration-200",
                    )}
                  >
                    <Play className="w-3 h-3" />
                    <span>Watch Replay</span>
                  </a>
                ) : (
                  <a
                    href={currentEvent.discord}
                    target="_blank"
                    rel="noopener noreferrer"
                    onPointerDown={(e) => e.stopPropagation()}
                    className={cn(
                      "flex items-center justify-center gap-2 w-full px-4 py-2",
                      "bg-[#111111] text-[#F9F9F7]",
                      "hover:bg-[#CC0000] hover:border-[#CC0000]",
                      "font-mono text-xs uppercase tracking-widest font-bold",
                      "transition-colors duration-200",
                    )}
                  >
                    <span>Read More</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default FloatWindow;
