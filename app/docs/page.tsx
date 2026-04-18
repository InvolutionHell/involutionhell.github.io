import { DocsPage, DocsBody } from "fumadocs-ui/page";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { SectionIndex } from "@/app/components/docs/SectionIndex";

/**
 * /docs 根路由的 landing。Header 导航的 "文档 / Docs" 直接指向 /docs，但原本
 * app/docs/ 下只有 layout.tsx + [...slug]/page.tsx（catch-all 不匹配空 slug），
 * 所以 /docs 本身 404。这个文件提供兜底 landing，复用已挂好的 DocsLayout。
 *
 * 内容交给 `<SectionIndex />`（root 不传 → 渲染 pageTree 顶层分区）。所有渲染
 * 逻辑和 community / career/interview-prep/leetcode 两处共用同一个组件，避免 drift。
 */

async function getLocaleFromCookie(): Promise<"zh" | "en"> {
  const cookieStore = await cookies();
  return cookieStore.get("locale")?.value === "en" ? "en" : "zh";
}

export default async function DocsRootPage() {
  const locale = await getLocaleFromCookie();
  const heading = locale === "en" ? "Knowledge Base" : "文档总览";
  const intro =
    locale === "en"
      ? "Pick a section to dive in. Everything here is community-contributed and Git-based — edits flow through pull requests."
      : "从下面任意一个分区进入。所有内容都来自社区贡献，基于 Git 管理，修改走 Pull Request 流程。";

  return (
    <DocsPage>
      <DocsBody>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl mb-4">
          {heading}
        </h1>
        <p className="text-base text-fd-muted-foreground mb-8">{intro}</p>
        <SectionIndex />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromCookie();
  return {
    title: locale === "en" ? "Docs" : "文档",
    description:
      locale === "en"
        ? "Involution Hell community knowledge base — AI, CS, jobs, community shares."
        : "Involution Hell 社区知识库 — AI、计算机基础、求职、群友分享等分区总览。",
  };
}
