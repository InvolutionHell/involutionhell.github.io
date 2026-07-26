"use client";

import {
  forwardRef,
  useRef,
  useLayoutEffect,
  useImperativeHandle,
} from "react";
import { Crepe } from "@milkdown/crepe";
import type { ImageBlockFeatureConfig } from "@milkdown/crepe/feature/image-block";
import {
  upload,
  uploadConfig,
  type Uploader,
} from "@milkdown/kit/plugin/upload";
import type { Node as ProsemirrorNode } from "@milkdown/kit/prose/model";
import { useImageBuffer } from "@/app/components/hooks/useImageBuffer";
import { useEditorStore } from "@/lib/editor-store";

// 导入 Crepe 主题样式
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";

interface MarkdownEditorProps {
  onImagesChange?: (count: number) => void;
  defaultMarkdown: string;
}

export interface MarkdownEditorHandle {
  getImages: () => Map<string, File>;
  removeUnreferencedImages: (markdown: string) => number;
  clearImages: () => void;
}

/**
 * Milkdown Markdown 编辑器组件
 *
 * 功能：
 * - 支持 Markdown 编辑和实时预览
 * - 图片延迟上传：粘贴/拖拽图片时生成 blob URL，使用本地引用缓存 File 对象
 * - 自动同步内容到 Zustand Store
 */
export const MarkdownEditor = forwardRef<
  MarkdownEditorHandle,
  MarkdownEditorProps
>(function MarkdownEditor({ onImagesChange, defaultMarkdown }, ref) {
  const editorRef = useRef<HTMLDivElement>(null);
  const crepeInstanceRef = useRef<Crepe | null>(null);
  const isLoadingRef = useRef(false);
  const markdownRef = useRef(useEditorStore.getState().markdown);
  const lastDefaultMarkdownRef = useRef<string | null>(null);
  const { markdown, setMarkdown } = useEditorStore();
  const { appendFile, cleanupUnreferenced, clearAll, getSnapshot } =
    useImageBuffer(onImagesChange);

  markdownRef.current = markdown;

  useImperativeHandle(
    ref,
    () => ({
      getImages: () => getSnapshot(),
      removeUnreferencedImages: (currentMarkdown: string) =>
        cleanupUnreferenced(currentMarkdown),
      clearImages: () => clearAll(),
    }),
    [cleanupUnreferenced, clearAll, getSnapshot],
  );

  useLayoutEffect(() => {
    if (!editorRef.current || isLoadingRef.current) return;

    isLoadingRef.current = true;

    const initEditor = async () => {
      try {
        const handleImageUpload = async (file: File): Promise<string> => {
          console.log(
            "图片已添加:",
            file.name,
            `(${(file.size / 1024).toFixed(2)} KB)`,
          );

          return appendFile(file);
        };

        const imageBlockConfig: ImageBlockFeatureConfig = {
          onUpload: handleImageUpload,
          inlineOnUpload: handleImageUpload,
          blockOnUpload: handleImageUpload,
        };

        const customUploader: Uploader = async (files, schema) => {
          const imageType = schema.nodes.image;
          if (!imageType) {
            throw new Error("Milkdown schema 中缺少 image 节点");
          }

          const nodes: ProsemirrorNode[] = [];
          for (const file of Array.from(files)) {
            if (!file || !file.type.startsWith("image/")) continue;

            const src = await handleImageUpload(file);
            const node = imageType.createAndFill({
              src,
              alt: file.name,
            });
            if (node) {
              nodes.push(node);
            }
          }

          return nodes;
        };

        // 默认示例也会同步到 store。切换语言时，只有内容仍等于上次注入的
        // 默认示例才替换为新语言；用户修改过的草稿必须保留。
        const shouldUseDefault =
          !markdownRef.current ||
          markdownRef.current === lastDefaultMarkdownRef.current;
        const initialMarkdown = shouldUseDefault
          ? defaultMarkdown
          : markdownRef.current;
        lastDefaultMarkdownRef.current = initialMarkdown;

        const crepe = new Crepe({
          root: editorRef.current!,
          defaultValue: initialMarkdown,
          featureConfigs: {
            [Crepe.Feature.ImageBlock]: imageBlockConfig,
          },
        });

        crepe.editor.config((ctx) => {
          ctx.update(uploadConfig.key, (prev) => ({
            ...prev,
            enableHtmlFileUploader: true,
            uploader: customUploader,
          }));
        });
        upload.forEach((plugin) => {
          crepe.editor.use(plugin);
        });

        await crepe.create();

        const updateMarkdown = () => {
          try {
            const currentMarkdown = crepe.getMarkdown();
            if (currentMarkdown !== markdownRef.current) {
              setMarkdown(currentMarkdown);
              markdownRef.current = currentMarkdown;
            }
            cleanupUnreferenced(currentMarkdown);
          } catch (error) {
            console.error("获取 Markdown 内容失败:", error);
          }
        };

        const syncInterval = setInterval(updateMarkdown, 2000);

        crepeInstanceRef.current = crepe;
        isLoadingRef.current = false;

        console.log("Milkdown 编辑器初始化成功");

        return () => {
          clearInterval(syncInterval);
        };
      } catch (error) {
        console.error("编辑器初始化失败:", error);
        isLoadingRef.current = false;
      }
    };

    const cleanup = initEditor();

    return () => {
      if (cleanup) cleanup.then((fn) => fn?.());

      if (crepeInstanceRef.current && !isLoadingRef.current) {
        try {
          crepeInstanceRef.current.destroy();
          crepeInstanceRef.current = null;
          console.log("编辑器已销毁");
        } catch (error) {
          console.error("编辑器销毁失败:", error);
        }
      }

      clearAll();
    };
  }, [appendFile, cleanupUnreferenced, clearAll, defaultMarkdown, setMarkdown]);

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm overflow-visible">
      <div
        ref={editorRef}
        className="min-h-[500px] prose prose-slate dark:prose-invert max-w-none p-4"
      />
    </div>
  );
});
