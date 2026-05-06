import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Header } from "@/app/components/Header";
import { Hero } from "@/app/components/Hero";
import { DispatchNetwork } from "@/app/components/DispatchNetwork";
import { Footer } from "@/app/components/Footer";
import { FloatWindow } from "@/app/components/float-window/FloatWindow";
import { fetchHomepageEvents } from "@/lib/events-fetch";
import { routing } from "@/i18n/routing";

interface Props {
  params: Promise<{ locale: string }>;
}

/**
 * 站点首页 (/[locale])。
 *
 * i18n 改造前是 RSC + cookies()，整页 dynamic。改造后通过 setRequestLocale
 * 启用 SSG —— 但这页 await fetchHomepageEvents 仍然是 server fetch，会把
 * 整页钉成 dynamic（fetch 命中 cache 也算访问态）。
 *
 * TODO: 把 FloatWindow 的 event prop 移到 client 自己 fetch（参考 Hero
 * 的 ActivityTicker 模式），让首页变 ●（SSG）。当前先保持 ƒ，等下一轮
 * 优化。
 */
export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const homepageEvents = await fetchHomepageEvents();
  // FloatWindow 只展示"第一条未过期活动"；fetchHomepageEvents 已把未过期排前面
  const latestActive = homepageEvents.find((e) => !e.deprecated) ?? null;

  return (
    <>
      <Header />
      <Hero />
      <DispatchNetwork />
      <Footer />
      <FloatWindow event={latestActive} />
    </>
  );
}
