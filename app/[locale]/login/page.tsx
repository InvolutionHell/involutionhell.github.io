import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SignInButton } from "@/app/components/SignInButton";

// SEO: 登录页不参与 index（搜索引擎不需要收录登录入口）
export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to Involution Hell with GitHub.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: true },
};

export default async function LoginPage() {
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
