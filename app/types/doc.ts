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
    [key: string]: any;
  };
  /**
   * 允许通过索引访问其他动态属性
   */
  [key: string]: any;
}
