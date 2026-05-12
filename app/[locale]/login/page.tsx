import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { SignInButton } from "@/app/components/SignInButton";
import { routing } from "@/i18n/routing";

// SEO: 登录页不参与 index（搜索引擎不需要收录登录入口）
export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to Involution Hell with GitHub.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: true },
};

/**
 * /[locale]/login —— SSG 化（dev_docs/vercel-cpu-overage-2026-05.md H2）。
 *
 * 之前没 setRequestLocale，next-intl 退回 cookies() 推断 locale，整页 ƒ
 * Dynamic。login 是纯静态卡片 + 一个 client 按钮，没有理由每请求都 SSR。
 * 加 params + setRequestLocale + generateStaticParams 让两个 locale build 时
 * 预渲染，登录页所有访问都从 CDN 出。
 */
interface Props {
  params: Promise<{ locale: string }>;
}

export default async function LoginPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("login");
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">{t("heading")}</h1>
          <p className="text-muted-foreground">{t("subheading")}</p>
        </div>
        <div className="flex justify-center">
          <SignInButton />
        </div>
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
