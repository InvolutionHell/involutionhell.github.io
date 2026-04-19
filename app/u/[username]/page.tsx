import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import leaderboard from "@/generated/site-leaderboard.json";
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import { ProfileCard } from "./ProfileCard";
import { EditLinkIfOwner } from "./EditLinkIfOwner";
import { AdminLinkIfOwnerAdmin } from "./AdminLinkIfOwnerAdmin";
import { DeveloperToolsIfOwner } from "./DeveloperToolsIfOwner";
import { SharesLinkIfOwner } from "./SharesLinkIfOwner";
import { SharesOnProfile } from "./SharesOnProfile";
import { ActivityHeatmap } from "./ActivityHeatmap";
import { FollowButton } from "./FollowButton";
import { GithubRepos, GithubReposSkeleton } from "./GithubRepos";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { sanitizeExternalUrl } from "@/lib/url-safety";

interface UserView {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  email?: string | null;
  githubId?: number | null;
}

interface UserProjectItem {
  title: string;
  description?: string;
  url?: string;
  tags?: string[];
}

interface UserPaperItem {
  /** Zotero group item key；有值时优先从后端 /api/user-center/zotero/items 拉元信息 */
  itemKey?: string;
  title?: string;
  authors?: string;
  year?: string | number;
  url?: string;
  abstract?: string;
}

interface ZoteroItemDto {
  itemKey: string;
  title: string;
  authors: string;
  year: string;
  url: string;
  abstractNote: string;
  publicationTitle: string;
}

/**
 * 批量调后端 Zotero 代理，返回 itemKey → 元信息映射。
 * 任意失败或没 itemKey 时返回空 map，调用方走手填 fallback。
 */
