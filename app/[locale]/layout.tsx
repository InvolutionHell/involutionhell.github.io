import { setRequestLocale, getMessages } from "next-intl/server";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { RootProvider } from "fumadocs-ui/provider";
import { ThemeProvider } from "@/app/components/ThemeProvider";
import { AuthProvider } from "@/lib/use-auth";
import { CustomSearchDialog } from "@/app/components/CustomSearchDialog";
import { UmamiIdentity } from "@/app/components/UmamiIdentity";
import { routing } from "@/i18n/routing";

/**
 * locale 段 layout：所有 user-facing 路由（含 admin）的最外层包装。
 *
 * 关键作用（启用 SSG）：
 *   setRequestLocale(locale) 必须在第一行调用（在任何 next-intl hook 之前）。
 *   它把 locale 写进 next-intl 的 RequestStore，让所有嵌套 RSC 拿到 locale，
 *   而不需要再调 cookies() / headers() —— 这是让全树 SSG 的关键开关。
 *
 *   缺这一行的话，next-intl 会回退到从 cookies()/headers() 推断 locale，
 *   整棵 RSC 树重新变 dynamic，绕了一圈又回到老问题。
 *
 * generateStaticParams 双倍出货 zh + en，build 时 Next.js 会按
 * [locale] × 嵌套 generateStaticParams 笛卡尔积预渲染所有页面。
 *
 * 这里包了 root layout 移过来的全部 locale-bound provider：
 *   - NextIntlClientProvider (locale + messages)
 *   - ThemeProvider / AuthProvider / RootProvider (fumadocs，search api 按 locale 选分片)
 *   - 主体 main 容器
 *
 * inline script: 把 documentElement.lang 改成当前 locale。root layout 写死
 * lang="zh-CN" 作为 SSR fallback，client 端这条脚本会立刻覆盖，确保 a11y
 * 工具和 SEO 拿到正确语言标记。
 */
type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // 关键：启用 SSG 的开关。必须在调任何 next-intl hook 之前。
  setRequestLocale(locale);

  const messages = await getMessages();
  const htmlLang = locale === "en" ? "en" : "zh-CN";
  // 搜索索引按 locale 分片（规避 Vercel 单页 ISR 19.07MB 上限）
  const searchApi = `/search.${locale}.json`;

  return (
    <>
      {/*
        SSR 时 root layout 的 html lang 是写死的 "zh-CN"。
        在客户端立即覆盖为当前 locale，让屏幕阅读器、Google Translate 等
        立刻拿到正确语言标记。早于 hydration —— 通过同步 inline script 实现。
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang = "${htmlLang}";`,
        }}
      />
      <NextIntlClientProvider locale={locale} messages={messages}>
        <ThemeProvider defaultTheme="dark" storageKey="ih-theme">
          <AuthProvider>
            <RootProvider
              // 禁用 fumadocs 内置的 next-themes，避免与我们自己的 ThemeProvider
              // （storageKey: ih-theme）同时往 <html class> 写 light/dark 导致闪烁
              theme={{ enabled: false }}
              search={{
                SearchDialog: CustomSearchDialog,
                options: { type: "static", api: searchApi },
              }}
            >
              <main id="main-content" className="relative z-10">
                {children}
              </main>
              <UmamiIdentity />
            </RootProvider>
          </AuthProvider>
        </ThemeProvider>
      </NextIntlClientProvider>
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
