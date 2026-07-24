import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import { routing } from "@/i18n/routing";
import { McpConnectClient } from "./McpConnectClient";

export const metadata: Metadata = {
  title: "MCP 连接 / MCP Connect · Involution Hell",
  description:
    "连接 Involution Hell MCP：为 Claude Code、Codex、Cursor、VS Code 等客户端生成可复制的搜索与发布配置。Connect your MCP client with ready-to-copy search and publishing setup.",
  alternates: { canonical: "/mcp" },
  openGraph: {
    title: "MCP Connect · Involution Hell",
    description:
      "Ready-to-copy MCP setup for searching and publishing Involution Hell content.",
    url: "/mcp",
    type: "website",
  },
};

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function McpConnectPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[var(--background)] pb-20 pt-36 newsprint-texture">
        <McpConnectClient locale={locale} />
      </main>
      <Footer />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
