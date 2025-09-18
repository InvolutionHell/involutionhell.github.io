"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ExternalLink, Plus, Sparkles } from "lucide-react";
import styles from "./Contribute.module.css";

// --- antd
import { TreeSelect } from "antd";
import type { DefaultOptionType } from "antd/es/select";
import { DataNode } from "antd/es/tree";
import { buildDocsNewUrl } from "@/lib/github";

type DirNode = { name: string; path: string; children?: DirNode[] };

// 统一调用工具函数生成 GitHub 新建链接，路径规则与 Edit 按钮一致
function buildGithubNewUrl(dirPath: string, filename: string, title: string) {
  const file = filename.endsWith(".mdx") ? filename : `${filename}.mdx`;
  const frontMatter = `---
title: ${title || "New Article"}
description:
date: ${new Date().toISOString().slice(0, 10)}
tags: []
---

# ${title || "New Article"}

Write your content here.
`;
  const params = new URLSearchParams({ filename: file, value: frontMatter });
  return buildDocsNewUrl(dirPath, params);
}

// ✅ 用纯文本 label + 一级节点 selectable:false
function toTreeSelectData(tree: DirNode[]): DefaultOptionType[] {
  return tree.map((l1) => ({
    key: l1.path,
    value: l1.path,
    label: l1.name,
    selectable: false, // ✅ 一级不可选
    children: [
      ...(l1.children || []).map((l2) => ({
        key: l2.path,
        value: l2.path,
        label: `${l1.name} / ${l2.name}`, // 纯文本，方便搜索
        isLeaf: true,
      })),
      {
        key: `${l1.path}/__create__`,
        value: `${l1.path}/__create__`,
        label: (
          <span className="inline-flex items-center">
            <Plus className="mr-1 h-3.5 w-3.5" />
            在「{l1.name}」下新建二级子栏目…
          </span>
        ),
      },
    ],
  }));
}

