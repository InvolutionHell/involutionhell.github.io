"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X, ExternalLink } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type Contributor = {
  id: string;
  name: string;
  points: number;
  commits: number;
  avatarUrl: string;
  contributedDocs?: { id: string; title: string; url: string }[];
};

export function ContributorRow({
  user,
  idx,
  maxPoints,
}: {
  user: Contributor;
  idx: number;
  maxPoints: number;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          className="w-full text-left group flex flex-col md:flex-row md:items-center gap-4 border border-[var(--foreground)] p-4 bg-[var(--background)] hard-shadow-hover transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 cursor-pointer"
          data-umami-event="open_contributor_dialog"
          data-umami-event-user={user.name}
        >
          <div className="font-mono text-2xl font-bold w-12 text-center text-[var(--foreground)] shrink-0">
            #{idx + 1}
          </div>
          <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-800 border border-[var(--foreground)] transition-transform group-hover:scale-110 overflow-hidden shrink-0">
            <Image
              src={user.avatarUrl}
              alt={user.name}
              width={48}
              height={48}
              className="w-full h-full object-cover transition-all duration-300"
            />
          </div>
          <div className="flex-1 min-w-[150px] overflow-hidden">
            <div className="font-serif text-xl font-bold text-[var(--foreground)] truncate">
              {user.name}
            </div>
            <div className="font-mono text-xs uppercase text-neutral-500 mt-1">
              {user.points.toLocaleString()} PTS
            </div>
          </div>

          {/* 柱状图可视化积分比例 */}
          <div className="w-full md:w-64 lg:w-96 h-6 border border-[var(--foreground)] bg-neutral-100 dark:bg-neutral-900 overflow-hidden relative shrink-0">
            <div
              className="absolute top-0 left-0 h-full bg-[var(--foreground)] transition-all duration-1000 origin-left"
              style={{ width: `${(user.points / maxPoints) * 100}%` }}
            />
            <div className="absolute inset-0 hidden md:flex items-center px-2 font-mono text-[10px] text-white mix-blend-difference uppercase tracking-widest z-10 pointer-events-none">
              POWER LEVEL
            </div>
          </div>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] outline-none top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border-2 border-[var(--foreground)] bg-[var(--background)] p-6 sm:p-8 shadow-[8px_8px_0px_0px_var(--foreground)] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] max-h-[85vh] flex col">
          {/* 弹窗核心内容：左侧头像，右侧个人基础信息 */}
          <div className="flex justify-between items-start border-b-4 border-[var(--foreground)] pb-6 mb-4 shrink-0 relative">
            <div className="flex gap-5 md:gap-6 items-start w-full pr-12">
              {/* 用户头像 */}
              <div className="w-20 h-20 md:w-24 md:h-24 bg-neutral-200 dark:bg-neutral-800 border-2 border-[var(--foreground)] shrink-0 overflow-hidden">
                <Image
                  src={user.avatarUrl}
                  alt={user.name}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* 用户信息与统计摘要区 */}
              <div className="flex flex-col gap-3 min-w-0 flex-1">
                <div className="flex flex-col gap-1 items-start">
                  {/* 用户名，点击也可跳转 GitHub */}
                  <Dialog.Title className="font-serif text-2xl md:text-3xl font-black uppercase leading-none truncate pr-4">
                    <a
                      href={`https://github.com/${user.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--foreground)] hover:text-[#CC0000] transition-colors"
                      data-umami-event="click_github_profile_name"
                      data-umami-event-user={user.name}
                    >
                      {user.name}
                    </a>
                  </Dialog.Title>
                  <Dialog.Description className="sr-only">
                    Contributions Dossier
                  </Dialog.Description>

                  {/* GitHub 个人主页跳转链接，带有 Umami 点击事件追踪埋点 */}
                  <a
                    href={`https://github.com/${user.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-[var(--foreground)]/70 hover:text-[#CC0000] transition-colors w-max"
                    data-umami-event="click_github_profile"
                    data-umami-event-user={user.name}
                  >
                    GITHUB PROFILE <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* 贡献统计数据展示 */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2">
                  {/* 总积分面板 */}
                  <div className="flex flex-col">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--foreground)]/70 mb-0.5">
                      Total Score
                    </span>
                    <span className="font-serif font-black text-xl md:text-2xl text-[#CC0000] leading-none">
                      {user.points.toLocaleString()}{" "}
                      <span className="text-xs font-mono text-[var(--foreground)] tracking-normal leading-none inline-block align-baseline">
                        PTS
                      </span>
                    </span>
                  </div>

                  {/* 分隔线 */}
                  <div className="w-px h-8 bg-[var(--foreground)]/20"></div>

                  {/* 提交次数面板 */}
                  <div className="flex flex-col">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--foreground)]/70 mb-0.5">
                      Commits
                    </span>
                    <span className="font-serif font-black text-xl md:text-2xl text-[var(--foreground)] leading-none">
                      {user.commits}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 弹窗关闭按钮 */}
            <Dialog.Close className="absolute top-0 right-0 h-8 w-8 flex items-center justify-center border border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CC0000] shrink-0">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>

          {/* 文章贡献历史列表展示 */}
          <div className="overflow-y-auto pr-2 flex-grow min-h-[150px] relative">
            <h4 className="font-mono text-xs uppercase tracking-widest mb-3 text-[#111111]/70 dark:text-neutral-400 flex items-center gap-2">
              Document History
            </h4>
            <div className="flex flex-col gap-0 border-t border-[#111111]/20 dark:border-neutral-200/20">
              {user.contributedDocs && user.contributedDocs.length > 0 ? (
                (() => {
                  // 过滤掉 title 直接等于 id 的脏数据（通常是已被删除或解析失败的文档遗留在数据库中）
                  const validDocs = user.contributedDocs.filter(
                    (doc) => doc.title !== doc.id,
                  );

                  if (validDocs.length === 0) {
                    return (
                      <div className="text-sm font-body italic text-neutral-500 pt-4">
                        No valid document history found.
                      </div>
                    );
                  }

                  return validDocs.map((doc) => (
                    <Link
                      key={doc.id}
                      href={doc.url}
                      className="flex w-full items-center justify-between group/link border-b border-[#111111]/20 dark:border-neutral-200/20 py-3 hover:bg-[#111111]/5 dark:hover:bg-white/5 transition-colors px-2"
                      data-umami-event="click_contributor_doc"
                      data-umami-event-doc={doc.title}
                      data-umami-event-user={user.name}
                    >
                      <span className="font-mono text-sm text-[#111111] dark:text-neutral-200 group-hover/link:underline decoration-2 decoration-[#CC0000] underline-offset-4 truncate pr-4">
                        {doc.title}
                      </span>
                      <ExternalLink className="h-4 w-4 text-[#111111]/50 dark:text-neutral-400 group-hover/link:text-[#CC0000] transition-colors shrink-0" />
                    </Link>
                  ));
                })()
              ) : (
                <div className="text-sm font-body italic text-neutral-500 pt-4">
                  No explicit document history found.
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
