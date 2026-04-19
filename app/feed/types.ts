/**
 * 社区分享链接相关类型定义。
 * 与后端 SharedLinkView.java 字段一一对应。
 */

/** 分类 slug 枚举（与后端保持一致） */
export type CategorySlug =
  | "ai_frontier"
  | "engineering"
  | "job"
  | "grad_study"
  | "industry"
  | "learning"
  | "lifestyle"
  | "other";

/** 所有可用分类 slug 列表，用于 UI 渲染分类 tab */
export const CATEGORY_SLUGS: CategorySlug[] = [
  "ai_frontier",
  "engineering",
  "job",
  "grad_study",
  "industry",
  "learning",
  "lifestyle",
  "other",
];

/** 后端 SharedLinkView 对应的前端视图类型 */
export interface SharedLinkView {
  id: number;
  submitterId: number;
  url: string;
  host: string;
  recommendation: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogCover: string | null;
  ogSiteName: string | null;
  ogFetchFailed: boolean;
  category: CategorySlug | null;
  status:
    | "PENDING"
    | "APPROVED"
    | "PENDING_MANUAL"
    | "FLAGGED"
    | "REJECTED"
    | "ARCHIVED";
  reportCount: number;
  archivedAt: string | null;
  createdAt: string;
}

/** 后端通用响应包装格式 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}
