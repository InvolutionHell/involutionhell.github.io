import Link from "next/link";
import { getTranslations } from "next-intl/server";

interface GithubRepo {
  name: string;
  fullName: string;
  description: string;
  htmlUrl: string;
  language: string;
  stars: number;
  forks: number;
  updatedAt: string;
  fork: boolean;
}

interface Props {
  /** 同 /u/{identifier}，传后端 */
  identifier: string;
}

interface ReposResponse {
  success: boolean;
  data?: GithubRepo[];
}

/**
 * 拉某用户的 GitHub 公开 repos。走后端 /api/user-center/github/repos/{id}，
 * 后端 Caffeine 缓存 1h，GITHUB_TOKEN 保 5000/hour 限流。
 * 没数据就返回空，前端直接不渲染 section。
 */
async function fetchRepos(identifier: string): Promise<GithubRepo[]> {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) return [];
  try {
    const res = await fetch(
      `${backendUrl}/api/user-center/github/repos/${encodeURIComponent(identifier)}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return [];
    const json = (await res.json()) as ReposResponse;
    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

function fmtDate(iso: string): string {
  if (!iso) return "";
  try {
    return iso.slice(0, 10);
  } catch {
    return iso;
  }
}

/**
 * GithubRepos 骨架屏。
 * profile 页用 <Suspense> 包住 GithubRepos 时作为 fallback，避免 GitHub repos API
 * （后端走 Caffeine 缓存 1h，但首次或缓存失效时可能 500ms-1s）阻塞整页 SSR 输出。
 */
export function GithubReposSkeleton() {
  return (
    <section className="border border-[var(--foreground)] p-6 lg:p-8 flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3 flex-wrap border-b border-[var(--foreground)] pb-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            REPOS
          </div>
          <h3 className="font-serif text-xl font-black uppercase mt-1 text-[var(--foreground)]">
            Loading…
          </h3>
        </div>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4" aria-hidden>
        {Array.from({ length: 4 }).map((_, i) => (
          <li
            key={i}
            className="border border-[var(--foreground)] p-4 flex flex-col gap-2"
          >
            <div className="h-4 bg-neutral-200 dark:bg-neutral-800 w-2/3 animate-pulse" />
            <div className="h-3 bg-neutral-200 dark:bg-neutral-800 w-full animate-pulse" />
            <div className="h-3 bg-neutral-200 dark:bg-neutral-800 w-5/6 animate-pulse" />
          </li>
        ))}
      </ul>
    </section>
  );
}

export async function GithubRepos({ identifier }: Props) {
  const repos = await fetchRepos(identifier);
  if (repos.length === 0) return null;
  const t = await getTranslations("profile.repos");

  return (
    <section className="border border-[var(--foreground)] p-6 lg:p-8 flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3 flex-wrap border-b border-[var(--foreground)] pb-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            {t("sec")}
          </div>
          <h3 className="font-serif text-xl font-black uppercase mt-1 text-[var(--foreground)]">
            {t("heading")}
          </h3>
          <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 mt-1">
            {t("subtitle")}
          </div>
        </div>
        <div className="font-mono text-[10px] text-neutral-500">
          {t("count", { n: repos.length })}
        </div>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {repos.map((r) => (
          <li
            key={r.fullName}
            className="border border-[var(--foreground)] p-4 flex flex-col gap-2 hover:shadow-[4px_4px_0_var(--foreground)] transition-shadow"
          >
            <div className="flex items-start justify-between gap-2">
              <Link
                href={r.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-serif text-base font-bold text-[var(--foreground)] hover:text-[#CC0000] transition-colors truncate"
              >
                {r.name}
              </Link>
              <span className="font-mono text-[10px] text-neutral-500 shrink-0">
                ★ {r.stars}
              </span>
            </div>
            {r.description && (
              <p className="text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-300 line-clamp-2">
                {r.description}
              </p>
            )}
            <div className="mt-auto flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-neutral-500">
              <span>{r.language || "—"}</span>
              <span>{fmtDate(r.updatedAt)}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
