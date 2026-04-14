"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { HotDocsTab } from "./HotDocsTab";

type Tab = "contributors" | "hot";
type Window = "7d" | "30d" | "all";

interface RankTabsProps {
  children: React.ReactNode;
  initialTab: Tab;
  initialWindow: Window;
}

export function RankTabs({
  children,
  initialTab,
  initialWindow,
}: RankTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as Tab) ?? initialTab;
  const activeWindow = (searchParams.get("window") as Window) ?? initialWindow;

  const switchTab = (tab: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
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
