// app/robots.ts

/**
 * @file app/robots.ts
 * @description
 * 站点 robots.txt 生成器（Next.js App Router 约定文件）。
 *
 * i18n URL 段化改造（2026-05）后：admin / editor / settings / login 都搬进
 * 了 /[locale]/ 段，disallow 规则改用 wildcard /:locale/xxx/ 匹配两种语言。
 * Google / Bing 都支持 * wildcard（事实标准，不在 RFC 里）。
 *
 * 屏蔽：
 * - /:locale/admin/    后台管理页，登录态专属
 * - /:locale/editor/   编辑器页，登录态专属
 * - /:locale/settings/ 用户设置，登录态专属
 * - /:locale/login     登录页，入索引反而诱导钓鱼
 * - /api/              所有服务端接口，不是给爬虫看的（不在 [locale] 下）
 *
 * sitemap 指向 app/sitemap.ts 产出的 /sitemap.xml，hostname 复用同一份
 * NEXT_PUBLIC_SITE_URL。
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
        disallow: [
          "/*/admin/",
          "/*/editor/",
          "/*/settings/",
          "/*/login",
          "/api/",
          // posts 详情页元数据已设 noindex，robots.txt 双重保险
          "/*/u/*/posts/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
