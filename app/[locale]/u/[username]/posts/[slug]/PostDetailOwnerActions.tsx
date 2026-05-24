"use client";

import { useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/use-auth";
import { PromoteToDocsButton } from "@/app/components/PromoteToDocsButton";
import type { ApiResponse } from "@/app/types/post";

interface Props {
  postId: number;
  postSlug: string;
  authorUsername: string;
  promotedAt: string | null;
  title: string;
  description: string | null;
  tags: string[];
  contentMd: string;
}

/**
 * 详情页 owner 按钮组（编辑 | 删除 | 收录进知识库）。
 * 仅在当前登录用户是文章作者时渲染。
 */
export function PostDetailOwnerActions({
  postId,
  postSlug: _postSlug,
  authorUsername,
  promotedAt,
  title,
  description,
  tags,
  contentMd,
}: Props) {
  const { user, status } = useAuth();
  const router = useRouter();
  const params = useParams<{ username: string }>();
  const [deleting, setDeleting] = useState(false);

  // 判定是否为作者（githubId 优先，username 兜底）
  const isOwner = useMemo(() => {
    if (status !== "authenticated" || !user) return false;
    const urlUsername = params?.username ?? authorUsername;
    if (user.githubId != null && String(user.githubId) === urlUsername)
      return true;
    if (user.username === authorUsername) return true;
    return false;
  }, [status, user, params, authorUsername]);

  if (!isOwner) return null;

  async function handleDelete() {
    if (!confirm("确定要删除这篇文章吗？删除后不可恢复。")) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("satoken") ?? "";
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        // rewrite 透传：后端读 satoken，不是 x-satoken；空 token 不发 header
        headers: { ...(token ? { satoken: token } : {}) },
      });
      const body = (await res.json().catch(() => ({}))) as ApiResponse<void>;
      if (res.ok && body.success) {
        router.replace(`/u/${authorUsername}/posts`);
      } else {
        alert(body.message ?? `删除失败（HTTP ${res.status}）`);
      }
    } catch {
      alert("网络错误，请稍后重试");
    } finally {
      setDeleting(false);
    }
  }

  const btnBase =
    "font-mono text-[11px] uppercase tracking-widest transition-colors";

  return (
    <div className="flex items-center gap-3 shrink-0 flex-wrap">
      {/* 编辑（预留，后续迭代实现） */}
      <span
        className={`${btnBase} text-neutral-400 cursor-not-allowed opacity-50`}
      >
        编辑
      </span>

      {/* 删除 */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className={`${btnBase} text-neutral-400 hover:text-[#CC0000] disabled:opacity-50`}
      >
        {deleting ? "删除中..." : "删除"}
      </button>

      {/* 收录进知识库：三态按钮（idle / pending / promoted） */}
      <PromoteToDocsButton
        postId={postId}
        title={title}
        description={description}
        tags={tags}
        contentMd={contentMd}
        initialPromoted={promotedAt !== null}
        variant="detail"
      />
    </div>
  );
}
