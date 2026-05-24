"use client";

import { useEditorStore } from "@/lib/editor-store";
import { EditorMetadataForm } from "@/app/components/EditorMetadataForm";
import {
  MarkdownEditor,
  type MarkdownEditorHandle,
} from "@/app/components/MarkdownEditor";
import { Button } from "@/app/components/ui/button";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { UserView } from "@/lib/use-auth";
import type { PostRequest, ApiResponse, PostView } from "@/app/types/post";
import {
  FILENAME_PATTERN,
  normalizeMarkdownFilename,
  stripMarkdownExtension,
} from "@/lib/submission";

interface EditorPageClientProps {
  user: UserView;
}

/**
 * 从文章标题生成 slug 候选值，和后端生成逻辑保持一致（kebab-case，纯 ASCII）。
 * 后端会做唯一性去重，前端只是提前填充 filename input 用，不是最终 slug。
 */
function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 128);
}

// buildFrontmatter 仅在「收录进知识库」（PromoteToDocsButton）路径使用，
// 这里为 PromoteToDocsButton 单独导出，editor 直发不再拼 frontmatter。
export function buildFrontmatter({
  title,
  description,
  tags,
}: {
  title: string;
  description?: string;
  tags?: string[];
}) {
  const safeTitle = JSON.stringify(title);
  const safeDescription = JSON.stringify(description ?? "");
  const date = new Date().toISOString().slice(0, 10);
  const normalizedTags = (tags ?? [])
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  const lines = [
    "---",
    `title: ${safeTitle}`,
    `description: ${safeDescription}`,
    `date: "${date}"`,
  ];

  if (normalizedTags.length > 0) {
    lines.push(
      "tags:",
      ...normalizedTags.map((tag) => `  - ${JSON.stringify(tag)}`),
    );
  } else {
    lines.push("tags: []");
  }

  lines.push("---");
  return lines.join("\n");
}

