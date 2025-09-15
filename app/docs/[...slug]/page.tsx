import { source } from "@/lib/source";
import { DocsPage, DocsBody } from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMDXComponents } from "@/mdx-components";

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

  const Mdx = page.data.body;

  return (
    <DocsPage toc={page.data.toc}>
      <DocsBody>
        <h1 className="mb-4 text-3xl font-extrabold tracking-tight md:text-4xl">
          {page.data.title}
        </h1>
        <Mdx components={getMDXComponents()} />
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
