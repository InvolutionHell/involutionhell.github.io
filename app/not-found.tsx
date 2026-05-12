import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import NotFoundTracker from "./not-found-tracker";

/**
 * 根 not-found.tsx —— 当 URL 完全不匹配任何 route segment 时 Next 渲染这里。
 *
 * 为什么必须保持静态（修复 Vercel CPU 超额，dev_docs/vercel-cpu-overage-2026-05.md）：
 *   之前版本 await getTranslations("notFound") 让这条路由变 ƒ Dynamic。
 *   线上所有 .env / wp- / php / graphql 漏洞扫描都落到这条 404 页面，每条扫描
 *   = 1 Fluid 调用 + 1 client-side analytics POST。18:34 单一时间窗就有
 *   30+ 条扫描，月度累积是 CPU 配额的主要消耗源之一。
 *
 *   修复策略：去掉 next-intl 依赖（getTranslations 内部走 cookies()，自动
 *   force-dynamic），改成根目录 not-found 用 hardcoded 双语，让 Next 把这条
 *   静态生成。之后所有 scanner 404 直接由 CDN 兜底，0 Fluid CPU。
 *
 *   /[locale]/not-found.tsx 由 [locale] segment 各自的 not-found 处理，那里
 *   可以走完整 i18n。根 not-found 只是兜最外层 404，少数情况触发。
 *
 * NotFoundTracker：保留 client 端 umami 埋点。它在浏览器里跑，不影响服务端
 * 静态化判定（client-only useEffect 不会让 RSC 树 dynamic）。
 */
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
