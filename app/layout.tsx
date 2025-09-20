import type { Metadata } from "next";
import localFont from "next/font/local";
import { RootProvider } from "fumadocs-ui/provider";
import Script from "next/script";
import "./globals.css";
import "katex/dist/katex.min.css";
import { ThemeProvider } from "@/app/components/ThemeProvider";
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

export const metadata: Metadata = {
  title: "Involution Hell",
  description: "A modern documentation site built with Fumadocs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/mascot.webp" as="image" type="image/webp" />
        {/* 谷歌图标字体用于 Edit 按钮的 material symbol */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=edit"
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Global animated backgrounds (sky / stars) */}
        <div className="site-bg site-bg--sky" aria-hidden />
        <div className="site-bg site-bg--stars" aria-hidden />
        <RootProvider
          search={{
            // Use static index so it works in `next export` and dev.
            options: {
              type: "static",
              api: "/search.json",
            },
          }}
        >
          <ThemeProvider defaultTheme="system" storageKey="ih-theme">
            <div className="relative z-10">{children}</div>
          </ThemeProvider>
        </RootProvider>
        {/* 谷歌分析 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-ED4GVN8YVW"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-ED4GVN8YVW');
          `}
        </Script>
        {/* 性能分析 */}
        <SpeedInsights />
      </body>
    </html>
  );
}
