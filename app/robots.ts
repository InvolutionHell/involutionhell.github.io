// app/robots.ts

/**
 * @file app/robots.ts
 * @description
 * 站点 robots.txt 生成器（Next.js App Router 约定文件）。
 *
 * 屏蔽以下路径：
 * - /admin/    —— 后台管理页，登录态专属，没必要入索引
 * - /editor/   —— 编辑器页，登录态专属
 * - /settings/ —— 用户设置，登录态专属
 * - /login     —— 登录页，入搜索引擎反而会诱导钓鱼
 * - /api/      —— 所有服务端接口，不是给爬虫看的
 *
 * sitemap 指向 app/sitemap.ts 产出的 /sitemap.xml，hostname 复用同一份 NEXT_PUBLIC_SITE_URL。
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/robots
 */

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/editor/", "/settings/", "/login", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
