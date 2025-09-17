import { source } from "@/lib/source";
import { DocsPage, DocsBody } from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMDXComponents } from "@/mdx-components";
import { GiscusComments } from "@/app/components/GiscusComments";
import { EditOnGithub } from "@/app/components/EditOnGithub";
import { buildDocsEditUrl } from "@/lib/github";

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

  const Mdx = page.data.body;

  return (
    <DocsPage toc={page.data.toc}>
      <DocsBody>
        <div className="mb-6 flex flex-col gap-3 border-b border-border pb-6 md:mb-8 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            {page.data.title}
          </h1>
          <EditOnGithub href={editUrl} />
        </div>
        <Mdx components={getMDXComponents()} />
        <GiscusComments className="mt-16" />
      </DocsBody>
    </DocsPage>
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
