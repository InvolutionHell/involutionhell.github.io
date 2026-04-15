// app/layout.tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import { RootProvider } from "fumadocs-ui/provider";
import Script from "next/script";
import "./globals.css";
import "katex/dist/katex.min.css";
import { ThemeProvider } from "@/app/components/ThemeProvider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { UmamiIdentity } from "@/app/components/UmamiIdentity";
import { AuthProvider } from "@/lib/use-auth";
// import { SearchWrapper } from "@/app/components/SearchWrapper";
import { CustomSearchDialog } from "@/app/components/CustomSearchDialog";
import { cookies } from "next/headers";

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

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://involutionhell.com";
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
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "standard",
      "max-snippet": 160,
      "max-video-preview": 0,
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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // 读取 locale cookie，选对应语言的搜索索引分片。
  // 分片目的：规避 Vercel 单页 ISR 19.07MB 硬上限（FALLBACK_BODY_TOO_LARGE）。
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value === "en" ? "en" : "zh";
  const searchApi = `/search.${locale}.json`;
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
        {/* 结构化数据：英文主名 + 中文 alternateName */}
        <script
          type="application/ld+json"
          // 注意：必须在运行时插入字符串
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
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
        <ThemeProvider defaultTheme="dark" storageKey="ih-theme">
          <AuthProvider>
            <RootProvider
              // 禁用 fumadocs 内置的 next-themes，避免与我们自己的 ThemeProvider（storageKey: ih-theme）
              // 同时往 <html class> 写 light/dark 导致闪烁和状态不同步
              theme={{ enabled: false }}
              search={{
                SearchDialog: CustomSearchDialog,
                // 使用静态索引，兼容 next export 与本地开发
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
        {/* 谷歌分析 */}
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
        {/* Umami Analytics */}
        <Script
          defer
          src="https://umami.involutionhell.com/script.js"
          data-website-id="f3aeb896-50b7-4a5d-b37c-270550678c63"
          strategy="lazyOnload"
        />
        {/* User Identification */}
        {/* moved inside SessionProvider */}
        {/* 性能分析 */}
        <SpeedInsights />
      </body>
    </html>
  );
}
