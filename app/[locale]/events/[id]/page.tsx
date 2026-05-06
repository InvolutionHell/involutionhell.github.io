import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import type { EventDetailResponse, EventView } from "../types";
import { InterestButton } from "./InterestButton";
import { sanitizeExternalUrl, sanitizeMediaUrl } from "@/lib/url-safety";

/**
 * /events/[id] 详情页。SSR 拉 /api/events/{id}。
 *
 * 核心信息摆放：
 *   - 头部：标题 + 时间 + 状态 + tags
 *   - 描述大段落
 *   - 讲师列表（有则渲染，没有则隐藏整块）
 *   - 回放嵌入区：优先 iframe（YouTube 直接内嵌），其次普通链接按钮
 *   - Discord / 感兴趣按钮（感兴趣是 Client Component 独立管理登录状态）
 */

export const revalidate = 300;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

async function fetchDetail(id: string): Promise<EventDetailResponse | null> {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) throw new Error("BACKEND_URL is not configured");
  const res = await fetch(
    `${backendUrl}/api/events/${encodeURIComponent(id)}`,
    {
      next: { revalidate: 300 },
      headers: {
        accept: "application/json",
        "user-agent": "InvolutionHell-SSR/1.0 (+https://involutionhell.com)",
      },
    },
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(
      `/api/events/${id} backend ${res.status} ${res.statusText}`,
    );
  }
  const json = (await res.json()) as ApiResponse<EventDetailResponse>;
  if (!json.success || !json.data) return null;
  return json.data;
}

interface Param {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Param): Promise<Metadata> {
  const { id } = await params;
  const data = await fetchDetail(id);
  if (!data) return { title: `活动 #${id} · Involution Hell` };
  return {
    title: `${data.event.title} · Involution Hell`,
    description: data.event.description || "Involution Hell 社群活动详情。",
  };
}

