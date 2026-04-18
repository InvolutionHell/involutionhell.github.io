import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Github, MessageCircle } from "lucide-react";
import { BrandMark } from "./BrandMark";
import { LicenseNotice } from "./LicenseNotice";

export async function Footer() {
  const t = await getTranslations("footer");
  return (
    <footer
      id="contact"
      className="border-t-4 border-[var(--foreground)] bg-[var(--background)] newsprint-texture transition-colors duration-300"
    >
      <div className="container mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Brand */}
          <div className="md:col-span-5 border-r border-[var(--foreground)] pr-12 transition-colors duration-300">
            <BrandMark
              className="mb-6 gap-3"
              textClassName="font-serif font-black text-2xl uppercase italic text-[var(--foreground)]"
            />
            <p className="font-body text-neutral-600 dark:text-neutral-400 mb-8 max-w-md text-justify leading-relaxed">
              {t("brand")}
            </p>
            <div className="flex space-x-2">
              <a
                href="https://github.com/involutionhell"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("a11y.github")}
                title={t("a11y.github")}
                data-umami-event="social_click"
                data-umami-event-platform="github"
                data-umami-event-location="footer"
                className="w-12 h-12 flex items-center justify-center border border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-all text-[var(--foreground)]"
              >
                <Github className="h-5 w-5" />
                <span className="sr-only">{t("a11y.github")}</span>
              </a>
              <a
                href="https://discord.com/invite/6CGP73ZWbD"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("a11y.discord")}
                title={t("a11y.discord")}
                data-umami-event="social_click"
                data-umami-event-platform="discord"
                data-umami-event-location="footer"
                className="w-12 h-12 flex items-center justify-center border border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-all text-[var(--foreground)]"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="sr-only">{t("a11y.discord")}</span>
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className="md:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-sans text-xs font-bold uppercase tracking-widest mb-6 border-b border-[var(--foreground)] pb-2 text-[var(--foreground)]">
                Archives
              </h3>
              <ul className="space-y-3 font-body text-sm text-[var(--foreground)]">
                <li>
                  <Link
                    href="/docs/learn/ai"
                    className="hover:text-[#CC0000] transition-colors"
                    data-umami-event="navigation_click"
                    data-umami-event-region="footer"
                    data-umami-event-label="AI & Mathematics"
                  >
                    AI & Mathematics
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/learn/cs"
                    className="hover:text-[#CC0000] transition-colors"
                    data-umami-event="navigation_click"
                    data-umami-event-region="footer"
                    data-umami-event-label="Computer Science"
                  >
                    Computer Science
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/community"
                    className="hover:text-[#CC0000] transition-colors"
                    data-umami-event="navigation_click"
                    data-umami-event-region="footer"
                    data-umami-event-label="Community Sharing"
                  >
                    Community Sharing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/career"
                    className="hover:text-[#CC0000] transition-colors"
                    data-umami-event="navigation_click"
                    data-umami-event-region="footer"
                    data-umami-event-label="Career Prep"
                  >
                    Career Prep
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-sans text-xs font-bold uppercase tracking-widest mb-6 border-b border-[var(--foreground)] pb-2 text-[var(--foreground)]">
                Resources
              </h3>
              <ul className="space-y-3 font-body text-sm text-[var(--foreground)]">
                <li>
                  <a
                    href="https://www.zotero.org/groups/6053219/unsw_ai/library"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#CC0000] transition-colors"
                    data-umami-event="resource_click"
                    data-umami-event-type="zotero"
                    data-umami-event-location="footer"
                    data-umami-event-url="https://www.zotero.org/groups/6053219/unsw_ai/library"
                  >
                    Zotero Library
                  </a>
                </li>
                <li>
                  <a
                    href="#features"
                    data-umami-event="navigation_click"
                    data-umami-event-region="footer"
                    data-umami-event-label="Mission Brief"
                    className="hover:text-[#CC0000] transition-colors"
                  >
                    Mission Brief
                  </a>
                </li>
                <li>
                  <a
                    href="#community"
                    data-umami-event="navigation_click"
                    data-umami-event-region="footer"
                    data-umami-event-label="Network Status"
                    className="hover:text-[#CC0000] transition-colors"
                  >
                    Network Status
                  </a>
                </li>
              </ul>
            </div>

            <div className="col-span-2 md:col-span-1">
              <h3 className="font-sans text-xs font-bold uppercase tracking-widest mb-6 border-b border-[var(--foreground)] pb-2 text-[var(--foreground)]">
                Legal
              </h3>
              <div className="font-body text-xs text-neutral-500 leading-relaxed">
                <p className="mb-4">Edition: Vol 1.0.0</p>
                <p className="mb-4">Printed in the Cloud</p>
                <LicenseNotice />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-24 pt-8 border-t border-[var(--foreground)] flex flex-col md:flex-row justify-between items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-neutral-400">
          <div>
            &copy; {new Date().getFullYear()} Involution Hell Organization
          </div>
          <div className="flex gap-8">
            <span>Open Source</span>
            <span>Free Forever</span>
            <span>All Rights Reserved</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
