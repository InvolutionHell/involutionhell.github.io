"use client";

/**
 * Admin 侧的 Events API client（Client-only）。
 *
 * 为什么全部客户端：
 * - Admin 页本身就是交互表单，用 Client Component 合理
 * - 带 satoken header，必须在浏览器 localStorage 里取；SSR 没有 token
 * - 避免 SSR 缓存污染 admin 视角的数据
 */

import type { EventRequest, EventView } from "@/app/[locale]/events/types";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/** 从 localStorage 读 satoken，没登录就 null（调用侧应该已经卡住了） */
function token(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("satoken");
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const t = token();
  const res = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      ...(t ? { satoken: t } : {}),
      ...(init.headers ?? {}),
    },
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !json.success) {
    throw new Error(json.message ?? `请求失败 ${res.status}`);
  }
  if (json.data === undefined) {
    throw new Error("后端返回 success 但没有 data");
  }
  return json.data;
}

export function listAdminEvents(): Promise<EventView[]> {
  return request<EventView[]>("/api/admin/events");
}

export function getAdminEvent(id: number): Promise<EventView> {
  return request<EventView>(`/api/admin/events/${id}`);
}

export function createEvent(req: EventRequest): Promise<EventView> {
  return request<EventView>("/api/admin/events", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export function updateEvent(id: number, req: EventRequest): Promise<EventView> {
  return request<EventView>(`/api/admin/events/${id}`, {
    method: "PUT",
    body: JSON.stringify(req),
  });
}

export async function deleteEvent(id: number): Promise<void> {
  const t = token();
  const res = await fetch(`/api/admin/events/${id}`, {
    method: "DELETE",
    headers: t ? { satoken: t } : {},
  });
  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as ApiResponse<unknown>;
    throw new Error(json.message ?? `删除失败 ${res.status}`);
  }
}