export function Contribute() {
  const [open, setOpen] = useState(false);
  const [tree, setTree] = useState<DirNode[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Hooks 必须在组件内部
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]); // 受控展开状态
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [newSub, setNewSub] = useState("");
  const [articleTitle, setArticleTitle] = useState("");
  const [articleFile, setArticleFile] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/docs-tree", { cache: "no-store" });
        const data = await res.json();
        if (mounted && data?.ok) setTree(data.tree || []);
      } catch {
        const res = await fetch("/docs-tree.json").catch(() => null);
        const data = await res?.json();
        if (mounted && data?.ok) setTree(data.tree || []);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const options = useMemo(() => toTreeSelectData(tree), [tree]);

  const finalDirPath = useMemo(() => {
    if (!selectedKey) return "";
    if (selectedKey.endsWith("/__create__")) {
      const l1 = selectedKey.split("/")[0];
      if (!newSub.trim()) return "";
      return `${l1}/${newSub.trim().replace(/\s+/g, "-")}`;
    }
    return selectedKey;
  }, [selectedKey, newSub]);

  const canProceed = !!finalDirPath && (articleTitle || articleFile);

  const handleOpenGithub = () => {
    if (!canProceed) return;
    const filename = (articleFile || articleTitle || "new-article")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();
    const title = articleTitle || filename;
    window.open(
      buildGithubNewUrl(finalDirPath, filename, title),
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setSelectedKey("");
          setNewSub("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="hero"
          size="lg"
          className="relative isolate w-full sm:w-auto mt-12 h-16 md:h-20 px-10 md:px-14 rounded-full
                     text-lg md:text-2xl font-semibold tracking-wide overflow-hidden
                     shadow-xl ring-1 ring-white/30 dark:ring-white/10
                     bg-gradient-to-r from-sky-300 via-sky-400 to-blue-600
                     dark:from-indigo-950 dark:via-slate-900 dark:to-black
                     hover:shadow-[0_25px_60px_-12px] hover:scale-[1.03] transition-all duration-300 ease-out"
        >
          {/* Day gradient shimmer */}
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-1 opacity-30 blur-2xl transition-opacity duration-500
                       bg-gradient-to-r from-sky-200 via-blue-300 to-sky-400 dark:opacity-0"
          />
          {/* Night nebula glow */}
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-1 opacity-0 blur-2xl transition-opacity duration-500
                       dark:opacity-25 dark:bg-gradient-to-br dark:from-indigo-800 dark:via-fuchsia-700/50 dark:to-blue-900"
          />

          {/* Day clouds */}
          <span
            aria-hidden
            className={`absolute -left-12 top-1/3 w-48 h-24 rounded-full bg-white/60 blur-2xl dark:hidden ${styles.driftSlow}`}
          />
          <span
            aria-hidden
            className={`absolute left-1/3 -bottom-8 w-64 h-28 rounded-full bg-white/40 blur-3xl dark:hidden ${styles.driftFast}`}
          />

          {/* Night stars */}
          <span aria-hidden className="hidden dark:block">
            <span
              className={`absolute left-6 top-3 w-1 h-1 rounded-full bg-white/90 ${styles.twinkle}`}
            />
            <span
              className={`absolute left-1/3 top-2 w-1 h-1 rounded-full bg-white/80 ${styles.twinkleDelay1}`}
            />
            <span
              className={`absolute left-2/3 top-5 w-1 h-1 rounded-full bg-white/70 ${styles.twinkleDelay2}`}
            />
            <span
              className={`absolute right-8 top-4 w-1 h-1 rounded-full bg-white/90 ${styles.twinkleDelay3}`}
            />
            <span
              className={`absolute right-1/4 bottom-3 w-1 h-1 rounded-full bg-white/80 ${styles.twinkle}`}
            />
          </span>

          <span className="relative z-10 flex items-center gap-3 text-white">
            <Sparkles className="h-6 w-6 opacity-95" />
            <span className={styles.textGlow}>我要投稿</span>
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>我要投稿</DialogTitle>
          <DialogDescription>
            选择栏目（单选、可搜索；一级仅用于展开），或在一级下新建二级子栏目，然后跳转到
            GitHub 新建文章。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-sm font-medium">选择栏目</label>
          <TreeSelect
            className="w-full"
            treeData={options as DataNode[]}
            loading={loading}
            value={selectedKey || undefined}
            onChange={(val) => setSelectedKey((val as string) ?? "")}
            showSearch
            // 用 label 做过滤（label 都是可读文本）
            treeNodeFilterProp="label"
            filterTreeNode={(input, node) =>
              String(node.label ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            // ✅ 默认折叠；点标题即可展开/收起
            treeExpandedKeys={expandedKeys}
            onTreeExpand={(keys) => setExpandedKeys(keys as string[])}
            treeExpandAction="click"
            // 下拉不顶满，挂到触发元素父节点内，避免被 Dialog 裁剪
            popupMatchSelectWidth={false}
            listHeight={360}
            getPopupContainer={(trigger) =>
              trigger?.parentElement ?? document.body
            }
            placeholder="请选择（可搜索）"
            allowClear
            treeLine
          />
        </div>

        {selectedKey.endsWith("/__create__") && (
          <div className="space-y-1">
            <label className="text-sm font-medium">新建二级子栏目名称</label>
            <Input
              placeholder="e.g. foundation-models"
              value={newSub}
              onChange={(e) => setNewSub(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              将创建路径：{selectedKey.split("/")[0]} / {newSub || "<未填写>"}
            </p>
          </div>
        )}

        <div className="grid gap-2">
          <label className="text-sm font-medium">
            文章标题（front-matter）
          </label>
          <Input
            placeholder="e.g. A Gentle Intro to Transformers"
            value={articleTitle}
            onChange={(e) => setArticleTitle(e.target.value)}
          />
          <label className="text-sm font-medium">文件名（可选）</label>
          <Input
            placeholder="e.g. intro-to-transformers"
            value={articleFile}
            onChange={(e) => setArticleFile(e.target.value)}
          />
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            路径预览：
            <code className="font-mono">{finalDirPath || "(未选择)"}</code>
          </div>
          <Button onClick={handleOpenGithub} disabled={!canProceed}>
            继续在 GitHub 新建页面 <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
