"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { HotDocsTab } from "./HotDocsTab";

type Tab = "contributors" | "hot";
type Window = "7d" | "30d" | "all";

// 合法取值白名单，用来校验 URL query 的任意字符串
const VALID_TABS: readonly Tab[] = ["contributors", "hot"] as const;
const VALID_WINDOWS: readonly Window[] = ["7d", "30d", "all"] as const;

function isValidTab(value: string | null): value is Tab {
  return value !== null && (VALID_TABS as readonly string[]).includes(value);
}

function isValidWindow(value: string | null): value is Window {
  return value !== null && (VALID_WINDOWS as readonly string[]).includes(value);
}

interface RankTabsProps {
  /** Contributors tab 的静态内容，由 /rank/page.tsx SSR 渲染后以 children 传入 */
  children: React.ReactNode;
  /** SSR 决定的初始 tab，来自 URL query ?tab=；客户端挂载后以 searchParams 为准 */
  initialTab: Tab;
  /** SSR 决定的初始窗口，Hot Docs tab 用 */
  initialWindow: Window;
}

/**
 * /rank 页的 Tab 壳子：Contributors（贡献者榜，静态 JSON）/ Hot Docs（热门文档榜，后端 API）。
 *
 * Tab 和窗口状态都写进 URL query（?tab=&window=），而不是组件内 state，这样：
 *   1. 分享链接能直接定位到具体视图
 *   2. 浏览器前进/后退正常切换
 *   3. 刷新不丢状态
 *
 * 用 router.push 而非 replaceState 是为了让返回键能回到上一个 tab；窗口切换在 HotDocsTab 内部用
 * replaceState，避免每切一次就污染历史栈。
 */
export function RankTabs({
  children,
  initialTab,
  initialWindow,
}: RankTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // 校验 query 值是否在白名单里，非法值（例如 ?tab=foo、?window=1d）回退到 initial*
  // 防止下游 HotDocsTab 收到不支持的 window，或 tab 所有分支都不命中导致空白渲染
  const rawTab = searchParams.get("tab");
  const rawWindow = searchParams.get("window");
  const activeTab: Tab = isValidTab(rawTab) ? rawTab : initialTab;
  const activeWindow: Window = isValidWindow(rawWindow)
    ? rawWindow
    : initialWindow;

  const switchTab = (tab: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    // 首次切到 Hot Docs 还没选过窗口时默认 30d，避免 HotDocsTab 拿到 undefined
    if (tab === "hot" && !params.get("window")) {
      params.set("window", "30d");
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div>
      {/* Tab 切换 */}
      <div className="flex gap-0 mb-10 border-b-4 border-[var(--foreground)]">
        {(
          [
            { value: "contributors", label: "Contributors" },
            { value: "hot", label: "Hot Docs" },
          ] as { value: Tab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.value}
            onClick={() => switchTab(tab.value)}
            className={`px-6 py-3 font-mono text-sm uppercase tracking-widest transition-colors border-t border-l border-r border-[var(--foreground)] -mb-1 ${
              activeTab === tab.value
                ? "bg-[var(--foreground)] text-[var(--background)]"
                : "bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--foreground)]/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      {activeTab === "contributors" && <div>{children}</div>}
      {activeTab === "hot" && <HotDocsTab initialWindow={activeWindow} />}
    </div>
  );
}
