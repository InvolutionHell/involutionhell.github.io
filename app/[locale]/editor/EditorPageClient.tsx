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
import { useTranslations } from "next-intl";
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

// titleToSlug：从文章标题生成 slug 候选值，供前端预填 filename input。
// 保留 Unicode 字母/数字（\p{L}\p{N}），允许中文 slug 候选，和后端 sanitizeSlug 对齐。
// 后端会做唯一性去重，前端候选值不是最终 slug。
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

export function EditorPageClient({ user }: EditorPageClientProps) {
  const router = useRouter();
  const t = useTranslations("editor");
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
      throw new Error(t("errors.imageType", { filename: file.name }));
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
      throw new Error(error.error || t("errors.uploadLink"));
    }

    const { uploadUrl, publicUrl } = await response.json();

    // Content-Type 必须和签名时绑的 primaryMime byte-exact 一致，否则 R2 返 403
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": primaryMime },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(
        t("errors.imageUpload", { statusText: uploadResponse.statusText }),
      );
    }

    return { blobUrl, publicUrl };
  };

  const handlePublish = async () => {
    setIsPublishing(true);

    try {
      if (!title.trim()) {
        alert(t("errors.titleRequired"));
        return;
      }

      // filename 字段作为 slug 来源；为空时用 title 自动生成
      const rawSlug = filename.trim()
        ? stripMarkdownExtension(normalizeMarkdownFilename(filename))
        : titleToSlug(title);

      if (rawSlug && !FILENAME_PATTERN.test(rawSlug)) {
        alert(t("errors.invalidFilename"));
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
        throw new Error(t("errors.editorNotReady"));
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

      const token = localStorage.getItem("satoken") ?? "";
      if (!token) {
        throw new Error(t("errors.loginRequired"));
      }

      const postRequest: PostRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        // trim + filter 保证后端收到的 tags 无空白项
        tags: tags.map((t) => t.trim()).filter(Boolean),
        contentMd: finalMarkdown,
        // 有用户填的 slug 就带上，后端会去重；没有则不传，后端从 title 自动生成
        ...(rawSlug ? { slug: rawSlug } : {}),
      };

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // rewrite 透传：后端 sa-token.token-name=satoken，需用 satoken 而非 x-satoken
          ...(token ? { satoken: token } : {}),
        },
        body: JSON.stringify(postRequest),
        signal: AbortSignal.timeout(30_000),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { message?: string }).message ??
            t("errors.publishFailedHttp", { status: res.status }),
        );
      }

      const body = (await res.json()) as ApiResponse<PostView>;
      if (!body.success || !body.data) {
        throw new Error(body.message ?? t("errors.publishFailedRetry"));
      }

      const { slug: finalSlug, authorUsername } = body.data;
      router.push(`/u/${authorUsername}/posts/${finalSlug}`);
    } catch (error) {
      console.error("发布失败:", error);
      alert(
        t("errors.publishFailed", {
          message:
            error instanceof Error ? error.message : t("errors.unknownError"),
        }),
      );
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
          <h1 className="text-3xl font-bold">{t("pageTitle")}</h1>
          <p className="text-muted-foreground mt-1">{t("pageSubtitle")}</p>
        </div>
        <Link href="/">
          <Button variant="outline">{t("backHome")}</Button>
        </Link>
      </header>

      {/* 主要内容区域 */}
      <div className="space-y-6">
        {/* 元数据表单（标题/描述/标签/文件名） */}
        <EditorMetadataForm />

        {/* Markdown 编辑器 */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("contentHeading")}</h2>
            <div className="text-sm text-muted-foreground">
              {t("stats", { characters: markdown.length, images: imageCount })}
            </div>
          </div>
          <MarkdownEditor
            ref={editorRef}
            onImagesChange={handleImageCountChange}
            defaultMarkdown={t("defaultMarkdown")}
          />
        </div>

        {/* 操作区 */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">
            {!title.trim() ? (
              <span className="text-destructive">{t("titleRequired")}</span>
            ) : previewSlug ? (
              <span>
                {t("publishTo")}{" "}
                <code className="font-mono text-foreground">
                  /u/{user.username}/posts/{previewSlug}
                </code>
              </span>
            ) : (
              <span>{t("autoSlug")}</span>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (confirm(t("clearConfirm"))) {
                  useEditorStore.getState().reset();
                  window.location.reload();
                }
              }}
            >
              {t("clear")}
            </Button>

            <Button onClick={handlePublish} disabled={!canPublish}>
              {isPublishing ? t("publishing") : t("publish")}
            </Button>
          </div>
        </div>

        {/* 流程提示 */}
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm dark:border-green-900 dark:bg-green-950">
          <h3 className="font-medium mb-2">{t("directPublish")}</h3>
          <ul className="space-y-1 text-muted-foreground list-disc list-inside">
            <li>{t("tips.imageUpload")}</li>
            <li>{t("tips.publishImmediately")}</li>
            <li>{t("tips.promoteToDocs")}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
