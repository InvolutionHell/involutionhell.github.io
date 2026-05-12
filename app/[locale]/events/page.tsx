import type { Metadata } from "next";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import type { EventView } from "./types";
import { sanitizeMediaUrl } from "@/lib/url-safety";
import { routing } from "@/i18n/routing";

// ISR 5min：和 profile/feed 同一节流策略，控后端 QPS。
// setRequestLocale + generateStaticParams 是 next-intl SSG 的必要条件，
// 缺任一项会让 next-intl 退回 cookies() 把这条路由钉成 ƒ Dynamic。
export const revalidate = 300;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// 只在 build 阶段允许 fetch 失败降级（让 SSG 不挂），运行时仍 throw 给 Sentry。
const IS_BUILD = process.env.NEXT_PHASE === "phase-production-build";

async function fetchEvents(): Promise<EventView[]> {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    if (IS_BUILD) {
      console.warn(
        "[events] BACKEND_URL not set at build, rendering empty shell; ISR will fetch real data after deploy",
      );
      return [];
    }
    throw new Error("BACKEND_URL is not configured");
  }
  try {
    const res = await fetch(`${backendUrl}/api/events`, {
      next: { revalidate: 300 },
      headers: {
        accept: "application/json",
        "user-agent": "InvolutionHell-SSR/1.0 (+https://involutionhell.com)",
      },
    });
    if (!res.ok) {
      if (IS_BUILD) {
        console.warn(
          `[events] backend ${res.status} at build, rendering empty shell`,
        );
        return [];
      }
      throw new Error(`/api/events backend ${res.status} ${res.statusText}`);
    }
    const json = (await res.json()) as ApiResponse<EventView[]>;
    return json.success && json.data ? json.data : [];
  } catch (err) {
    if (IS_BUILD) {
      console.warn(
        "[events] fetch failed at build, rendering empty shell:",
        err,
      );
      return [];
    }
    // 运行时失败仍然 throw —— Sentry 抓到，错误页正常显示，不掩盖故障
    throw err;
  }
}

export const metadata: Metadata = {
  title: "活动 · Involution Hell",
  description:
    "Coffee Chat、Mock Interview、Career Journey、Open.Onion 等社群活动汇总，直播入口和历史回放一站式。",
};

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function EventsListPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const all = await fetchEvents();
  // 按时间划分：进行中 / 即将开始 / 已结束。ongoing + past 由后端标记，剩下的归"即将开始"
  const ongoing = all.filter((e) => e.ongoing);
  const upcoming = all.filter((e) => !e.ongoing && !e.past);
  const past = all.filter((e) => e.past);

  return (
    <>
      <Header />
      <main className="pt-32 pb-16 bg-[var(--background)] min-h-screen">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <header className="border-t-4 border-[var(--foreground)] pt-6 mb-12">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500">
              Community · Events
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-black uppercase mt-2 tracking-tight text-[var(--foreground)]">
              社群活动
            </h1>
            <p className="mt-4 text-sm md:text-base text-neutral-600 dark:text-neutral-400 max-w-2xl leading-relaxed">
              社群运营的 Coffee Chat / Mock Interview / Career Journey /
              Open.Onion 等活动。错过了也没事——每场都会留下回放文档。
            </p>
          </header>

          {ongoing.length > 0 && (
            <EventSection title="正在进行" events={ongoing} highlight />
          )}
          {upcoming.length > 0 && (
            <EventSection title="即将开始" events={upcoming} />
          )}
          {past.length > 0 && <EventSection title="历史活动" events={past} />}

          {all.length === 0 && (
            <div className="border border-dashed border-[var(--foreground)] p-10 text-center text-neutral-500 font-sans text-sm leading-relaxed">
              暂无公开活动。
              <br />
              <span className="text-xs text-neutral-400">
                关注 Discord 获取第一手活动通知。
              </span>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function EventSection({
  title,
  events,
  highlight,
}: {
  title: string;
  events: EventView[];
  highlight?: boolean;
}) {
  return (
    <section className="mb-14">
      <div className="flex items-baseline justify-between gap-3 mb-6 border-b border-[var(--foreground)]/40 pb-3">
        <h2
          className={`font-serif text-2xl md:text-3xl font-black uppercase tracking-tight ${
            highlight ? "text-[#CC0000]" : "text-[var(--foreground)]"
          }`}
        >
          {title}
        </h2>
        <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
          {events.length} 场
        </div>
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((e) => (
          <EventCard key={e.id} event={e} />
        ))}
      </ul>
    </section>
  );
}

function EventCard({ event }: { event: EventView }) {
  // 后端传来的 coverUrl 理论上干净，但走 XSS 白名单防管理员填错或历史脏数据
  const safeCoverUrl = sanitizeMediaUrl(event.coverUrl);
  return (
    <li className="border border-[var(--foreground)] hover:border-[#CC0000] transition-colors group">
      <Link href={`/events/${event.id}`} className="block">
        {safeCoverUrl ? (
          // 用原生 img：/next.config.mjs 里全站 unoptimized:true，没必要走 next/image
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={safeCoverUrl}
            alt={event.title}
            className="w-full aspect-[16/9] object-cover border-b border-[var(--foreground)]"
          />
        ) : (
          <div className="w-full aspect-[16/9] bg-neutral-100 dark:bg-neutral-900 border-b border-[var(--foreground)] flex items-center justify-center text-xs font-mono uppercase text-neutral-400">
            no cover
          </div>
        )}
        <div className="p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {event.tags.slice(0, 2).map((t) => (
              <span
                key={t}
                className="font-mono text-[9px] uppercase tracking-widest text-neutral-500 border border-neutral-400 px-1.5 py-0.5"
              >
                {t}
              </span>
            ))}
          </div>
          <h3 className="font-serif text-lg font-black leading-snug group-hover:text-[#CC0000] transition-colors">
            {event.title}
          </h3>
          {event.startTime && (
            <p className="font-mono text-[11px] text-neutral-500">
              {formatDate(event.startTime)}
            </p>
          )}
          {event.description && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
              {event.description}
            </p>
          )}
          <div className="flex items-center gap-3 pt-2 text-[11px] font-mono text-neutral-500">
            {event.interestCount > 0 && (
              <span>{event.interestCount} 人感兴趣</span>
            )}
            {event.playbackUrl && <span>· 有回放</span>}
            {event.ongoing && (
              <span className="text-[#CC0000] font-bold">· LIVE</span>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}

function formatDate(iso: string): string {
  // new Date(iso) 遇到非法字符串不 throw，只会返回一个 getTime() === NaN 的 Invalid Date，
  // 直接调 toLocaleDateString 会输出字面量 "Invalid Date"，所以必须显式检查。
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return d.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
