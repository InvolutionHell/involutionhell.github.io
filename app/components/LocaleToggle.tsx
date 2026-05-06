"use client";

/**
 * Header 里的语言切换按钮（匿名也能用）。
 *
 * i18n URL 段化改造后实现变化：
 *   旧版：写 cookie + router.refresh() —— 依赖 RSC 重新读 cookie 切语言，
 *         代价是全站 RSC 永远 dynamic。
 *   新版：用 next-intl/navigation 的 useRouter，直接 router.replace 到
 *         另一个 locale 的同一 pathname，URL 段切换 → next-intl 中间件
 *         同时同步 cookie + html lang。整站 RSC 可静态化。
 *
 * 显示：双字母 ZH / EN，当前语言高亮；尺寸与 ThemeToggle 对齐。
 */

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/routing";

export function LocaleToggle() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const toggle = () => {
    const next: Locale = locale === "zh" ? "en" : "zh";
    // pathname 是去掉 locale 段后的路径，next-intl router.replace 配合
    // locale 选项会自动加上目标 locale 前缀，并在响应里同步 NEXT_LOCALE cookie。
    router.replace(pathname, { locale: next });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      aria-label="Toggle language"
      title={locale === "zh" ? "切换为 English" : "Switch to 中文"}
      className="h-10 px-2 rounded-none font-mono text-xs uppercase tracking-widest transition-colors"
      data-umami-event="locale_toggle"
      data-umami-event-locale={locale === "zh" ? "en" : "zh"}
    >
      <span className={locale === "zh" ? "font-bold" : "opacity-50"}>ZH</span>
      <span className="opacity-30 mx-0.5">/</span>
      <span className={locale === "en" ? "font-bold" : "opacity-50"}>EN</span>
    </Button>
  );
}
