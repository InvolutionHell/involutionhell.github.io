"use client";

/**
 * Header 里的语言切换按钮（匿名也能用）。
 *
 * 为什么要做：
 *   之前切语言的唯一入口在 /settings 页面，UserMenu 里只有登录用户能看到。
 *   访客看到的永远是默认 zh，站点对英语用户非常不友好。
 *
 * 实现：
 *   - 写 locale=zh|en 到 document.cookie（path=/，一年有效期，samesite=lax）
 *     字段和格式与 SettingsForm 完全一致，登录用户在设置页改的偏好仍然生效
 *   - 切完 router.refresh() 让 SSR 重新渲染，server component（Hero / docs
 *     详情页等）从 cookie 读新 locale 切文案
 *   - 简单的 ZH / EN 双字母展示，当前语言高亮；button 尺寸与 ThemeToggle 对齐
 *
 * 不做的事：
 *   - 不读后端 user_preferences：游客无账号，登录用户在 /settings 改完也只是
 *     写同一条 cookie，这里读 cookie 即可统一视图。
 *   - 不做 URL prefix 切换（/zh/xxx、/en/xxx）：站点当前没有 i18n 路由分段，
 *     硬改会牵动大量路由和 sitemap。Cookie 方案延续现状，后续若要 SEO 双语
 *     URL 再另开 PR。
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";

type Locale = "zh" | "en";

function readLocaleCookie(): Locale {
  if (typeof document === "undefined") return "zh";
  const m = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
  const v = m?.[1];
  return v === "en" ? "en" : "zh";
}

function writeLocaleCookie(next: Locale) {
  // 一年；samesite=lax 够用（这个 cookie 不涉及跨站 POST）
  document.cookie = `locale=${next};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
}

export function LocaleToggle() {
  const router = useRouter();
  // 初始 render 先给默认值，避免 SSR 和 CSR 结构不同触发 hydration 警告；
  // 真实值由 useEffect 读 cookie 后再覆盖
  const [locale, setLocale] = useState<Locale>("zh");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLocale(readLocaleCookie());
    setReady(true);
  }, []);

  const toggle = () => {
    const next: Locale = locale === "zh" ? "en" : "zh";
    writeLocaleCookie(next);
    setLocale(next);
    if (typeof window !== "undefined" && window.umami) {
      window.umami.track("locale_toggle", { locale: next });
    }
    // 刷新 server component 树，重新按 cookie 渲染各页面
    router.refresh();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      aria-label="Toggle language"
      title={locale === "zh" ? "切换为 English" : "Switch to 中文"}
      className="h-10 px-2 rounded-none font-mono text-xs uppercase tracking-widest transition-colors"
    >
      {/* 未 hydrate 时默认展示 ZH/EN 两字，hydrate 后根据 cookie 高亮当前 */}
      <span className={ready && locale === "zh" ? "font-bold" : "opacity-50"}>
        ZH
      </span>
      <span className="opacity-30 mx-0.5">/</span>
      <span className={ready && locale === "en" ? "font-bold" : "opacity-50"}>
        EN
      </span>
    </Button>
  );
}
