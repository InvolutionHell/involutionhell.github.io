"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type Outpost = {
  key: string;
  callsign: string;
  title: string;
  desc: string;
  href: string;
  live?: boolean;
};

/**
 * 首页"社区网络"版块：三个生态前哨（monitor / mc / openInvest）做成全宽波段，
 * 滚动进入视口时错峰升起，hover 时墨色从左漫过整条（反色 wipe）。
 * SSR/无 JS/reduced-motion 时直接渲染可见状态（mounted 门控），不把内容藏死。
 */
export function CommunityNetwork({
  label,
  outposts,
}: {
  label: string;
  outposts: Outpost[];
}) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const animate = mounted && !reduce;

  return (
    <div className="mt-16 border-t-4 border-[var(--foreground)] transition-colors duration-300">
      <div className="flex items-center gap-2 py-4 font-mono text-xs uppercase tracking-widest border-b border-[var(--foreground)] text-[var(--foreground)]">
        <Image
          src="/friends/ailumao.png"
          alt=""
          width={22}
          height={22}
          className="[image-rendering:pixelated]"
        />
        {label}
      </div>

      <ul>
        {outposts.map((o, i) => (
          <motion.li
            key={o.key}
            initial={animate ? { opacity: 0, y: 26 } : false}
            whileInView={animate ? { opacity: 1, y: 0 } : undefined}
            viewport={{ once: true, amount: 0.4 }}
            transition={{
              duration: 0.55,
              delay: i * 0.12,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={cn(
              "group relative overflow-hidden border-[var(--foreground)]",
              i < outposts.length - 1 && "border-b",
            )}
          >
            {/* 墨色 wipe 层：hover 时从左漫满整条 */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 origin-left scale-x-0 bg-[var(--foreground)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100 motion-reduce:transition-none"
            />

            <a
              href={o.href}
              target="_blank"
              rel="noopener noreferrer"
              className="relative flex flex-col gap-3 py-9 px-6 transition-colors duration-500 group-hover:text-[var(--background)] md:flex-row md:items-center md:gap-8"
              data-umami-event="community_click"
              data-umami-event-target={o.key}
              data-umami-event-location="hero"
            >
              {/* 呼号 */}
              <span className="flex w-28 shrink-0 items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-400 group-hover:text-[var(--background)]">
                {o.live && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#CC0000] opacity-75 motion-reduce:hidden" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#CC0000]" />
                  </span>
                )}
                {o.callsign}
              </span>

              {/* 站名（超大衬线，编辑体信号） */}
              <span className="font-serif text-3xl font-bold uppercase leading-none tracking-tight text-[var(--foreground)] group-hover:text-[var(--background)] md:text-4xl">
                {o.title}
              </span>

              {/* 描述 */}
              <span className="font-body text-sm leading-relaxed text-neutral-600 group-hover:text-[var(--background)] dark:text-neutral-300 md:ml-auto md:max-w-xs md:text-right">
                {o.desc}
              </span>

              <ArrowUpRight className="hidden h-6 w-6 shrink-0 text-neutral-400 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-[var(--background)] md:block" />
            </a>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
