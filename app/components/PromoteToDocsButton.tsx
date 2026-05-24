"use client";

import { useState } from "react";
import { DocsDestinationForm } from "@/app/components/DocsDestinationForm";
import { buildDocsNewUrl } from "@/lib/github";
import { buildFrontmatter } from "@/lib/frontmatter";

interface Props {
  postId: number;
  title: string;
  description: string | null;
  tags: string[];
  contentMd: string;
  /** 后端已有 promotedAt 时初始化为 promoted 态 */
  initialPromoted?: boolean;
  /** 详情页：border 样式（主操作）；个人主页卡片：link 样式 */
  variant?: "detail" | "card";
}

type PromoteState = "idle" | "selecting" | "pending" | "promoted";

/**
 * 「收录进知识库」三态按钮。
 *
 * 三态不可逆流转：
 *   idle → selecting（打开 DocsDestinationForm 弹窗）
 *   selecting → pending（用户确认目录后：window.open GitHub + fire-and-forget POST promote）
 *   pending：物理锁死，防止重复触发
 *   promoted：后端 promotedAt 有值时的持久态
 *
 * pending → promoted 的迁移由页面刷新触发（POST promote 成功后后端写 promotedAt，
 * 下次加载详情页时 initialPromoted=true）。
 */
export function PromoteToDocsButton({
  postId,
  title,
  description,
  tags,
  contentMd,
  initialPromoted = false,
  variant = "detail",
}: Props) {
  const [state, setState] = useState<PromoteState>(
    initialPromoted ? "promoted" : "idle",
  );
  const [destinationPath, setDestinationPath] = useState("");

  if (state === "promoted") {
    return (
      <span className="font-mono text-[9px] uppercase tracking-widest bg-[var(--foreground)] text-[var(--background)] px-2 py-0.5">
        已收录
      </span>
    );
  }

  // 投递中：去 border 和 hover，物理锁死防误触
  if (state === "pending") {
    return (
      <span className="font-mono text-[10px] text-neutral-400 cursor-default">
        已发起投稿 · 等待合并
      </span>
    );
  }

  // 目录选择弹窗
  if (state === "selecting") {
    return (
      <div className="flex flex-col gap-2">
        <DocsDestinationForm onChange={setDestinationPath} />
        <div className="flex gap-2">
          <button
            onClick={() => setState("idle")}
            className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 hover:text-[var(--foreground)] transition-colors"
          >
            取消
          </button>
          <button
            disabled={!destinationPath}
            onClick={() => {
              if (!destinationPath) return;

              // 1. 拼 frontmatter + 正文，打开 GitHub 新建文件页
              const frontmatter = buildFrontmatter({
                title,
                description: description ?? "",
                tags,
              });
              const markdownBody = contentMd.trimStart();
              const finalContent =
                markdownBody.length > 0
                  ? `${frontmatter}\n\n${markdownBody}`
                  : `${frontmatter}\n`;

              // slug 取 title 简化版（仅供 GitHub 文件名预填，后端自己管理）
              const slugBase =
                title
                  .toLowerCase()
                  .replace(/[\s_]+/g, "-")
                  .replace(/[^\p{L}\p{N}-]/gu, "")
                  .slice(0, 64) || "post";
              const params = new URLSearchParams({
                filename: `${slugBase}.md`,
                value: finalContent,
              });
              const githubUrl = buildDocsNewUrl(destinationPath, params);
              window.open(githubUrl, "_blank", "noopener,noreferrer");

              // 2. 切 pending 态（物理锁死）
              setState("pending");

              // 3. fire-and-forget：POST /api/posts/{id}/promote
              const token = localStorage.getItem("satoken") ?? "";
              fetch(`/api/posts/${postId}/promote`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  // rewrite 透传：后端读 satoken，不是 x-satoken；空 token 不发 header
                  ...(token ? { satoken: token } : {}),
                },
                body: JSON.stringify({ prUrl: githubUrl }),
              }).catch((err) => {
                // 静默失败：UI 已锁定 pending，用户等 PR merge 后刷新页面进入 promoted 态
                console.warn("[PromoteToDocsButton] promote API failed:", err);
              });
            }}
            className="font-mono text-[11px] uppercase tracking-widest border border-[var(--foreground)] px-4 py-1.5 hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            确认，打开 GitHub →
          </button>
        </div>
      </div>
    );
  }

  // idle 态
  const idleClass =
    variant === "detail"
      ? "border border-[var(--foreground)] px-4 py-1.5 font-mono text-[11px] uppercase tracking-widest hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-all"
      : "font-mono text-[10px] hover:text-[#CC0000] transition-colors";

  return (
    <button onClick={() => setState("selecting")} className={idleClass}>
      收录进知识库 →
    </button>
  );
}
