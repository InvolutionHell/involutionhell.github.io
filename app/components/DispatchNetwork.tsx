import Link from "next/link";
import { Github as GithubIcon } from "./icons/Github";
import { MessageCircle, BookMarked, ArrowRight } from "lucide-react";

/**
 * DispatchNetwork — 主页 Top Rank 之后的极简网络入口横条
 * 替代原先 Features（口号四格）+ Community（链接三卡）两个 section
 * 设计意图：报纸末版的"发行网络"小栏，48px 高横条，不重复 Footer
 */
export function DispatchNetwork() {
  return (
    <section
      id="community"
      className="border-t-4 border-[var(--foreground)] bg-[var(--background)]"
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between gap-4 py-3 font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--foreground)] md:text-xs">
          {/* 左：栏目标签 */}
          <span className="font-bold whitespace-nowrap">
            Dispatch Network
            <span className="mx-2 hidden text-neutral-400 md:inline">·</span>
            <span className="hidden font-normal text-neutral-500 md:inline">
              Sec. Net-01
            </span>
          </span>

          {/* 中：三个外链 */}
          <nav className="flex items-center gap-3 md:gap-6">
            <Link
              href="https://github.com/involutionhell"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-[#CC0000] transition-colors"
              data-umami-event="social_click"
              data-umami-event-platform="github"
              data-umami-event-location="dispatch_network"
            >
              <GithubIcon className="h-3.5 w-3.5" />
              <span>GitHub</span>
            </Link>
            <span className="text-neutral-400">·</span>
            <Link
              href="https://discord.com/invite/6CGP73ZWbD"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-[#CC0000] transition-colors"
              data-umami-event="social_click"
              data-umami-event-platform="discord"
              data-umami-event-location="dispatch_network"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>Discord</span>
            </Link>
            <span className="text-neutral-400">·</span>
            <Link
              href="https://www.zotero.org/groups/6053219/involution_hell"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-[#CC0000] transition-colors"
              data-umami-event="social_click"
              data-umami-event-platform="zotero"
              data-umami-event-location="dispatch_network"
            >
              <BookMarked className="h-3.5 w-3.5" />
              <span>Zotero</span>
            </Link>
          </nav>

          {/* 右：加入 CTA */}
          <Link
            href="https://discord.com/invite/6CGP73ZWbD"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-bold whitespace-nowrap hover:text-[#CC0000] transition-colors"
            data-umami-event="cta_click"
            data-umami-event-label="join_dispatch"
          >
            <span className="hidden sm:inline">Join</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
