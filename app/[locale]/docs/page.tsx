import { DocsPage, DocsBody } from "fumadocs-ui/page";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { SectionIndex } from "@/app/components/docs/SectionIndex";
import { routing } from "@/i18n/routing";
import { ensureSeoDescription } from "@/lib/seo-description";

/**
 * /[locale]/docs 根路由的 landing。Header 的 "文档 / Docs" 链接指到 /docs，
 * 但 docs/[...slug] catch-all 不匹配空 slug，所以 /docs 本身 404。这个文件
 * 提供兜底 landing，复用已挂好的 DocsLayout。
 *
 * 内容交给 `<SectionIndex />`（root 不传 → 渲染 pageTree 顶层分区）。所有
 * 渲染逻辑和 community / career/interview-prep/leetcode 两处共用同一个组
 * 件，避免 drift。
 */

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function DocsRootPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  // 走统一兜底：原文本只 ~60 字符，被 Bing 判定为太短。ensureSeoDescription
  // 会自动补足到 80+ 字符，并保持中英分别的 tagline。
  return {
    title: locale === "en" ? "Docs" : "文档",
    description: ensureSeoDescription({
      description:
        locale === "en"
          ? "Involution Hell community knowledge base — AI, CS, jobs, community shares."
          : "Involution Hell 社区知识库 — AI、计算机基础、求职、群友分享等分区总览。",
      title: locale === "en" ? "Docs" : "文档",
      locale,
    }),
  };
}
