import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { Github as GithubIcon } from "./icons/Github";
import { AuthNav } from "./AuthNav";
import { BrandMark } from "./BrandMark";
import { LiveEditionLabel } from "./LiveEditionLabel";

// 改为普通服务端组件，登录状态由客户端 AuthNav 处理
export function Header() {
  const now = new Date();
  const editionTimestampMs = now.getTime();
  // 使用 UTC 时区格式化日期，保证服务端渲染结果与客户端一致
  const formattedDate = now.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Australia/Sydney",
  });
  return (
    <header className="fixed top-0 w-full z-50 bg-[var(--background)] border-b border-[var(--foreground)] py-2 transition-colors duration-300">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between border-b border-[var(--foreground)] pb-2 mb-2 transition-colors duration-300">
          <LiveEditionLabel initialTimestamp={editionTimestampMs} />
          <BrandMark priority />
          <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            {formattedDate}
          </div>
        </div>

        <div className="flex items-center justify-between h-10">
          <nav className="hidden md:flex items-center gap-8 font-sans text-xs font-bold uppercase tracking-widest text-[var(--foreground)]">
            <Link
              href="/"
              className="hover:text-[#CC0000] transition-colors"
              data-umami-event="navigation_click"
              data-umami-event-region="header"
              data-umami-event-label="home"
            >
              首页
            </Link>
            <Link
              href="/#features"
              className="hover:text-[#CC0000] transition-colors"
              data-umami-event="navigation_click"
              data-umami-event-region="header"
              data-umami-event-label="features"
            >
              特点
            </Link>
            <Link
              href="/#community"
              className="hover:text-[#CC0000] transition-colors"
              data-umami-event="navigation_click"
              data-umami-event-region="header"
              data-umami-event-label="community"
            >
              社区
            </Link>
            <Link
              href="/#contact"
              className="hover:text-[#CC0000] transition-colors"
              data-umami-event="navigation_click"
              data-umami-event-region="header"
              data-umami-event-label="contact"
            >
              联系我们
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="rounded-none border border-transparent hover:border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] text-[var(--foreground)]"
            >
              <a
                href="https://github.com/involutionhell"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                data-umami-event="social_click"
                data-umami-event-platform="github"
                data-umami-event-location="header"
              >
                <GithubIcon className="h-4 w-4" />
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="rounded-none border border-transparent hover:border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] text-[var(--foreground)]"
            >
              <a
                href="https://discord.com/invite/6CGP73ZWbD"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Discord"
                data-umami-event="social_click"
                data-umami-event-platform="discord"
                data-umami-event-location="header"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </Button>
            <ThemeToggle />
            {/* AuthNav 是客户端组件，内部通过 useAuth() 自动处理登录/未登录状态 */}
            <AuthNav />
          </div>
        </div>
      </div>
    </header>
  );
}
