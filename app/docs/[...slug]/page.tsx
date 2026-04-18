import { source } from "@/lib/source";
import { DocsPage, DocsBody } from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMDXComponents } from "@/mdx-components";
import { GiscusComments } from "@/app/components/GiscusComments";
import { EditOnGithub } from "@/app/components/EditOnGithub";
import { buildDocsEditUrl } from "@/lib/github";
import {
  getDocContributorsByPath,
  getDocContributorsByDocId,
} from "@/lib/contributors";
import { Contributors } from "@/app/components/Contributors";
import { DocsAssistant } from "@/app/components/DocsAssistant";
import { LicenseNotice } from "@/app/components/LicenseNotice";
import { PageFeedback } from "@/app/components/PageFeedback";
import { DocHistoryPanel } from "@/app/components/DocHistoryPanel";
import { DocShareButton } from "@/app/components/DocShareButton";
import { cookies } from "next/headers";
// Extract clean text content from MDX - no longer used on client/page side
// content fetching moved to API route for performance

interface Param {
  params: Promise<{
    slug?: string[];
  }>;
}

/** 从 cookie 读取用户语言偏好，未设置时返回 null */
async function getLocaleFromCookie(): Promise<"zh" | "en" | null> {
  const cookieStore = await cookies();
  const val = cookieStore.get("locale")?.value;
  if (val === "zh" || val === "en") return val;
  return null;
}

/**
 * 根据 locale 尝试加载对应语言版本的文档。
 * 翻译文件命名规则：原文 slug 最后一段加上语言后缀，例如
 *   slug = ["ai", "rl"] → 英文版尝试 ["ai", "rl.en"]
 *
 * 若对应翻译版不存在，fallback 到原文。
 */
function getPageWithLocale(
  slug: string[] | undefined,
  locale: "zh" | "en" | null,
) {
  const originalPage = source.getPage(slug);
  if (!locale || !slug || slug.length === 0)
    return { page: originalPage, isFallback: false };

  const originalLang =
    (originalPage?.data as { lang?: string } | undefined)?.lang ?? null;

  // 已经是目标语言，直接返回
  if (originalLang === locale) return { page: originalPage, isFallback: false };

  // 尝试加载翻译版：slug 末尾加语言后缀
  const lastSegment = slug[slug.length - 1];
  const translatedSlug = [...slug.slice(0, -1), `${lastSegment}.${locale}`];
  const translatedPage = source.getPage(translatedSlug);

  if (translatedPage) {
    return { page: translatedPage, isFallback: false };
  }

  // 翻译版不存在，fallback 到原文
  return { page: originalPage, isFallback: true };
}

export default async function DocPage({ params }: Param) {
  const { slug } = await params;
  const locale = await getLocaleFromCookie();
  const { page } = getPageWithLocale(slug, locale);

  if (page == null) {
    notFound();
  }

  // 静默 fallback：翻译版不存在时直接展示原文，不再显示"暂无英文版"横幅
  // 原因：中文为默认语言，大多数文档本身就是中文；显示 banner 反而让 UI 碍眼

  // 统一通过工具函数生成 Edit 链接，内部已处理中文目录编码
  const editUrl = buildDocsEditUrl(page.path);
  const docIdFromPage =
    (page.data as { docId?: string; frontmatter?: { docId?: string } })
      ?.docId ??
    (page.data as { docId?: string; frontmatter?: { docId?: string } })
      ?.frontmatter?.docId;

  const contributorsEntry =
    getDocContributorsByPath(page.file.path) ||
    getDocContributorsByDocId(docIdFromPage);
  const Mdx = page.data.body;

  // SEO 结构化数据
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://involutionhell.com";
  const slugPath = (slug ?? []).join("/");
  const docUrl = slugPath ? `${siteUrl}/docs/${slugPath}` : `${siteUrl}/docs`;

  // TechArticle: 让 docs 在 Google 搜索结果上更可能展示为技术文章卡片
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: page.data.title,
    description: page.data.description,
    url: docUrl,
    inLanguage: locale === "en" ? "en-US" : "zh-CN",
    publisher: {
      "@type": "Organization",
      name: "Involution Hell",
      url: siteUrl,
    },
  };

  // BreadcrumbList: 按 slug 层级生成面包屑（Google 搜索结果里的那种层级链接）
  const breadcrumbItems = [
    { name: "Involution Hell", url: siteUrl },
    { name: "Docs", url: `${siteUrl}/docs` },
    ...(slug ?? []).map((seg, idx) => ({
      name: decodeURIComponent(seg),
      url: `${siteUrl}/docs/${slug!.slice(0, idx + 1).join("/")}`,
    })),
  ];
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <DocsPage toc={page.data.toc}>
        <DocsBody>
          <div className="mb-6 flex flex-col gap-3 border-b border-border pb-6 md:mb-8 md:flex-row md:items-start md:justify-between">
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              {page.data.title}
            </h1>
            <div className="flex items-center gap-2">
              <DocShareButton />
              <EditOnGithub href={editUrl} />
            </div>
          </div>
          <Mdx components={getMDXComponents()} />
          <Contributors entry={contributorsEntry} />
          <PageFeedback />
          <section className="mt-16">
            <GiscusComments docId={docIdFromPage ?? null} />
          </section>
          <section className="mt-12">
            <DocHistoryPanel path={page.file.path} />
          </section>
          <LicenseNotice className="mt-16" />
        </DocsBody>
      </DocsPage>
      <DocsAssistant
        pageContext={{
          title: page.data.title,
          description: page.data.description,
          slug: slug?.join("/"),
        }}
      />
    </>
  );
}

export async function generateStaticParams() {
  return source.getPages().map((page) => ({
    slug: page.slugs,
  }));
}

export async function generateMetadata({ params }: Param): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocaleFromCookie();
  // metadata 需与页面主体同语言，避免英文页显示中文 title/desc 造成 SEO 错乱
  const { page } = getPageWithLocale(slug, locale);
  if (page == null) {
    notFound();
  }

  // 规范化 slug → canonical 路径。用户访问 /docs/learn/ai/rl（原文）或 /docs/learn/ai/rl.en（翻译版）
  // 都统一指向原始 slug，避免两个 URL 竞争同一份内容的 PageRank。
  const slugPath = (slug ?? []).join("/");
  const canonical = slugPath ? `/docs/${slugPath}` : "/docs";

  // hreflang：告诉搜索引擎该文档有哪些语言版本。
  // 翻译版文件命名是 `<slug>.en.mdx` / `<slug>.zh.mdx`，URL 靠 cookie 切换，
  // 两种语言走同一 canonical URL，因此 hreflang 都指向自己。
  const languages: Record<string, string> = {
    "zh-CN": canonical,
    "en-US": canonical,
    "x-default": canonical,
  };

  return {
    title: page.data.title,
    description: page.data.description,
    alternates: { canonical, languages },
    openGraph: {
      type: "article",
      title: page.data.title,
      description: page.data.description,
      url: canonical,
      locale: locale === "en" ? "en_US" : "zh_CN",
    },
    twitter: {
      card: "summary_large_image",
      title: page.data.title,
      description: page.data.description,
    },
  };
}
