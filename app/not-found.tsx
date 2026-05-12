import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import NotFoundTracker from "./not-found-tracker";

// 根 not-found 必须保持静态：用 next-intl 的 getTranslations 会触发 cookies()
// 让这条路由退化成 ƒ Dynamic，每条 404 / scanner 扫描就吃一次 Fluid CPU。
// 双语并列是 trade-off —— 根级 not-found 拿不到 locale。
export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
      <div className="bg-[url('/cloud_2.png')] bg-cover bg-center absolute inset-0 opacity-10 pointer-events-none" />
      <div className="z-10 flex flex-col items-center space-y-6 text-center">
        <h1 className="text-9xl font-black italic tracking-tighter">404</h1>
        <h2 className="text-2xl font-bold uppercase tracking-widest">
          页面不存在 · Page not found
        </h2>
        <p className="max-w-md text-muted-foreground">
          你访问的页面可能已被移动或不存在。Try going back home.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/">返回首页 · Back to home</Link>
        </Button>
      </div>
      <NotFoundTracker />
    </div>
  );
}
