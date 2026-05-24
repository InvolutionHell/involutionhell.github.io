import { source } from "@/lib/source";
import { safeJsonLdString } from "@/lib/json-ld";
import { SITE_URL } from "@/lib/site-url";
import { ensureSeoDescription } from "@/lib/seo-description";
import { DocsPage, DocsBody } from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
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
import { routing } from "@/i18n/routing";
import { type PageData } from "@/app/types/doc";

interface Param {
  params: Promise<{
    locale: string;
    slug?: string[];
  }>;
}

// 显式声明 force-static：让 Next.js 严格按 generateStaticParams 预渲染
// 所有 (locale, slug) 组合，未列出的不允许动态生成。
// 没有这条时，build 表里 ƒ Dynamic 标签会让 docs 走运行时渲染（即使加了
// setRequestLocale 也不一定 prerender）。
export const dynamic = "force-static";

export default async function DocPage({ params }: Param) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  // 启用 SSG（让 next-intl 不去 await cookies/headers）
  setRequestLocale(locale);

  // fumadocs i18n 接口：传 locale 后会按 .en / .zh 后缀加载对应文件，
  // 找不到时按 source.ts 配的 fallbackLanguage='zh' 回退到原文。
  const page = source.getPage(slug, locale);
  if (page == null) {
    notFound();
  }

  // 统一通过工具函数生成 Edit 链接，内部已处理中文目录编码
  const editUrl = buildDocsEditUrl(page.path);
  const data = page.data as PageData;
  const docIdFromPage = data.docId ?? data.frontmatter?.docId;

  const contributorsEntry =
    getDocContributorsByPath(page.file.path) ||
    getDocContributorsByDocId(docIdFromPage);
  const Mdx = page.data.body;

  // SEO 结构化数据：URL 含 locale 前缀
  const slugPath = (slug ?? []).join("/");
  const docUrl = slugPath
    ? `${SITE_URL}/${locale}/docs/${slugPath}`
    : `${SITE_URL}/${locale}/docs`;

  // JSON-LD description 同步走兜底：避免结构化数据里出现空字符串，否则
  // Google Rich Results 测试会 warning。与 generateMetadata 里的逻辑一致。
  const sectionPathForJsonLd =
    (slug ?? []).length > 1 ? (slug ?? []).slice(0, -1) : [];
  const articleDescription = ensureSeoDescription({
    description: page.data.description,
    title: page.data.title,
    sectionPath: sectionPathForJsonLd,
    locale,
  });

  // TechArticle: 让 docs 在 Google 搜索结果上更可能展示为技术文章卡片
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: page.data.title,
    description: articleDescription,
    url: docUrl,
    inLanguage: locale === "en" ? "en-US" : "zh-CN",
    publisher: {
      "@type": "Organization",
      name: "Involution Hell",
      url: SITE_URL,
    },
  };

  // BreadcrumbList: 按 slug 层级生成面包屑
  const breadcrumbItems = [
    { name: "Involution Hell", url: `${SITE_URL}/${locale}` },
    { name: "Docs", url: `${SITE_URL}/${locale}/docs` },
    ...(slug ?? []).map((seg, idx) => ({
      name: decodeURIComponent(seg),
      url: `${SITE_URL}/${locale}/docs/${slug!.slice(0, idx + 1).join("/")}`,
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
        dangerouslySetInnerHTML={{ __html: safeJsonLdString(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: safeJsonLdString(breadcrumbJsonLd) }}
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

/**
 * generateStaticParams: 给每个 base slug × 每个 locale 出一份预渲染参数。
 *
 * fumadocs 的 source.generateParams('slug', 'lang') 会自动产出这种结构，
 * 但我们的 i18n 段名是 'locale'（next-intl 约定），所以 mapping 一下。
 *
 * 双语预渲染规模：约 318 base × 2 = 636 页 SSG。fallbackLanguage='zh'
 * 让翻译版缺失的 en 页面也能预渲染（直接拿原文）。
 */
export async function generateStaticParams() {
  return source.generateParams("slug", "lang").map((p) => ({
    locale: p.lang as string,
    slug: p.slug as string[],
  }));
}

export async function generateMetadata({ params }: Param): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const page = source.getPage(slug, locale);
  if (page == null) {
    notFound();
  }

  // canonical: 当前 locale 的本语言 URL（每个语言独立 canonical，避免 zh/en
  // 互相竞争 PageRank）。
  const slugPath = (slug ?? []).join("/");
  const canonical = slugPath
    ? `/${locale}/docs/${slugPath}`
    : `/${locale}/docs`;

  // hreflang：告诉 Google 同一文档的另一语言 URL 在哪。
  const langs: Record<string, string> = {};
  for (const l of routing.locales) {
    const url = slugPath ? `/${l}/docs/${slugPath}` : `/${l}/docs`;
    langs[l === "en" ? "en-US" : "zh-CN"] = url;
  }
  langs["x-default"] = `/${routing.defaultLocale}/docs/${slugPath}`.replace(
    /\/$/,
    "",
  );

  // SEO description 兜底：page.data.description 可能为 undefined/空/极短
  // （96 个 leetcode 题解完全没 description，67 个空，35 个 < 20 字符）。
  // 用 ensureSeoDescription 拼 title + 面包屑 + 站点 tagline 补到 80+ 字符，
  // 让 Bing/Google 拿到完整摘要而不是从正文随便抓一段。
  // sectionPath 取 slug 除末段外的所有段（末段是当前页本身，已在 title 里）。
  const slugArr = slug ?? [];
  const sectionPath = slugArr.length > 1 ? slugArr.slice(0, -1) : [];
  const safeDescription = ensureSeoDescription({
    description: page.data.description,
    title: page.data.title,
    sectionPath,
    locale,
  });

  return {
    title: page.data.title,
    description: safeDescription,
    alternates: { canonical, languages: langs },
    openGraph: {
      type: "article",
      title: page.data.title,
      description: safeDescription,
      url: canonical,
      locale: locale === "en" ? "en_US" : "zh_CN",
    },
    twitter: {
      card: "summary_large_image",
      title: page.data.title,
      description: safeDescription,
    },
  };
}
