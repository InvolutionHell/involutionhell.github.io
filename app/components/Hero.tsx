import Link from "next/link";
import ZoteroFeedLazy from "@/app/components/ZoteroFeedLazy";
import { Contribute } from "@/app/components/Contribute";
import Image from "next/image";
import { ActivityTicker } from "@/app/components/ActivityTicker";
import { cn } from "@/lib/utils";
import { AnimatedBar } from "@/app/components/rank/AnimatedBar";
import { HotDocsPreview } from "@/app/components/HotDocsPreview";
import leaderboardData from "@/generated/site-leaderboard.json";
import { MAINTAINERS } from "@/lib/admins";

export function Hero() {
  const categories: { title: string; desc: string; href: string }[] = [
    {
      title: "AI",
      desc: "基础数学、LLM、训练与推理、评测、数据集等",
      href: "/docs/ai",
    },
    {
      title: "Computer Science",
      desc: "数据结构、算法与基础计算机科学知识",
      href: "/docs/computer-science",
    },
    {
      title: "笔试面经",
      desc: "可以给我一份工作吗？我什么都可以做！",
      href: "/docs/jobs/interview-prep/bq",
    },
    {
      title: "群友分享",
      desc: "群友写的捏",
      href: "/docs/CommunityShare",
    },
  ];

  return (
    <section className="relative pt-32 pb-16 newsprint-texture transition-colors duration-300">
      <div className="container relative mx-auto px-6">
        {/* Ticker - mimicking stock ticker */}
        <div className="border-y border-[var(--foreground)] py-2 mb-12 overflow-hidden bg-neutral-100 dark:bg-neutral-900 flex items-center transition-colors duration-300">
          <div className="font-mono text-xs uppercase tracking-widest px-4 border-r border-[var(--foreground)] whitespace-nowrap text-[var(--foreground)]">
            Breaking News
          </div>
          <div className="flex-1">
            <ActivityTicker />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 border-r border-[var(--foreground)] pr-8 min-h-[400px] transition-colors duration-300">
            <h1 className="text-6xl md:text-8xl lg:text-[8rem] font-serif font-black leading-[0.85] tracking-tighter mb-8 uppercase italic text-[var(--foreground)]">
              Involution <br /> Hell
            </h1>

            <div className="max-w-2xl">
              <p className="text-xl md:text-2xl font-body leading-relaxed text-justify drop-cap text-[var(--foreground)]">
                一个由开发者自发组织、免费开放的学习社区。降低门槛，避免无意义内卷，专注真实进步与乐趣。我们相信知识不应成为枷锁，而应是通往自由的阶梯。
              </p>

              <div className="mt-12">
                <Contribute />
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-8">
            <div className="border border-[var(--foreground)] p-1 transition-all duration-500 bg-[var(--background)]">
              <Image
                src="/mascot.webp"
                alt="Mascot"
                width={420}
                height={400}
                priority
                className="w-full h-auto object-contain bg-neutral-200 dark:bg-neutral-800"
              />
              <div className="font-mono text-[10px] uppercase p-2 border-t border-[var(--foreground)] text-neutral-500">
                Fig. 1.1 — The Spirit of Resilience
              </div>
            </div>

            <div className="border border-[var(--foreground)] p-6 bg-[var(--foreground)] text-[var(--background)]">
              <h3 className="font-serif text-2xl mb-4">Join the Resistance</h3>
              <p className="font-body text-sm mb-6 opacity-80">
                Connect with thousands of developers who are reclaiming their
                passion for technology.
              </p>
              <Link
                href="/docs/ai"
                className="block w-full"
                // Umami 埋点: Hero CTA 按钮点击
                data-umami-event="navigation_click"
                data-umami-event-region="hero_cta"
                data-umami-event-label="Access Articles"
              >
                <button className="w-full py-3 border border-[var(--background)] font-sans text-xs uppercase tracking-widest hover:bg-[var(--background)] hover:text-[var(--foreground)] transition-all cursor-pointer">
                  Access Articles / 访问文章
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Top-level directories - Grid with shared borders */}
        <div className="mt-16 border-t-4 border-[var(--foreground)] transition-colors duration-300">
          <div className="py-4 font-mono text-xs uppercase tracking-widest border-b border-[var(--foreground)] text-[var(--foreground)]">
            Classified Archives / 归档分类
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {categories.map((c, idx) => (
              <li
                key={c.title}
                className={cn(
                  "group border-b border-[var(--foreground)] md:border-r last:border-r-0 h-full",
                  idx % 2 === 1 && "md:border-r-0 lg:border-r",
                  idx === 3 && "lg:border-r-0",
                )}
              >
                <Link
                  href={c.href}
                  className="p-8 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors h-full flex flex-col hard-shadow-hover"
                  // Umami 埋点: 首页分类卡片点击
                  data-umami-event="navigation_click"
                  data-umami-event-region="home_categories"
                  data-umami-event-label={c.title}
                >
                  <div className="font-mono text-[10px] text-neutral-400 mb-4">
                    00{idx + 1}
                  </div>
                  <div className="text-2xl font-serif font-bold mb-2 uppercase text-[var(--foreground)]">
                    {c.title}
                  </div>
                  <p className="text-sm font-body text-neutral-600 dark:text-neutral-400 flex-1 leading-relaxed">
                    {c.desc}
                  </p>
                  <div className="mt-6 font-sans text-[10px] uppercase tracking-widest font-bold text-[var(--foreground)] group-hover:text-[#CC0000]">
                    Read More &rarr;
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-16">
          <ZoteroFeedLazy groupId={6053219} limit={8} />
        </div>

        {/* Leaderboard Preview */}
        <div className="mt-16 border-t-4 border-[var(--foreground)] pt-8 transition-colors duration-300">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-8 border-b border-[var(--foreground)] pb-4 gap-4">
            <div>
              <h2 className="text-4xl md:text-5xl font-serif font-black uppercase text-[var(--foreground)]">
                Top Rank
              </h2>
              <p className="font-mono text-xs uppercase tracking-widest text-neutral-500 mt-2">
                Real-time Hall of Fame
              </p>
            </div>
            <Link
              href="/rank"
              className="font-mono text-xs uppercase tracking-widest font-bold text-[var(--foreground)] hover:text-[var(--color-accent)] transition-colors flex items-center gap-2 group"
              data-umami-event="navigation_click"
              data-umami-event-region="hero_leaderboard"
              data-umami-event-label="FULL RANK"
            >
              FULL RANK
              <span className="transform group-hover:translate-x-1 transition-transform">
                &rarr;
              </span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {(() => {
                const rawData = leaderboardData as {
                  id: string;
                  name: string;
                  points: number;
                  avatarUrl: string;
                }[];
                const filteredData = rawData.filter(
                  (user) => !MAINTAINERS.includes(user.name),
                );
                const top3 = filteredData.slice(0, 3);
                const maxPoints = top3.length > 0 ? top3[0].points : 100;

                return top3.map((user, idx) => (
                  <div
                    key={user.id}
                    className="border border-[var(--foreground)] p-6 bg-[var(--background)] relative hard-shadow-hover transition-all group"
                  >
                    <div className="absolute top-0 right-0 w-12 h-12 bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center font-mono font-bold text-xl border-b border-l border-[var(--foreground)] z-10">
                      #{idx + 1}
                    </div>
                    <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 border border-[var(--foreground)] mb-4 transition-transform group-hover:scale-110 overflow-hidden">
                      <Image
                        src={user.avatarUrl}
                        alt={user.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover transition-all duration-300"
                      />
                    </div>
                    <div className="font-serif text-2xl font-bold uppercase text-[var(--foreground)] mb-1 truncate">
                      {user.name}
                    </div>
                    <div className="font-mono text-xs text-neutral-500 uppercase tracking-widest mb-4">
                      {user.points.toLocaleString()} PTS
                    </div>
                    <AnimatedBar value={user.points} max={maxPoints} />
                  </div>
                ));
              })()}
            </div>
            <div className="lg:col-span-4">
              <HotDocsPreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
