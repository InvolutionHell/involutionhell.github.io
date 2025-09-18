import { source } from "@/lib/source";
import { DocsPage, DocsBody } from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMDXComponents } from "@/mdx-components";
import { GiscusComments } from "@/app/components/GiscusComments";
import { getContributors } from "@/lib/github";
import { Contributors } from "@/app/components/Contributors";

interface Param {
  params: Promise<{
    slug?: string[];
  }>;
}

export default async function DocPage({ params }: Param) {
  console.log("[DocPage] Starting DocPage rendering");
  const { slug } = await params;
  const page = source.getPage(slug);

  if (page == null) {
    notFound();
  }

  // Get file path for contributors
  const filePath = "app/docs/" + page.file.path;
  console.log(`[DocPage] Document file path: ${filePath}`);

  // Fetch contributors data on server side
  const contributors = await getContributors(filePath);
  console.log(`[DocPage] Fetched ${contributors.length} contributors`);

  const Mdx = page.data.body;

  return (
    <DocsPage toc={page.data.toc}>
      <DocsBody>
        <h1 className="mb-4 text-3xl font-extrabold tracking-tight md:text-4xl">
          {page.data.title}
        </h1>
        <Mdx components={getMDXComponents()} />
        <Contributors contributors={contributors} />
        <section className="mt-16">
          <GiscusComments />
        </section>
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
