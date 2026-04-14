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
// Extract clean text content from MDX - no longer used on client/page side
// content fetching moved to API route for performance

interface Param {
  params: Promise<{
    slug?: string[];
  }>;
}

export default async function DocPage({ params }: Param) {
  const { slug } = await params;
  const page = source.getPage(slug);

  if (page == null) {
    notFound();
  }

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

  return (
    <>
      <DocsPage toc={page.data.toc}>
        <DocsBody>
          <div className="mb-6 flex flex-col gap-3 border-b border-border pb-6 md:mb-8 md:flex-row md:items-start md:justify-between">
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              {page.data.title}
            </h1>
            <EditOnGithub href={editUrl} />
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
  const page = source.getPage(slug);
  if (page == null) {
    notFound();
  }

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
