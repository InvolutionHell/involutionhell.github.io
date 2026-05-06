import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * locale-aware 的导航 API。
 *
 * 用法：
 *   import { Link, useRouter, usePathname, redirect } from "@/i18n/navigation";
 *
 *   <Link href="/docs">文档</Link>            // 自动加上当前 locale 前缀
 *   <Link href="/" locale="en">Switch</Link>  // 显式切到另一个语言
 *   const router = useRouter();
 *   router.push("/docs");                     // push 时自动带当前 locale
 *
 * 替代点：
 *   - next/link 的 <Link>
 *   - next/navigation 的 useRouter / usePathname / redirect
 *   - 在 user-facing 路由（app/[locale]/...）下必须用这套，
 *     否则会拿到错的 pathname / 失去 locale 前缀。
 *   - admin / api 不在 [locale] 段下，那里继续用 next/link / next/navigation。
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
