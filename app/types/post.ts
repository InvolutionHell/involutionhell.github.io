/**
 * posts 模块前端类型定义。
 * 字段与后端 com.involutionhell.backend.posts.dto 包 record 一一对应。
 */

/**
 * 文章详情视图（详情页 / 分享页使用）。
 * 对应 PostView.java。
 */
export interface PostView {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  tags: string[];
  contentMd: string;
  coverUrl: string | null;
  visibility: string;
  status: string;
  promotedPrUrl: string | null;
  promotedAt: string | null; // Instant 序列化为 ISO-8601 字符串
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  // 作者冗余字段（避免前端再发 /api/user-center/profile）
  authorUsername: string;
  authorDisplayName: string | null;
  authorAvatar: string | null; // 后端字段名是 authorAvatar，非 authorAvatarUrl
}

/**
 * 文章列表摘要视图（/feed 原创 Tab 和 /u/[username]/posts 列表使用）。
 * 对应 PostSummaryView.java。不含 contentMd，减少传输量。
 */
export interface PostSummaryView {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  tags: string[];
  coverUrl: string | null;
  visibility: string;
  status: string;
  promoted: boolean; // promotedPrUrl != null 则为 true
  viewCount: number;
  createdAt: string;
  authorUsername: string;
  authorDisplayName: string | null;
  authorAvatar: string | null;
}

/**
 * POST /api/posts 请求体。
 * 对应 PostRequest.java。slug 可选，不传时后端从 title 自动生成并去重。
 */
export interface PostRequest {
  title: string;
  description?: string | null;
  tags?: string[];
  contentMd: string;
  coverUrl?: string | null;
  slug?: string | null;
}

/** 后端通用响应包装（与 feed/types.ts 的 ApiResponse 保持一致） */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}
