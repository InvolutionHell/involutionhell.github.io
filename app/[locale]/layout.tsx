import type { Metadata } from "next";
import localFont from "next/font/local";
import { RootProvider } from "fumadocs-ui/provider";
import Script from "next/script";
import "../globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import { locales } from "@/i18n";

const geistSans = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Involution Hell",
  description: "A modern documentation site built with Fumadocs",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="preload" href="/mascot.webp" as="image" type="image/webp" />
        <link rel="preload" href="/mascot.png" as="image" type="image/png" />
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
              api: `/${locale}/search.json`,
            },
          }}
        >
          <ThemeProvider defaultTheme="system" storageKey="ih-theme">
            <div className="relative z-10">{children}</div>
          </ThemeProvider>
        </RootProvider>
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
      </body>
    </html>
  );
}
