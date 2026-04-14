"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { useDocsSearch } from "fumadocs-core/search/client";
import { useI18n } from "fumadocs-ui/provider";
import {
  SearchDialog,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogFooter,
  SearchDialogOverlay,
  SearchDialogIcon,
  SearchDialogClose,
  TagsList,
  TagsListItem,
  type SharedProps,
} from "fumadocs-ui/components/dialog/search";
import { useRouter } from "next/navigation";

interface TagItem {
  name: string;
  value: string;
}

interface DefaultSearchDialogProps extends SharedProps {
  links?: [string, string][];
  type?: "fetch" | "static";
  defaultTag?: string;
  tags?: TagItem[];
  api?: string;
  delayMs?: number;
  footer?: React.ReactNode;
  allowClear?: boolean;
}

interface SearchItem {
  url?: string;
  onSelect?: (value: string) => void;
  [key: string]: unknown;
}

export function CustomSearchDialog({
  defaultTag,
  tags = [],
  api,
  delayMs,
  type = "fetch",
  allowClear = false,
  links = [],
  footer,
  ...props
}: DefaultSearchDialogProps) {
  const { locale } = useI18n();
  const router = useRouter();
  const [tag, setTag] = useState(defaultTag);

  // Extract onOpenChange to use in dependency array cleanly
  const { onOpenChange, open, ...otherProps } = props;

  // 记录上次 open 状态，只在从关闭→打开时触发埋点，避免渲染抖动多次上报
  const prevOpenRef = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (open === true && prevOpenRef.current !== true) {
      trackEvent("search_open", { path: window.location.pathname });
    }
    prevOpenRef.current = open;
  }, [open]);

  const { search, setSearch, query } = useDocsSearch(
    type === "fetch"
      ? {
          type: "fetch",
          api,
          locale,
          tag,
          delayMs,
        }
      : {
          type: "static",
          from: api,
          locale,
          tag,
          delayMs,
        },
  );

  // Tracking logic for queries
  useEffect(() => {
    if (!search) return;

    const timer = setTimeout(() => {
      // Umami 埋点: 搜索词输入（debounce 1s，非搜索结果点击）
      if (window.umami) {
        window.umami.track("search_query", { query: search });
      }
    }, 1000); // 1s debounce

    return () => clearTimeout(timer);
  }, [search]);

  const defaultItems = useMemo(() => {
    if (links.length === 0) return null;
    return links.map(([name, link]) => ({
      type: "page" as const,
      id: name,
      content: name,
      url: link,
    }));
  }, [links]);

  // 使用 useMemo 劫持 search items，注入埋点逻辑
  const trackedItems = useMemo(() => {
    const data =
      query.data !== "empty" && query.data ? query.data : defaultItems;
    if (!data) return [];

    return data.map((item: unknown, index: number) => {
      const searchItem = item as SearchItem;
      return {
        ...searchItem,
        onSelect: (value: string) => {
          // Umami 埋点: 搜索结果点击
          if (window.umami) {
            window.umami.track("search_result_click", {
              query: search,
              rank: index + 1,
              url: searchItem.url,
            });
          }

          // Call original onSelect if it exists
          if (searchItem.onSelect) searchItem.onSelect(value);

          // Handle navigation if URL exists
          if (searchItem.url) {
            // 显式执行路由跳转和关闭弹窗，确保点击行为能够同时触发埋点和导航
            router.push(searchItem.url);
            if (onOpenChange) {
              onOpenChange(false);
            }
          }
        },
      };
    });
  }, [query.data, defaultItems, search, router, onOpenChange]);

  return (
    <SearchDialog
      search={search}
      onSearchChange={setSearch}
      isLoading={query.isLoading}
      onOpenChange={onOpenChange}
      open={open}
      {...otherProps}
    >
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <SearchDialogList items={trackedItems as any} />
      </SearchDialogContent>
      <SearchDialogFooter>
        {tags.length > 0 && (
          <TagsList tag={tag} onTagChange={setTag} allowClear={allowClear}>
            {tags.map((tag) => (
              <TagsListItem key={tag.value} value={tag.value}>
                {tag.name}
              </TagsListItem>
            ))}
          </TagsList>
        )}
        {footer}
      </SearchDialogFooter>
    </SearchDialog>
  );
}
