import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/app/components/ui/button";
import NotFoundTracker from "./not-found-tracker";

// 必须是 Server Component：爬虫向 / 发 POST 时 Next 走 Server Action 路径，
// not-found 渲染不经过 layout，NextIntlClientProvider 不在树里，
// useTranslations 会抛 "No intl context"。getTranslations 走 server，
// 直接读 i18n/request.ts，没有 provider 依赖。
export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
      <div className="bg-[url('/cloud_2.png')] bg-cover bg-center absolute inset-0 opacity-10 pointer-events-none" />
      <div className="z-10 flex flex-col items-center space-y-6 text-center">
        <h1 className="text-9xl font-black italic tracking-tighter">404</h1>
        <h2 className="text-2xl font-bold uppercase tracking-widest">
          {t("heading")}
        </h2>
        <p className="max-w-md text-muted-foreground">{t("body")}</p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/">{t("cta")}</Link>
        </Button>
      </div>
      <NotFoundTracker />
    </div>
  );
}
