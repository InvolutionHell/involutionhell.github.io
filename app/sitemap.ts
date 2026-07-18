// app/sitemap.ts

/**
 * @file app/sitemap.ts
 * @description
 * 站点地图 (Sitemap) 生成器。
 *
 * Next.js 在构建时（静态导出）调用这个文件生成 sitemap.xml。
 *
 * i18n URL 段化改造（2026-05）后的关键变化：
 *   - 每条 URL 都带 /<locale>/ 前缀（/zh、/en）
 *   - 每条 entry 用 alternates.languages 列出另一语言的 URL，让 Google
 *     正确识别 hreflang 关系（不会把 zh / en 当成两个独立页争 PageRank）
 *   - 同一篇文档在 zh / en sitemap 各占一条
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/sitemap
 */

import type { MetadataRoute } from "next";
import { source } from "@/lib/source";
import leaderboard from "@/generated/site-leaderboard.json";
import { SITE_URL } from "@/lib/site-url";
import { routing, type Locale } from "@/i18n/routing";
import { type PageData, type DateLike } from "@/app/types/doc";

type SourcePage = ReturnType<typeof source.getPages>[number];

/**
 * Next.js 调用的默认导出函数，生成整个站点的 Sitemap。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // 1. 每个 locale 的首页 + /rank
  let latestDocDate: Date | null = null;
  for (const locale of routing.locales) {
    const homeEntry = buildLocaleEntry({
      pathname: "",
      currentLocale: locale,
      changeFrequency: "weekly",
      priority: 1,
    });
    entries.push(homeEntry);

    entries.push(
      buildLocaleEntry({
        pathname: "/rank",
        currentLocale: locale,
        changeFrequency: "daily",
        priority: 0.7,
      }),
    );

    entries.push(
      buildLocaleEntry({
        pathname: "/feed",
        currentLocale: locale,
        changeFrequency: "daily",
        priority: 0.7,
      }),
    );

    entries.push(
      buildLocaleEntry({
        pathname: "/events",
        currentLocale: locale,
        changeFrequency: "weekly",
        priority: 0.6,
      }),
    );
  }

  // 2. 文档页面：每个 locale 拿一份，按 fumadocs i18n 接口取
  for (const locale of routing.locales) {
    const pages = source.getPages(locale);
    for (const page of pages) {
      if (isDraftOrHidden(page)) continue;
      const entry = buildDocsEntry(page, locale);
      entries.push(entry);
      if (entry.lastModified instanceof Date) {
        if (!latestDocDate || entry.lastModified > latestDocDate) {
          latestDocDate = entry.lastModified;
        }
      }
    }
  }

  // 3. 个人主页 /u/[githubId]：从 build-time leaderboard JSON 枚举所有贡献者。
  // 非贡献者 / 新注册用户的 profile 不入 sitemap（爬虫进去也是空白，浪费 crawl budget）。
  // hasProfile=false 的（git 贡献者但未注册本站，#372）也排除——他们的 /u/{id}
  // 只是兜底页且 robots noindex，进 sitemap 纯属邀请爬虫来爬死链。
  type LeaderboardRow = { id?: string; hasProfile?: boolean };
  for (const locale of routing.locales) {
    for (const row of leaderboard as LeaderboardRow[]) {
      if (typeof row.id !== "string" || !/^\d+$/.test(row.id)) continue;
      if (row.hasProfile !== true) continue;
      entries.push(
        buildLocaleEntry({
          pathname: `/u/${row.id}`,
          currentLocale: locale,
          changeFrequency: "weekly",
          priority: 0.5,
        }),
      );
    }
  }

  // 4. 去重 + 排序（保持构建产物稳定）
  const unique = new Map(entries.map((e) => [e.url, e]));
  return [...unique.values()].sort((a, b) => a.url.localeCompare(b.url));
}

interface BuildLocaleEntryArgs {
  pathname: string;
  currentLocale: Locale;
  changeFrequency: NonNullable<
    MetadataRoute.Sitemap[number]["changeFrequency"]
  >;
  priority: number;
  lastModified?: Date;
}

/**
 * 通用：给 (pathname, locale) 构建一条 sitemap 入口，自动填 alternates.languages
 * 列出其它 locale 的 URL，让 Google 正确建立 hreflang 关系。
 */
function buildLocaleEntry({
  pathname,
  currentLocale,
  changeFrequency,
  priority,
  lastModified,
}: BuildLocaleEntryArgs): MetadataRoute.Sitemap[number] {
  const url = `${SITE_URL}/${currentLocale}${pathname}`;
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l === "en" ? "en-US" : "zh-CN"] = `${SITE_URL}/${l}${pathname}`;
  }
  return {
    url,
    changeFrequency,
    priority,
    ...(lastModified ? { lastModified } : {}),
    alternates: { languages },
  };
}

/**
 * 文档页 sitemap 条目。
 *
 * fumadocs i18n 接入后 source.getPages(locale) 返回该 locale 已经
 * fallback 处理过的 pages，page.slugs 是 base slug（不含 .en/.zh 后缀）。
 */
function buildDocsEntry(
  page: SourcePage,
  locale: Locale,
): MetadataRoute.Sitemap[number] {
  const slugPath = sanitizeSlugPath(page.slugs);
  const pathname = slugPath ? `/docs/${slugPath}` : "/docs";
  const fmDate = extractDateFromPage(page);
  return buildLocaleEntry({
    pathname,
    currentLocale: locale,
    changeFrequency: "monthly",
    priority: 0.6,
    lastModified: fmDate,
  });
}

function extractDateFromPage(page: SourcePage): Date | undefined {
  const data = (page.data ?? {}) as PageData;
  const candidates: DateLike[] = [
    data?.updatedAt,
    data?.updated,
    data?.lastUpdated,
    data?.frontmatter?.updatedAt,
    data?.frontmatter?.updated,
    data?.frontmatter?.lastUpdated,
    data?.date,
    data?.frontmatter?.date,
  ];
  for (const c of candidates) {
    const parsed = normalizeDate(c);
    if (parsed) return parsed;
  }
  return undefined;
}

function normalizeDate(value: DateLike): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? undefined : value;
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

function sanitizeSlugPath(slugs: string[]): string {
  return slugs
    .filter(Boolean)
    .map((s) => encodeURIComponent(s))
    .join("/");
}

function isDraftOrHidden(page: SourcePage): boolean {
  const d = (page.data ?? {}) as PageData;
  return !!(
    d.draft ||
    d.hidden ||
    d.frontmatter?.draft ||
    d.frontmatter?.hidden
  );
}
