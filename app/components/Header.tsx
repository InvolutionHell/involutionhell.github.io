import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ThemeToggle } from "./ThemeToggle";
import { LocaleToggle } from "./LocaleToggle";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { Github as GithubIcon } from "./icons/Github";
import { AuthNav } from "./AuthNav";
import { BrandMark } from "./BrandMark";
import { LiveEditionLabel } from "./LiveEditionLabel";
import { LiveDate } from "./LiveDate";

export async function Header() {
  const t = await getTranslations("header");
  const editionTimestampMs = new Date().getTime();
  return (
    <header className="fixed top-0 w-full z-50 bg-[var(--background)] border-b border-[var(--foreground)] py-2 transition-colors duration-300">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between border-b border-[var(--foreground)] pb-2 mb-2 transition-colors duration-300">
          <LiveEditionLabel initialTimestamp={editionTimestampMs} />
          <BrandMark priority />
          <LiveDate initialTimestamp={editionTimestampMs} />
        </div>

        <div className="flex items-center justify-end md:justify-between h-10">
          <nav className="hidden md:flex items-center gap-8 font-sans text-xs font-bold uppercase tracking-widest text-[var(--foreground)]">
            <Link
              href="/docs"
              className="hover:text-[#CC0000] transition-colors"
              data-umami-event="navigation_click"
              data-umami-event-region="header"
              data-umami-event-label="docs"
            >
              {t("nav.docs")}
            </Link>
            <Link
              href="/rank"
              className="hover:text-[#CC0000] transition-colors"
              data-umami-event="navigation_click"
              data-umami-event-region="header"
              data-umami-event-label="rank"
            >
              {t("nav.rank")}
            </Link>
            <Link
              href="/#community"
              className="hover:text-[#CC0000] transition-colors"
              data-umami-event="navigation_click"
              data-umami-event-region="header"
              data-umami-event-label="community"
            >
              {t("nav.community")}
            </Link>
            <Link
              href="/feed"
              className="hover:text-[#CC0000] transition-colors"
              data-umami-event="navigation_click"
              data-umami-event-region="header"
              data-umami-event-label="feed"
            >
              {t("nav.feed")}
            </Link>
            <Link
              href="/#contact"
              className="hover:text-[#CC0000] transition-colors"
              data-umami-event="navigation_click"
              data-umami-event-region="header"
              data-umami-event-label="contact"
            >
              {t("nav.contact")}
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
            <LocaleToggle />
            <ThemeToggle />
            <AuthNav />
          </div>
        </div>
      </div>
    </header>
  );
}
