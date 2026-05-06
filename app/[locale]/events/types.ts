/**
 * Events 模块前后端共用的 TypeScript 类型。
 * 字段与后端 com.involutionhell.backend.events.dto.EventView 保持 1:1 对应。
 *
 * 后端 EventView 里 speakers / tags 的结构：
 * - speakers: 对象数组 [{name, avatarUrl?, profileUrl?}]
 * - tags:     string[]（后端从逗号分隔字符串 split 后给前端）
 *
 * 日期字段：后端返回 ISO-8601 字符串（Jackson 默认格式），前端用 new Date() 解析。
 */

export interface EventSpeaker {
  name: string;
  avatarUrl?: string | null;
  profileUrl?: string | null;
}

export type EventStatus = "draft" | "published" | "archived" | "cancelled";

export interface EventView {
  id: number;
  title: string;
  description: string;
  coverUrl: string | null;
  startTime: string | null; // ISO-8601
  endTime: string | null; // ISO-8601
  discordLink: string | null;
  playbackUrl: string | null;
  speakers: EventSpeaker[];
  tags: string[];
  status: EventStatus;
  organizerId: number | null;
  createdAt: string;
  updatedAt: string;
  interestCount: number;
  ongoing: boolean;
  past: boolean;
}

export interface EventDetailResponse {
  event: EventView;
  interested: boolean; // 当前登录用户是否感兴趣（匿名返回 false）
}

/** Admin 创建 / 更新 event 的入参。和后端 EventRequest 对齐。 */
export interface EventRequest {
  title: string;
  description?: string;
  coverUrl?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  discordLink?: string | null;
  playbackUrl?: string | null;
  speakers?: EventSpeaker[];
  tags?: string[];
  status?: EventStatus;
}
