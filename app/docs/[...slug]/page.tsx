import { source } from "@/lib/source";
import { DocsPage, DocsBody } from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMDXComponents } from "@/mdx-components";
import { GiscusComments } from "@/app/components/GiscusComments";
import { EditOnGithub } from "@/app/components/EditOnGithub";
import { buildDocsEditUrl, getContributors } from "@/lib/github";
import { Contributors } from "@/app/components/Contributors";
import { DocsAssistant } from "@/app/components/DocsAssistant";
import fs from "fs/promises";
import path from "path";

// Extract clean text content from MDX
function extractTextFromMDX(content: string): string {
  return content
    .replace(/^---[\s\S]*?---/m, "") // Remove frontmatter
    .replace(/```[\s\S]*?```/g, "") // Remove code blocks
    .replace(/`([^`]+)`/g, "$1") // Remove inline code
    .replace(/<[^>]+>/g, "") // Remove HTML/MDX tags
    .replace(/\*\*([^*]+)\*\*/g, "$1") // Remove bold
    .replace(/\*([^*]+)\*/g, "$1") // Remove italic
    .replace(/#{1,6}\s+/g, "") // Remove headers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove links, keep text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1") // Remove images, keep alt text
    .replace(/[#*`\[\]()!]/g, "") // Remove common markdown symbols
    .replace(/\n{2,}/g, "\n") // Normalize line breaks
    .trim();
}

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
  // Get file path for contributors
  const filePath = "app/docs/" + page.file.path;
  // Fetch contributors data on server side
  const contributors = await getContributors(filePath);
  const Mdx = page.data.body;

  // Prepare page content for AI assistant
  let pageContentForAI = "";
  try {
    const fullFilePath = path.join(process.cwd(), "app/docs", page.file.path);
    const rawContent = await fs.readFile(fullFilePath, "utf-8");
    const extractedText = extractTextFromMDX(rawContent);
    // Use full extracted content without truncation
    pageContentForAI = extractedText;
  } catch (error) {
    console.warn("Failed to read file content for AI assistant:", error);
    // Fallback to using page metadata
    pageContentForAI = `${page.data.title}\n${page.data.description || ""}`;
  }

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
          <Contributors contributors={contributors} />
          <section className="mt-16">
            <GiscusComments />
          </section>
        </DocsBody>
      </DocsPage>
      <DocsAssistant
        pageContext={{
          title: page.data.title,
          description: page.data.description,
          content: pageContentForAI,
          slug: slug?.join("/"),
        }}
      />
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
