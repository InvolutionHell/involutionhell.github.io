// app/sitemap.ts

/**
 * @file app/sitemap.ts
 * @description
 * 站点地图 (Sitemap) 生成器。
 * * Next.js 会在构建时或运行时（如果设为动态）访问这个文件来生成 sitemap.xml。
 * 这个文件负责：
 * 1. 从 `source` (如 Contentlayer) 获取所有文档页面。
 * 2. 为首页（"/"）创建一个入口。
 * 3. 为所有非草稿 (draft) 或非隐藏 (hidden) 的文档页面创建入口。
 * 4. 从每个页面的 frontmatter 中提取最合适的“最后修改日期”。
 * 5. 合并所有入口，去重并排序，然后返回符合 Next.js 要求的格式。
 *
 * (变更): 此文件已被修改为纯静态生成（移除了 new Date()），
 * 以解决 GSC (Google Search Console) 因 Serverless Function 冷启动超时而无法读取的问题。
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/sitemap
 */

import type { MetadataRoute } from "next";
import { source } from "@/lib/source";
import leaderboard from "@/generated/site-leaderboard.json";
// SITE_URL 由 lib/site-url.ts 统一提供（从 NEXT_PUBLIC_SITE_URL 读 + 归一化），
// 这里和 app/robots.ts 共用一份，避免两边 drift。
import { SITE_URL } from "@/lib/site-url";
import { type PageData, type DateLike } from "@/app/types/doc";

/** * 定义 `source.getPages()` 返回的单个页面对象的类型别名
 */
type SourcePage = ReturnType<typeof source.getPages>[number];

/**
 * Next.js 会调用的默认导出函数，用于生成整个站点的 Sitemap。
 * * @returns {MetadataRoute.Sitemap} 一个包含所有站点地图条目的数组。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = source.getPages();

  // 1. 生成所有文档页面的 sitemap 条目
  const docsEntries = pages
    .filter((p) => !isDraftOrHidden(p)) // 过滤掉草稿和隐藏页面
    .map(buildDocsEntry); // 将页面数据转换为 sitemap 条目

  // 2. (优化) 寻找所有文档中最新的修改日期
  const latestDocDate = docsEntries.reduce(
    (latest, entry) => {
      if (entry.lastModified) {
        // 确保 entry.lastModified 是 Date 对象实例
        const entryDate = new Date(entry.lastModified);
        if (!latest || entryDate > latest) {
          return entryDate;
        }
      }
      return latest; // 否则保持 'latest' 不变
    },
    null as Date | null,
  ); // 初始值为 null

  // 3. 为首页创建 sitemap 条目
  const homeEntry: MetadataRoute.Sitemap[number] = {
    url: SITE_URL, // 站点的根 URL

    // [GSC 修复] 移除 `new Date()`，使其变为静态生成
    // 仅当 latestDocDate 存在时才添加 lastModified 字段
    ...(latestDocDate ? { lastModified: latestDocDate } : {}),

    changeFrequency: "weekly", // 首页可能每周都有变化
    priority: 1, // 首页是最高优先级
  };

  // 4. /rank 排行榜页（静态路由）
  const rankEntry: MetadataRoute.Sitemap[number] = {
    url: `${SITE_URL}/rank`,
    changeFrequency: "daily", // 贡献排行榜每天都可能变
    priority: 0.7,
  };

  // 5. 个人主页 /u/[githubId] — 从 build-time leaderboard JSON 枚举所有贡献者。
  // 非贡献者 / 新注册用户的 profile 不入 sitemap（search crawler 进去也是空白，浪费 crawl budget）。
  type LeaderboardRow = { id?: string };
  const profileEntries: MetadataRoute.Sitemap = (
    leaderboard as LeaderboardRow[]
  )
    .filter((r) => typeof r.id === "string" && /^\d+$/.test(r.id))
    .map((r) => ({
      url: `${SITE_URL}/u/${r.id}`,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));

  // 6. 合并与处理
  const unique = new Map(docsEntries.map((e) => [e.url, e]));

  // 返回合并后的数组：首页 + /rank + 贡献者 profiles + (去重后的文档页)
  return [
    homeEntry,
    rankEntry,
    ...profileEntries,
    ...[...unique.values()].sort((a, b) => a.url.localeCompare(b.url)),
  ];
}

/**
 * 将单个文档页面对象 (SourcePage) 转换为 Sitemap 条目。
 * * @param {SourcePage} page - 从 `source.getPages()` 获取的单个页面对象。
 * @returns {MetadataRoute.Sitemap[number]} 一个 Sitemap 条目对象。
 */
function buildDocsEntry(page: SourcePage): MetadataRoute.Sitemap[number] {
  const slugPath = sanitizeSlugPath(page.slugs);
  const url = slugPath ? `${SITE_URL}/docs/${slugPath}` : `${SITE_URL}/docs`;
  const fmDate = extractDateFromPage(page);

  const entry: MetadataRoute.Sitemap[number] = {
    url,
    changeFrequency: "monthly",
    priority: 0.6,
    ...(fmDate ? { lastModified: fmDate } : {}),
  };

  return entry;
}

/**
 * 从页面的 data/frontmatter 中按优先级提取最合适的日期。
 * * @param {SourcePage} page - 页面对象。
 * @returns {Date | undefined} 解析后的 Date 对象，如果找不到或无效则返回 undefined。
 */
function extractDateFromPage(page: SourcePage): Date | undefined {
  // (FIX) 使用我们定义的 PageData 类型，而不是 'as' 一个匿名对象
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

/**
 * 将一个不确定类型的值（DateLike）转换为标准的 Date 对象。
 * * @param {DateLike} value - 可能是 Date, string, number, null 或 undefined。
 * @returns {Date | undefined} 如果值为有效日期，则返回 Date 对象；否则返回 undefined。
 */
function normalizeDate(value: DateLike): Date | undefined {
  if (!value) return undefined;

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? undefined : value;
  }

  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

/**
 * 将 slugs 数组清理并转换为 URL 路径字符串。
 * * @param {string[]} slugs - 来源于 page.slugs 的数组。
 * @returns {string} 组合后的路径，例如 "segment1/segment2"。
 */
function sanitizeSlugPath(slugs: string[]): string {
  return slugs
    .filter(Boolean)
    .map((s) => encodeURIComponent(s))
    .join("/");
}

/**
 * 检查页面是否被标记为草稿 (draft) 或隐藏 (hidden)。
 * * @param {SourcePage} page - 页面对象。
 * @returns {boolean} 如果是草稿或隐藏，返回 true。
 */
function isDraftOrHidden(page: SourcePage): boolean {
  // [BUILD 修复] 使用我们定义的 PageData 类型来代替 'any'
  const d = (page.data ?? {}) as PageData;

  // 检查顶层或 'frontmatter' 嵌套下的 'draft' 或 'hidden' 标志
  return !!(
    d.draft ||
    d.hidden ||
    d.frontmatter?.draft ||
    d.frontmatter?.hidden
  );
}
