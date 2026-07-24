import type { Metadata } from "next";
import { Suspense } from "react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { SignInButton } from "@/app/components/SignInButton";
import { LoginErrorNotice } from "@/app/components/LoginErrorNotice";
import { routing } from "@/i18n/routing";

// SEO: 登录页不参与 index（搜索引擎不需要收录登录入口）
export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to Involution Hell with GitHub.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: true },
};

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
        <Suspense fallback={null}>
          <LoginErrorNotice
            messages={{
              discord_canary: t("errorDiscordCanary"),
              generic: t("errorGeneric"),
            }}
          />
        </Suspense>
        <div className="flex flex-col items-center gap-3">
          <SignInButton provider="github" label={t("github")} />
          {/* Discord 登录灰度中：后端按 Discord id 白名单放行（auth.discord.allowlist），
              名单外的人点了会被回调弹回 /login?error=discord_canary。GA（OTP wiring 完成、
              清空白名单）后此按钮即对所有人开放。 */}
          <SignInButton provider="discord" label={t("discord")} />
        </div>
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