async function fetchZoteroByKeys(
  keys: string[],
): Promise<Record<string, ZoteroItemDto>> {
  if (keys.length === 0) return {};
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) return {};
  try {
    const res = await fetch(
      `${backendUrl}/api/user-center/zotero/items?keys=${encodeURIComponent(keys.join(","))}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return {};
    const json = (await res.json()) as {
      success: boolean;
      data?: ZoteroItemDto[];
    };
    if (!json.success || !Array.isArray(json.data)) return {};
    const map: Record<string, ZoteroItemDto> = {};
    for (const it of json.data) map[it.itemKey] = it;
    return map;
  } catch {
    return {};
  }
}

interface UserLinkItem {
  label: string;
  url: string;
}

interface Preferences {
  bio?: string;
  tagline?: string;
  links?: UserLinkItem[];
  projects?: UserProjectItem[];
  pinned_papers?: UserPaperItem[];
}

interface ProfileData {
  user: UserView;
  preferences: Preferences;
}

interface ProfileResponse {
  success: boolean;
  data?: ProfileData;
  message?: string;
}

/**
 * SSR 获取用户主页基础信息（账户 + preferences）。
 * 服务端使用 BACKEND_URL 直连 Java 后端（不走 next.config.mjs rewrites，那是给浏览器用的）。
 * 贡献文档不走后端 DB，而是在组件里从 build-time 的 site-leaderboard.json 读取，
 * 目的：每次访问 /u/{x} 省一次 Neon 查询（免费额度有限）。docs 本来就是 git-based，
 * JSON 新鲜度和 DB 一致，都是 deploy 级。
 *
 * 错误策略：只有后端明确返回 404 或 success=false 才 return null（走 notFound()）。
 * 其他失败（500 / 网关异常 / JSON 解析错 / BACKEND_URL 缺失）一律抛错，
 * 让 Next error boundary 兜底，避免把"后端故障"伪装成"用户不存在"。
 */
function warnFetchProfile(message: string, details?: Record<string, unknown>) {
  const isProduction = process.env.NODE_ENV === "production";
  const status =
    typeof details?.status === "number" ? details.status : undefined;
  const success =
    typeof details?.success === "boolean" ? details.success : undefined;
  const isExpectedNotFound = status === 404 || success === false;

  // 生产环境仅记录需要诊断的异常场景；404 / success=false 属于预期控制流，
  // 否则像爬虫扫描随机 /u/* 会产生大量无意义 warn 日志。
  if (isProduction && isExpectedNotFound) {
    return;
  }

  // 对异常/需诊断场景仍然打印：例如 403/5xx、网关异常、解析失败等，
  // 便于在 Vercel runtime logs 中查看状态码、cf-ray、响应体片段等上下文。
  console.warn(`[fetchProfile] ${message}`, details ?? {});
}

/**
 * 带重试的 profile 抓取。
 * 背景：Cloudflare 偶发会对 Vercel SSR 出口返回 403（疑似 Bot 挑战/Managed Challenge），
 * 单次失败就 500 会让正常访问的用户直接看到 Next 默认 "Application error" 黑屏。
 *
 * 策略：
 * - 404 / 200 直接返回（用户不存在或成功）
 * - 其他非 2xx（403/5xx/网关异常）做最多 2 次重试，退避 300ms / 800ms
 * - 每次失败都 console.warn，记录 status / cf-ray / 响应体前 300 字符，便于 Vercel 日志定位
 * - 重试全败才抛，让 error.tsx 兜底（不再是裸露的 Application error 页）
 *
 * 重试走 cache: "no-store"，避免把上次的 403 命中 Next Data Cache 导致 5 分钟内
 * 所有访问都拿到同一份错误。
 */
async function fetchProfile(identifier: string): Promise<ProfileData | null> {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    // 关键配置缺失不能静默 notFound，给个可见错误
    throw new Error("BACKEND_URL is not configured");
  }
  const url = `${backendUrl}/api/user-center/profile/${encodeURIComponent(identifier)}`;
  const attempts: Array<{ revalidate: number } | { noStore: true }> = [
    { revalidate: 300 }, // 首次命中：走 Next Data Cache（5min ISR），命中快
    { noStore: true }, // 第一次重试：绕过缓存
    { noStore: true }, // 第二次重试：再绕一次，防瞬时抖动
  ];

  for (let i = 0; i < attempts.length; i++) {
    const attempt = attempts[i];
    const init: RequestInit & { next?: { revalidate: number } } =
      "noStore" in attempt
        ? { cache: "no-store" }
        : { next: { revalidate: attempt.revalidate } };
    // 显式设置 UA / Accept，降低被 Cloudflare 误判 bot 的概率
    // （Node 原生 fetch 默认 UA 在某些 CF 规则下会被挑战）
    init.headers = {
      accept: "application/json",
      "user-agent": "InvolutionHell-SSR/1.0 (+https://involutionhell.com)",
    };

    let res: Response;
    try {
      res = await fetch(url, init);
    } catch (networkErr) {
      warnFetchProfile("fetch network error", {
        identifier,
        attempt: i,
        error: String(networkErr),
      });
      if (i === attempts.length - 1) throw networkErr;
      await sleep(i === 0 ? 300 : 800);
      continue;
    }

    // 404：用户确实不存在 → notFound（不重试）
    if (res.status === 404) {
      warnFetchProfile("backend 404", { identifier });
      return null;
    }
    if (res.ok) {
      const json = (await res.json()) as ProfileResponse;
      // 后端用 {success:false, message:"用户不存在"} 表示软 404
      if (!json.success || !json.data) {
        warnFetchProfile("backend success=false", {
          identifier,
          message: json.message,
        });
        return null;
      }
      return json.data;
    }

    // 非 2xx：记录诊断信息，准备重试或最终抛错
    const bodySnippet = await res
      .text()
      .then((t) => t.slice(0, 300))
      .catch(() => "<read body failed>");
    warnFetchProfile("backend non-2xx", {
      identifier,
      attempt: i,
      status: res.status,
      statusText: res.statusText,
      cfRay: res.headers.get("cf-ray"),
      cfMitigated: res.headers.get("cf-mitigated"),
      contentType: res.headers.get("content-type"),
      bodySnippet,
    });
    if (i === attempts.length - 1) {
      throw new Error(
        `profile backend ${res.status} ${res.statusText} for ${identifier} (cf-ray=${res.headers.get("cf-ray") ?? "none"})`,
      );
    }
    await sleep(i === 0 ? 300 : 800);
  }
  // 理论上不会走到：上面循环要么 return，要么 throw
  throw new Error("profile fetch exhausted without resolution");
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * 从 leaderboard JSON 按 githubId 匹配贡献记录。
 * 之前按 name 字符串匹配会踩坑（leaderboard.name = "longsizhuo"，user_accounts.username = "github_114939201"），
 * 现在按 githubId 数字匹配直接对齐。
 */
function findContributions(githubId: number | null | undefined) {
  if (githubId == null)
    return { docs: [], points: 0, commits: 0, dailyCounts: {} };
  type Row = {
    id: string;
    name: string;
    points?: number;
    commits?: number;
    avatarUrl?: string;
    contributedDocs?: Array<{ id: string; title: string; url: string }>;
    dailyCounts?: Record<string, number>;
  };
  // 先经 unknown 再转 Row[]：JSON 的字面量类型（每条 dailyCounts 都是独立的 literal）和 Row 的
  // Record<string, number> 索引签名不兼容，tsc --noEmit 会报 TS2352。先走 unknown 绕开。
  const rows = leaderboard as unknown as Row[];
  const idStr = String(githubId);
  const match = rows.find((r) => r.id === idStr);
  if (!match) return { docs: [], points: 0, commits: 0, dailyCounts: {} };
  return {
    docs: match.contributedDocs ?? [],
    points: match.points ?? 0,
    commits: match.commits ?? 0,
    dailyCounts: match.dailyCounts ?? {},
  };
}

interface Param {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Param): Promise<Metadata> {
  const { username } = await params;
  const data = await fetchProfile(username);
  if (!data) return { title: `@${username}`, robots: { index: false } };
  const displayName = data.user.displayName || data.user.username;
  const description =
    data.preferences?.bio ||
    `${displayName} on Involution Hell — projects, papers, and docs contributions.`;
  // 用 githubId 作为 canonical URL，避免 /u/github_114939201 和 /u/114939201 两个入口重复索引
  const canonicalId = data.user.githubId ?? data.user.username;
  const canonical = `/u/${canonicalId}`;
  const title = `${displayName} (@${data.user.username})`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "profile",
      title,
      description,
      url: canonical,
      images: data.user.avatarUrl ? [{ url: data.user.avatarUrl }] : undefined,
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: data.user.avatarUrl ? [data.user.avatarUrl] : undefined,
    },
  };
}

export default async function UserProfilePage({ params }: Param) {
  const { username } = await params;
  const data = await fetchProfile(username);
  if (!data) notFound();

  const t = await getTranslations("profile");
  const tDocs = await getTranslations("profile.docs");
  const { user } = data;
  const preferences = data.preferences ?? {};
  const { docs, points, commits, dailyCounts } = findContributions(
    user.githubId,
  );
  const projects = preferences.projects ?? [];
  const rawPapers = preferences.pinned_papers ?? [];
  const links = preferences.links ?? [];

  // 用 itemKey 批量拉 Zotero 元信息 → 用它填字段，覆盖手填值（手填作为离线 fallback）
  const zoteroKeys = rawPapers
    .map((p) => p.itemKey)
    .filter((k): k is string => typeof k === "string" && k.length > 0);
  const zoteroMap = await fetchZoteroByKeys(zoteroKeys);
  const papers: UserPaperItem[] = rawPapers.map((p) => {
    if (!p.itemKey) return p;
    const z = zoteroMap[p.itemKey];
    if (!z) return p; // Zotero 拉不到就用手填值兜底
    return {
      itemKey: p.itemKey,
      title: p.title || z.title,
      authors: p.authors || z.authors,
      year: p.year || z.year,
      url: p.url || z.url,
      abstract: p.abstract || z.abstractNote,
    };
  });

  // Person JSON-LD：让搜索引擎识别这是一个"个人档案"而不是普通页面，有机会走 knowledge panel
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://involutionhell.com";
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: user.displayName || user.username,
    alternateName: user.username,
    url: `${siteUrl}/u/${user.githubId ?? user.username}`,
    ...(user.avatarUrl ? { image: user.avatarUrl } : {}),
    ...(preferences.bio ? { description: preferences.bio } : {}),
    ...(user.githubId
      ? { sameAs: [`https://github.com/${user.githubId}`] }
      : {}),
    memberOf: {
      "@type": "Organization",
      name: "Involution Hell",
      url: siteUrl,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <Header />
      <main className="pt-32 pb-16 bg-[var(--background)] min-h-screen">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <header className="border-t-4 border-[var(--foreground)] pt-6 mb-12">
            <div className="flex items-baseline justify-between gap-4 flex-wrap">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                  {t("dossier")} · {t("volumeIssue", { id: user.id })}
                </div>
                <h2 className="font-serif text-4xl md:text-5xl font-black uppercase mt-2 tracking-tight text-[var(--foreground)]">
                  {user.displayName || user.username}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                {/* 编辑入口：只有本人登录状态下才显示；访问者判定由 EditProfileForm 内部做，
                    这里不做服务端鉴权，因为 satoken 存 localStorage，SSR 拿不到用户 */}
                <EditLinkIfOwner
                  ownerGithubId={user.githubId ?? null}
                  ownerUsername={user.username}
                  identifier={username}
                />
                {/* 我的分享入口：本人访问自己主页时显示，跳 /u/{identifier}/shares */}
                <SharesLinkIfOwner
                  ownerGithubId={user.githubId ?? null}
                  ownerUsername={user.username}
                  identifier={username}
                />
                {/* 开发者工具入口（所有本人都看得见；权限由目标服务自己管）：
                    目前只有 Infisical 密钥管理，未来可挂 CI token / API key 等 */}
                <DeveloperToolsIfOwner
                  ownerGithubId={user.githubId ?? null}
                  ownerUsername={user.username}
                />
                {/* 管理员自见入口：只有 roles=admin 的本人访问自己主页时才渲染 */}
                <AdminLinkIfOwnerAdmin
                  ownerGithubId={user.githubId ?? null}
                  ownerUsername={user.username}
                />
                <Link
                  href="/rank"
                  className="font-mono text-[11px] uppercase tracking-widest hover:text-[#CC0000] transition-colors flex items-center gap-1"
                >
                  {t("fullRank")}
                </Link>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-12 gap-8">
            {/* 左大块：Identity */}
            <section className="col-span-12 lg:col-span-5 border border-[var(--foreground)] p-8 lg:p-10 flex flex-col gap-6 self-start">
              <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                {t("sec.profile")}
              </span>
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.username}
                  width={96}
                  height={96}
                  className="border-2 border-[var(--foreground)]"
                />
              ) : (
                <div className="w-24 h-24 border-2 border-[var(--foreground)] flex items-center justify-center font-serif text-3xl font-black">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="font-serif text-4xl font-black italic leading-none text-[var(--foreground)]">
                  {user.displayName || user.username}
                </h1>
                <p className="font-mono text-xs text-neutral-500 mt-1">
                  @{user.username}
                </p>
                {preferences.tagline && (
                  <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                    {preferences.tagline}
                  </p>
                )}
              </div>
              {preferences.bio && (
                <p className="border-t border-[var(--foreground)] pt-4 text-[14px] leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {preferences.bio}
                </p>
              )}
              <div className="border-t border-[var(--foreground)] pt-4 grid grid-cols-3 gap-4">
                <Stat label={t("stats.docs")} value={docs.length} />
                <Stat label={t("stats.commits")} value={commits} />
                <Stat label={t("stats.points")} value={points} />
              </div>
              {/* 关注按钮 + 粉丝/关注数，客户端动态拉 */}
              <FollowButton identifier={username} targetUserId={user.id} />
              {links.length > 0 && (
                <div className="border-t border-[var(--foreground)] pt-4 flex flex-wrap gap-2">
                  {links.slice(0, 5).map((link, idx) => {
                    // 过滤 javascript: / data: 等危险 scheme，不合法直接渲染成不可点击的纯文本
                    const safe = sanitizeExternalUrl(link.url);
                    if (!safe) {
                      return (
                        <span
                          key={`${link.label}-${idx}`}
                          className="font-mono text-[10px] uppercase tracking-widest px-2 py-1 border border-dashed border-neutral-400 text-neutral-400"
                          title="链接协议不安全，已禁用"
                        >
                          {link.label}
                        </span>
                      );
                    }
                    return (
                      <a
                        key={safe}
                        href={safe}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[10px] uppercase tracking-widest px-2 py-1 border border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
                      >
                        {link.label}
                      </a>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 右侧小卡区。
                - projects/papers 有内容时：走内部 bento grid 展示卡片
                - 二者都空时：直接把"我的分享"作为 col-span-7 的直接子元素，
                  让它通过父 grid 默认 align-items:stretch 自动撑到与左侧 identity 卡同高。
                  之所以不混在内部 grid 里：嵌套 grid 的 row 高度由内容决定，
                  `h-full` 传不下去，会出现高度循环问题。 */}
            <div className="col-span-12 lg:col-span-7">
              {projects.length === 0 && papers.length === 0 ? (
                <SharesOnProfile
                  ownerGithubId={user.githubId ?? null}
                  ownerUsername={user.username}
                  identifier={username}
                />
              ) : (
                <div className="h-full grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {projects.map((p, idx) => (
                    <ProfileCard
                      key={`proj-${idx}`}
                      kind="PROJ"
                      index={idx + 1}
                      title={p.title}
                      meta={p.tags?.join(" · ")}
                      summary={p.description}
                      detail={p.description}
                      href={sanitizeExternalUrl(p.url) ?? undefined}
                    />
                  ))}
                  {papers.map((p, idx) => (
                    <ProfileCard
                      key={`paper-${idx}`}
                      kind="PAPER"
                      index={idx + 1}
                      // title 在 UserPaperItem 里允许 itemKey-only（title 可能缺），这里兜底
                      title={p.title || p.itemKey || "(untitled paper)"}
                      meta={[p.authors, p.year].filter(Boolean).join(", ")}
                      summary={p.abstract}
                      detail={p.abstract}
                      href={sanitizeExternalUrl(p.url) ?? undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 活跃度热力图：提到 Bento 之后立即显示，让数据可视化先于冗长的列表 */}
          {Object.keys(dailyCounts).length > 0 && (
            <div className="mt-12">
              <ActivityHeatmap dailyCounts={dailyCounts} />
            </div>
          )}

          {/* GitHub 公开 repos：server component 内部 fetch，零数据时自动返回 null。
              用 Suspense 包住，避免后端 /api/user-center/github/repos 慢响应阻塞整个 profile 页 TTFB。
              页面主体（identity / projects / papers）先 stream 给浏览器，repos 异步填进来。 */}
          <div className="mt-12">
            <Suspense fallback={<GithubReposSkeleton />}>
              <GithubRepos identifier={username} />
            </Suspense>
          </div>

          {/* 文档贡献列表：放最底部，紧凑列表形式（每行 ~48px），避免 docs 多的用户把页面顶得很长。
              超过 10 条时用 <details> 折叠，默认只显示前 10 */}
          {docs.length > 0 && (
            <section className="mt-12 border border-[var(--foreground)] p-6 lg:p-8 flex flex-col gap-4">
              <div className="flex items-baseline justify-between gap-3 flex-wrap border-b border-[var(--foreground)] pb-3">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                    {tDocs("sec")}
                  </div>
                  <h3 className="font-serif text-xl font-black uppercase mt-1 text-[var(--foreground)]">
                    {tDocs("heading")}
                  </h3>
                </div>
                <div className="font-mono text-[10px] text-neutral-500">
                  {tDocs("count", {
                    n: docs.length,
                    commits: commits.toLocaleString(),
                  })}
                </div>
              </div>
              <ol className="flex flex-col">
                {docs.slice(0, 10).map((doc, idx) => (
                  <DocRow key={doc.id} idx={idx + 1} doc={doc} />
                ))}
              </ol>
              {docs.length > 10 && (
                <details className="flex flex-col">
                  <summary className="font-mono text-[10px] uppercase tracking-widest text-[#CC0000] cursor-pointer hover:underline py-2">
                    {tDocs("showMore", { n: docs.length - 10 })}
                  </summary>
                  <ol className="flex flex-col mt-2">
                    {docs.slice(10).map((doc, idx) => (
                      <DocRow key={doc.id} idx={idx + 11} doc={doc} />
                    ))}
                  </ol>
                </details>
              )}
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

/** 紧凑单行文档条目 */
function DocRow({
  idx,
  doc,
}: {
  idx: number;
  doc: { id: string; title: string; url: string };
}) {
  const safe = sanitizeExternalUrl(doc.url);
  return (
    <li className="flex items-baseline gap-3 border-t border-[var(--foreground)]/20 first:border-t-0 py-2 group">
      <span className="font-mono text-[10px] text-neutral-400 w-6 shrink-0">
        {String(idx).padStart(2, "0")}
      </span>
      {safe ? (
        <Link
          href={safe}
          className="flex-1 font-serif text-sm text-[var(--foreground)] truncate group-hover:text-[#CC0000] transition-colors"
        >
          {doc.title}
        </Link>
      ) : (
        <span className="flex-1 font-serif text-sm text-neutral-400 truncate">
          {doc.title}
        </span>
      )}
    </li>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-serif text-2xl font-black text-[var(--foreground)]">
        {value.toLocaleString()}
      </div>
      <div className="font-mono text-[9px] uppercase tracking-widest text-neutral-500 mt-1">
        {label}
      </div>
    </div>
  );
}
