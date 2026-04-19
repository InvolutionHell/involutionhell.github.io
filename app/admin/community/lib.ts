"use client";

/**
 * Admin 侧 Community 的 API client（纯 client）。
 *
 * 参照 /admin/events/lib.ts 的做法：
 * - 所有请求带 satoken header（从 localStorage 读）
 * - 响应统一解包后端 ApiResponse<T>
 *
 * 对应后端：/api/admin/community/*  （走 @SaCheckRole("admin")）
 */

import type { SharedLinkView } from "@/app/feed/types";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

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

/** 拉取管理员待审列表（PENDING_MANUAL + FLAGGED） */
export function listPendingLinks(): Promise<SharedLinkView[]> {
  return request<SharedLinkView[]>("/api/admin/community/pending");
}

/** 通过一条链接，状态置 APPROVED */
export function approveLink(id: number): Promise<SharedLinkView> {
  return request<SharedLinkView>(`/api/admin/community/${id}/approve`, {
    method: "POST",
  });
}

/** 拒绝一条链接，状态置 REJECTED */
export function rejectLink(
  id: number,
  reason?: string,
): Promise<SharedLinkView> {
  return request<SharedLinkView>(`/api/admin/community/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason: reason ?? null }),
  });
}
