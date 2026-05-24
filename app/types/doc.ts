import type { StructuredData } from "fumadocs-core/mdx-plugins";

/**
 * 定义可以被解析为日期的宽松类型
 */
export type DateLike = string | number | Date | undefined | null;

/**
 * 定义用于 page.data 的基础类型，
 * 包含 Fumadocs 自动生成的字段以及常见的前置元数据 (frontmatter)。
 */
export interface PageData {
  title?: string;
  description?: string;
  date?: DateLike;
  updated?: DateLike;
  updatedAt?: DateLike;
  lastUpdated?: DateLike;
  draft?: boolean;
  hidden?: boolean;
  docId?: string;
  lang?: string;
  structuredData?: StructuredData;
  load?: () => Promise<{ structuredData: StructuredData }>;
  /**
   * 允许访问 frontmatter 原始对象（Fumadocs 默认会将字段打平到 data 根部，
   * 但部分逻辑可能仍显式访问 .frontmatter）。
   */
  frontmatter?: {
    title?: string;
    description?: string;
    date?: DateLike;
    updated?: DateLike;
    updatedAt?: DateLike;
    lastUpdated?: DateLike;
    draft?: boolean;
    hidden?: boolean;
    docId?: string;
    lang?: string;
    [key: string]: unknown;
  };
  // 故意不挂顶层 [key: string]: unknown 索引签名 —— Fumadocs 的 page.data 由
  // zod DocOut 推出，没有 index signature；如果在 PageData 上挂一个，as PageData
  // 会触发 TS2352 "neither type sufficiently overlaps"。所有需要的字段都已
  // 在上面显式声明；真要拓展加新字段，往这里加显式 ? 字段，别走 escape hatch。
}
