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
