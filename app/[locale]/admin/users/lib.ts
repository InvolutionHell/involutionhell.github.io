"use client";

/**
 * Admin Users API client（client-only，需要 satoken header）。
 */

export interface AdminUserView {
  id: number;
  username: string;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  githubId: number | null;
  enabled: boolean;
  roles: string[];
}

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

export function listAdminUsers(q?: string): Promise<AdminUserView[]> {
  const qs = q ? `?q=${encodeURIComponent(q)}` : "";
  return request<AdminUserView[]>(`/api/admin/users${qs}`);
}

export function setUserAdminRole(
  userId: number,
  admin: boolean,
): Promise<AdminUserView> {
  return request<AdminUserView>(`/api/admin/users/${userId}/admin`, {
    method: "PUT",
    body: JSON.stringify({ admin }),
  });
}
