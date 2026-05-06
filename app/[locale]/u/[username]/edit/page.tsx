import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import { EditProfileForm } from "./EditProfileForm";
import { getTranslations } from "next-intl/server";

interface Param {
  params: Promise<{ username: string }>;
}

/**
 * 个人主页编辑页。
 * 访问权限校验放在客户端组件 EditProfileForm 里（读 useAuth），
 * 因为 SSR 阶段还不知道用户是谁（satoken 存 localStorage）。
 */
export default async function EditProfilePage({ params }: Param) {
  const { username } = await params;
  const t = await getTranslations("profile.edit");
  return (
    <>
      <Header />
      <main className="pt-32 pb-16 bg-[var(--background)] min-h-screen">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <header className="border-t-4 border-[var(--foreground)] pt-6 mb-12">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500">
              {t("pageHeader")}
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-black uppercase mt-2 tracking-tight text-[var(--foreground)]">
              {t("pageTitle")}
            </h1>
          </header>
          <EditProfileForm targetIdentifier={username} />
        </div>
      </main>
      <Footer />
    </>
  );
}
