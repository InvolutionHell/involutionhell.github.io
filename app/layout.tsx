// app/layout.tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import "katex/dist/katex.min.css";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

import { SITE_URL } from "@/lib/site-url";
import { safeJsonLdString } from "@/lib/json-ld";
const en_description =
  "内卷地狱（Involution Hell）是一个由开发者发起的开源学习社区，专注算法、系统设计、工程实践与技术分享，帮助华人程序员高效成长，专注真实进步。Involution Hell is an open-source community empowering builders with real-world engineering.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "Involution Hell",
  title: {
    default: "Involution Hell",
    template: "%s · Involution Hell",
  },
  description: `${en_description}`,
  keywords: [
    "Involution Hell",
    "内卷地狱",
    "open-source community",
    "algorithms",
    "system design",
    "software engineering",
    "coding interview",
    "LeetCode",
    "Codeforces",
    "Kaggle",
    "frontend",
    "backend",
    "DevOps",
    "TypeScript",
    "Go",
    "Python",
    "React",
    "Next.js",
  ],
  authors: [{ name: "Involution Hell Maintainers", url: SITE_URL }],
  creator: "longsizhuo",
  publisher: "Involution Hell",
  category: "Technology",
  // alternates 是 fallback，被 [locale] 段下的 generateMetadata 覆盖。
  // 默认 canonical 指 /zh（默认 locale 首页），不指 / 因为根路径会被
  // next-intl middleware 308 redirect，搜索引擎索引到 /zh 更直接。
  // languages 同时声明 hreflang，让 root metadata 应用到不在 [locale]
  // 下的路径（如 /sitemap.xml 详情页 fallback 时）也能正确给出语言关系。
  alternates: {
    canonical: "/zh",
    languages: {
      "zh-CN": "/zh",
      "en-US": "/en",
      "x-default": "/zh",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: {
    telephone: false,
    date: true,
    address: false,
    email: true,
    url: true,
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [{ url: "/logo/logoInLight.svg", type: "image/svg+xml" }],
    shortcut: "/logo/favicon-apple.png",
    apple: "/logo/favicon-apple.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Involution Hell",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Involution Hell",
    title: "Involution Hell",
    description: `${en_description}`,
    images: [
      {
        url: "/og/cover.png",
        width: 2560,
        height: 1440,
        alt: "Involution Hell — Open-source Community",
      },
    ],
    locale: "zh-CN",
    alternateLocale: ["en-US"],
  },
  twitter: {
    card: "summary_large_image",
    site: "@longsizhuo",
    creator: "@longsizhuo",
    title: "Involution Hell",
    description: `${en_description}`,
    images: ["/og/cover.png"],
  },
  verification: {
    google: "Qg1UVFQ9IzpVU8Z071mdqUp8gx7RRD23VE0UYVeENHM",
  },
};

/**
 * Root layout —— 极简版本（i18n 改造后）。
 *
 * 重要变化（why this rewrite）：
 *   旧版在这里 await cookies() 读 locale，把整棵 RSC 树钉成 dynamic，
 *   docs/首页/events 全部按需 SSR，Vercel Fluid CPU 月用 4h。
 *   现在 root layout 完全不读 locale，所有 i18n / Theme / Auth / fumadocs
 *   provider 都搬到 app/[locale]/layout.tsx，让 [locale] 段下走 SSG。
 *
 * 这里只剩：
 *   - html / body 框架（lang 写死 zh-CN 作为 fallback；[locale]/layout
 *     在 client 端会按当前 locale 改 documentElement.lang）
 *   - 全站 metadata（fonts / icons / OpenGraph 等不依赖 locale）
 *   - 全站 inline scripts（theme 防闪屏、structured data、preconnect）
 *   - 全站 analytics（GA / Umami / Vercel Speed Insights）
 *   - 这些都 locale-agnostic，root layout 静态渲染零依赖。
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400&family=Lora:ital,wght@0,400;0,600;1,400&display=swap"
        />
        {/* 主题脚本：避免首屏闪烁 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                try {
                  const storageKey = "ih-theme";
                  const root = document.documentElement;
                  const stored = localStorage.getItem(storageKey);
                  const theme = stored || "dark";
                  root.classList.remove("light", "dark");

                  if (theme === "system") {
                    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
                      ? "dark"
                      : "light";
                    root.classList.add(systemTheme);
                    return;
                  }

                  root.classList.add(theme);
                } catch {
                  // Ignore storage access errors to avoid blocking render.
                }
              })();
            `,
          }}
        />
        {/* 预连接：缩短关键请求链 */}
        <link rel="preconnect" href="https://www.google-analytics.com" />
        {/* Preload the decorative sky texture so the LCP background image is discovered immediately */}
        <link
          rel="preload"
          href="/cloud_2.png"
          as="image"
          type="image/png"
          fetchPriority="high"
        />
        {/*
          WebSite + SearchAction 结构化数据：Google 搜索结果下方可能直接显示站内搜索框
          （Sitelinks Search Box）。target 指向我们的搜索页带 query 参数；
          search-input 占位符必须叫 "search_term_string"（Google 硬约定）。
        */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: safeJsonLdString({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Involution Hell",
              alternateName: ["内卷地狱"],
              url: SITE_URL,
              inLanguage: ["zh-CN", "en-US"],
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${SITE_URL}/docs?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        {/* 结构化数据：英文主名 + 中文 alternateName */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLdString({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Involution Hell",
              alternateName: ["内卷地狱"],
              url: SITE_URL,
              description: `${en_description}`,
              sameAs: [
                "https://github.com/InvolutionHell",
                "https://discord.gg/6CGP73ZWbD",
              ],
              logo: `${SITE_URL}/logo/logoInLight.svg`,
            }),
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="site-bg site-bg--stars" aria-hidden />
        {children}
        {/* 谷歌分析 / Umami：仅 production 加载，避免 dev 环境污染数据
            （之前 GA Referral 看到 localhost:3010 就是 next dev 在打 prod 同一个 G-ID） */}
        {process.env.NODE_ENV === "production" && (
          <>
            <Script
              src="https://www.googletagmanager.com/gtag/js?id=G-ED4GVN8YVW"
              strategy="lazyOnload"
            />
            <Script id="gtag-init" strategy="lazyOnload">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-ED4GVN8YVW');
              `}
            </Script>
            <Script
              defer
              src="https://umami.involutionhell.com/script.js"
              data-website-id="f3aeb896-50b7-4a5d-b37c-270550678c63"
              strategy="lazyOnload"
            />
          </>
        )}
        {/* 性能分析 */}
        <SpeedInsights />
      </body>
    </html>
  );
}
