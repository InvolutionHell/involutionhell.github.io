import type { Metadata } from "next";
import localFont from "next/font/local";
import { RootProvider } from "fumadocs-ui/provider";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/app/components/ThemeProvider";

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Global animated backgrounds (sky / stars) */}
        <div className="site-bg site-bg--sky" aria-hidden />
        <div className="site-bg site-bg--stars" aria-hidden />
        <RootProvider>
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
