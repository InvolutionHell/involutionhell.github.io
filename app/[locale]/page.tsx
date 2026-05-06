import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Header } from "@/app/components/Header";
import { Hero } from "@/app/components/Hero";
import { DispatchNetwork } from "@/app/components/DispatchNetwork";
import { Footer } from "@/app/components/Footer";
import { FloatWindow } from "@/app/components/float-window/FloatWindow";
import { routing } from "@/i18n/routing";

interface Props {
  params: Promise<{ locale: string }>;
}

/**
 * 站点首页 (/[locale])。
 *
 * SSG 化（i18n 改造收尾，2026-05）：
 *   原版 await fetchHomepageEvents() server fetch backend，把首页钉成
 *   ƒ Dynamic。改造让 FloatWindow / ActivityTicker 各自 client fetch
 *   /api/public/homepage-events，page 本身只剩纯静态渲染，build 时随
 *   [locale] generateStaticParams 一起预渲染（zh + en 两份），Vercel
 *   Function 调用归零。
 *
 * force-static + setRequestLocale 双保险：让 next-intl 不退回 dynamic。
 */
export const dynamic = "force-static";

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <Hero />
      <DispatchNetwork />
      <Footer />
      <FloatWindow />
    </>
  );
}

/**
 * 首页 metadata：覆盖 root layout 的 alternates。
 *
 * canonical 指向当前 locale 的首页（/zh 或 /en），让两个 locale 各自有独立
 * 的 canonical URL，避免 Google 把它们当成重复内容互相争 PageRank。
 *
 * languages（hreflang）三向声明，告诉 Google 同一首页的另一语言版本在哪。
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return {
    alternates: {
      canonical: `/${locale}`,
      languages: {
        "zh-CN": "/zh",
        "en-US": "/en",
        "x-default": "/zh",
      },
    },
    openGraph: {
      url: `/${locale}`,
      locale: locale === "en" ? "en_US" : "zh_CN",
      alternateLocale: locale === "en" ? ["zh_CN"] : ["en_US"],
    },
  };
}