export function EditorPageClient({ user }: EditorPageClientProps) {
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);
  const [imageCount, setImageCount] = useState(0);
  const editorRef = useRef<MarkdownEditorHandle | null>(null);
  const { title, description, tags, filename, markdown, setFilename } =
    useEditorStore();
  const handleImageCountChange = useCallback((count: number) => {
    setImageCount(count);
  }, []);
  const previewSlug = filename
    ? stripMarkdownExtension(normalizeMarkdownFilename(filename))
    : "";

  // 上传单个图片到 R2，返回 { blobUrl, publicUrl }
  const uploadImage = async (
    blobUrl: string,
    file: File,
    articleSlug: string,
  ): Promise<{ blobUrl: string; publicUrl: string }> => {
    // 规范化 Content-Type：只取主 MIME（分号前）+ trim + 小写。
    // 服务端预签名 URL 绑的是规范化后的 ContentType，客户端 PUT 时必须 byte-exact 一致，
    // 否则 R2 返 403 SignatureDoesNotMatch。
    const primaryMime = file.type.split(";")[0]!.trim().toLowerCase();
    if (!primaryMime) {
      throw new Error(
        `无法识别图片类型：${file.name}（浏览器未给出 MIME），请另存为 PNG/JPG/WebP 后重试`,
      );
    }

    const token = localStorage.getItem("satoken") ?? "";
    const response = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-satoken": token,
      },
      body: JSON.stringify({
        filename: file.name,
        contentType: primaryMime,
        articleSlug,
        fileSize: file.size,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "获取上传链接失败");
    }

    const { uploadUrl, publicUrl } = await response.json();

    // Content-Type 必须和签名时绑的 primaryMime byte-exact 一致，否则 R2 返 403
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": primaryMime },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(`上传图片失败: ${uploadResponse.statusText}`);
    }

    return { blobUrl, publicUrl };
  };

  const handlePublish = async () => {
    setIsPublishing(true);

    try {
      if (!title.trim()) {
        alert("请输入文章标题");
        return;
      }

      // filename 字段作为 slug 来源；为空时用 title 自动生成
      const rawSlug = filename.trim()
        ? stripMarkdownExtension(normalizeMarkdownFilename(filename))
        : titleToSlug(title);

      if (rawSlug && !FILENAME_PATTERN.test(rawSlug)) {
        alert(
          "文件名仅支持字母、数字、连字符或下划线，并需以字母或数字开头（已自动清洗空格和特殊符号）。",
        );
        return;
      }

      if (filename.trim()) {
        const normalized = normalizeMarkdownFilename(filename);
        if (normalized !== filename) setFilename(normalized);
      }

      let finalMarkdown = markdown;
      const articleSlug = rawSlug || "draft";

      const editorHandle = editorRef.current;
      if (!editorHandle) {
        throw new Error("编辑器尚未就绪，无法上传图片");
      }

      // 清理编辑器中未被 Markdown 正文引用的孤儿图片
      const removedImages = editorHandle.removeUnreferencedImages(markdown);
      if (removedImages > 0) {
        console.log(`已清理 ${removedImages} 个未引用的图片`);
      }

      const imageEntries = Array.from(editorHandle.getImages().entries());

      if (imageEntries.length > 0) {
        const uploadPromises = imageEntries.map(([blobUrl, file]) =>
          uploadImage(blobUrl, file, articleSlug),
        );
        const uploadResults = await Promise.all(uploadPromises);

        // 用 R2 公开 URL 替换 blob URL
        uploadResults.forEach(({ blobUrl, publicUrl }) => {
          finalMarkdown = finalMarkdown.replaceAll(blobUrl, publicUrl);
        });
      }

      // POST /api/posts 直发落库
      // TODO(backend-contract): 等后端 #2 完成后确认 BACKEND_URL 路由 rewrite 情况；
      // 目前后端路由走 next.config.mjs rewrites 同源代理（参考 /api/community/links），
      // 若 posts 同样走代理则直接 fetch "/api/posts"，否则需要带 BACKEND_URL。
      const token = localStorage.getItem("satoken") ?? "";
      const postRequest: PostRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        tags: tags.filter((t) => t.trim().length > 0),
        contentMd: finalMarkdown,
        // 有用户填的 slug 就带上，后端会去重；没有则不传，后端从 title 自动生成
        ...(rawSlug ? { slug: rawSlug } : {}),
      };

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // rewrite 透传：后端 sa-token.token-name=satoken，需用 satoken 而非 x-satoken
          satoken: token,
        },
        body: JSON.stringify(postRequest),
        signal: AbortSignal.timeout(30_000),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { message?: string }).message ??
            `发布失败（HTTP ${res.status}）`,
        );
      }

      const body = (await res.json()) as ApiResponse<PostView>;
      if (!body.success || !body.data) {
        throw new Error(body.message ?? "发布失败，请重试");
      }

      const { slug: finalSlug } = body.data;
      // 跳到文章详情页
      router.push(`/u/${user.username}/posts/${finalSlug}`);
    } catch (error) {
      console.error("发布失败:", error);
      alert(`发布失败：${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const canPublish = title.trim().length > 0 && !isPublishing;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* 头部 */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">写篇文章</h1>
          <p className="text-muted-foreground mt-1">
            写完直接发布，想进知识库再一键投稿。
          </p>
        </div>
        <Link href="/">
          <Button variant="outline">返回首页</Button>
        </Link>
      </header>

      {/* 主要内容区域 */}
      <div className="space-y-6">
        {/* 元数据表单（标题/描述/标签/文件名） */}
        <EditorMetadataForm />

        {/* Markdown 编辑器 */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold">文章内容</h2>
            <div className="text-sm text-muted-foreground">
              {markdown.length} 字符 · {imageCount} 张图片
            </div>
          </div>
          <MarkdownEditor
            ref={editorRef}
            onImagesChange={handleImageCountChange}
          />
        </div>

        {/* 操作区 */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">
            {!title.trim() ? (
              <span className="text-destructive">请填写标题</span>
            ) : previewSlug ? (
              <span>
                将发布到{" "}
                <code className="font-mono text-foreground">
                  /u/{user.username}/posts/{previewSlug}
                </code>
              </span>
            ) : (
              <span>发布后 slug 由标题自动生成</span>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (confirm("确定要清空所有内容吗？")) {
                  useEditorStore.getState().reset();
                  window.location.reload();
                }
              }}
            >
              清空
            </Button>

            <Button onClick={handlePublish} disabled={!canPublish}>
              {isPublishing ? "发布中..." : "发布文章"}
            </Button>
          </div>
        </div>

        {/* 流程提示 */}
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm dark:border-green-900 dark:bg-green-950">
          <h3 className="font-medium mb-2">写完直接发</h3>
          <ul className="space-y-1 text-muted-foreground list-disc list-inside">
            <li>图片粘贴后自动上传到 CDN，发布时无需额外处理</li>
            <li>发布即可见，链接可直接分享，不等 review</li>
            <li>想进知识库？发布后点「收录进知识库」一键投稿</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