export default async function EventDetailPage({ params }: Param) {
  const { id } = await params;
  const data = await fetchDetail(id);
  if (!data) notFound();

  const event = data.event;
  // 所有外来 URL 都过 XSS 白名单——jobs: 拦 javascript: / data: / vbscript:
  // 等在 <a href> / <img src> 场景下会触发脚本执行或数据外泄的向量。
  // toYoutubeEmbed 内部已经做了 host 白名单（只返回 youtube.com/embed/*），
  // 但 fallback 的 <a> 链接仍然需要走 sanitize。
  const embedUrl = toYoutubeEmbed(event.playbackUrl);
  const safeCoverUrl = sanitizeMediaUrl(event.coverUrl);
  const safePlaybackUrl = sanitizeExternalUrl(event.playbackUrl);
  const safeDiscordLink = sanitizeExternalUrl(event.discordLink);

  return (
    <>
      <Header />
      <main className="pt-32 pb-16 bg-[var(--background)] min-h-screen">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          {/* 返回链接 */}
          <Link
            href="/events"
            className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 hover:text-[#CC0000] transition-colors"
          >
            ← 所有活动
          </Link>

          <header className="mt-4 border-t-4 border-[var(--foreground)] pt-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <StatusBadge event={event} />
              {event.tags.map((t) => (
                <span
                  key={t}
                  className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 border border-neutral-400 px-2 py-0.5"
                >
                  {t}
                </span>
              ))}
            </div>
            <h1 className="font-serif text-3xl md:text-5xl font-black uppercase tracking-tight text-[var(--foreground)]">
              {event.title}
            </h1>
            {event.startTime && (
              <p className="mt-3 font-mono text-xs text-neutral-500">
                {formatDateTime(event.startTime)}
                {event.endTime && <> — {formatDateTime(event.endTime)}</>}
              </p>
            )}
          </header>

          {safeCoverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={safeCoverUrl}
              alt={event.title}
              className="w-full aspect-[16/9] object-cover border border-[var(--foreground)] mt-6"
            />
          )}

          {event.description && (
            <section className="mt-8 prose prose-neutral dark:prose-invert max-w-none leading-relaxed">
              {event.description.split(/\n{2,}/).map((para, i) => (
                <p key={i} className="text-sm md:text-base">
                  {para}
                </p>
              ))}
            </section>
          )}

          {event.speakers.length > 0 && (
            <section className="mt-10">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-4">
                Speakers
              </h2>
              <ul className="flex flex-wrap gap-4">
                {event.speakers.map((s) => {
                  const safeProfileUrl = sanitizeExternalUrl(s.profileUrl);
                  const safeAvatarUrl = sanitizeMediaUrl(s.avatarUrl);
                  return (
                    <li
                      key={s.name}
                      className="flex items-center gap-3 border border-[var(--foreground)] px-3 py-2"
                    >
                      {safeAvatarUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={safeAvatarUrl}
                          alt={s.name}
                          className="w-8 h-8 border border-[var(--foreground)] object-cover"
                        />
                      )}
                      {safeProfileUrl ? (
                        <a
                          href={safeProfileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-serif text-sm font-semibold hover:text-[#CC0000] transition-colors"
                        >
                          {s.name}
                        </a>
                      ) : (
                        <span className="font-serif text-sm font-semibold">
                          {s.name}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* 回放：YouTube 可嵌入就内嵌；不行就看 safePlaybackUrl 有没有值给按钮。
              embedUrl 来自 toYoutubeEmbed 自带 host 白名单；safePlaybackUrl 走
              通用 scheme 白名单。两者都 null 时整块不渲染（连标题一起隐藏）。 */}
          {(embedUrl || safePlaybackUrl) && (
            <section className="mt-10">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-4">
                回放 · Playback
              </h2>
              {embedUrl ? (
                <div className="aspect-video border border-[var(--foreground)]">
                  <iframe
                    src={embedUrl}
                    title={`${event.title} 回放`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              ) : safePlaybackUrl ? (
                <a
                  href={safePlaybackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block font-mono text-xs uppercase tracking-widest px-4 py-2 border border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
                >
                  前往回放 →
                </a>
              ) : null}
            </section>
          )}

          {/* 操作区：感兴趣 + Discord */}
          <section className="mt-12 flex flex-wrap items-center gap-4 border-t border-[var(--foreground)]/40 pt-6">
            <InterestButton
              eventId={event.id}
              initialCount={event.interestCount}
              initialInterested={data.interested}
            />
            {safeDiscordLink && (
              <a
                href={safeDiscordLink}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs uppercase tracking-widest px-4 py-2 border border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] hover:bg-[#CC0000] hover:border-[#CC0000] transition-colors"
              >
                进入 Discord →
              </a>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

function StatusBadge({ event }: { event: EventView }) {
  if (event.ongoing)
    return (
      <span className="font-mono text-[10px] uppercase tracking-widest bg-[#CC0000] text-white px-2 py-0.5">
        进行中
      </span>
    );
  if (event.past)
    return (
      <span className="font-mono text-[10px] uppercase tracking-widest border border-neutral-400 text-neutral-500 px-2 py-0.5">
        已结束
      </span>
    );
  if (event.status === "published")
    return (
      <span className="font-mono text-[10px] uppercase tracking-widest border border-[var(--foreground)] text-[var(--foreground)] px-2 py-0.5">
        即将开始
      </span>
    );
  return (
    <span className="font-mono text-[10px] uppercase tracking-widest border border-neutral-400 text-neutral-500 px-2 py-0.5">
      {event.status}
    </span>
  );
}

/**
 * 如果 playback URL 是 YouTube 视频链接，转换成 embed URL。
 * 其他链接（Drive / 站内 docs）不做 iframe 嵌入，避免 X-Frame-Options 报错。
 */
function toYoutubeEmbed(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    // 严格白名单：只匹配 youtu.be 精确、或 youtube.com / youtube-nocookie.com
    // 精确 + *.youtube.com / *.youtube-nocookie.com 子域名。
    // 之前用 endsWith("youtube.com") 会把 evilyoutube.com 也判对，放进 iframe 后
    // 相当于把任意第三方站点嵌进详情页。
    const isYoutuBe = u.hostname === "youtu.be";
    const isYoutubeHost =
      u.hostname === "youtube.com" ||
      u.hostname === "www.youtube.com" ||
      u.hostname.endsWith(".youtube.com");
    const isYoutubeNocookieHost =
      u.hostname === "youtube-nocookie.com" ||
      u.hostname === "www.youtube-nocookie.com" ||
      u.hostname.endsWith(".youtube-nocookie.com");

    if (isYoutuBe) {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
    if (isYoutubeHost || isYoutubeNocookieHost) {
      const videoId = u.searchParams.get("v");
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      // 已经是 /embed/ 路径（此时原 URL 就是白名单内 host + /embed/xxx，可直接返回）
      if (u.pathname.startsWith("/embed/")) return url;
    }
  } catch {
    // 非法 URL 直接跳过
  }
  return null;
}

function formatDateTime(iso: string): string {
  // Invalid Date 检查同 /events/page.tsx 的 formatDate：new Date() 不抛。
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return d.toLocaleString("zh-CN", {
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
