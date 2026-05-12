import {
  ActionBarPrimitive,
  BranchPickerPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useMessage,
} from "@assistant-ui/react";
import {
  AlertCircleIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  LockIcon,
  PencilIcon,
  RefreshCwIcon,
  Square,
} from "lucide-react";
import type { FC } from "react";
import { useCallback, useState } from "react";

import {
  ComposerAttachments,
  UserMessageAttachments,
} from "@/app/components/assistant-ui/attachment";
import { SettingsButton } from "@/app/components/assistant-ui/SettingsButton";
import { SettingsDialog } from "@/app/components/assistant-ui/SettingsDialog";
import { MarkdownText } from "@/app/components/assistant-ui/markdown-text";
import { ToolFallback } from "@/app/components/assistant-ui/tool-fallback";
import { TooltipIconButton } from "@/app/components/assistant-ui/tooltip-icon-button";
import { useAssistantSettings } from "@/app/hooks/useAssistantSettings";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import * as m from "motion/react-m";

export interface WelcomeSuggestion {
  title: string;
  label: string;
  action: string;
}

interface ThreadProps {
  // 错误信息
  errorMessage?: string;
  // 是否显示设置操作按钮
  showSettingsAction?: boolean;
  // 清除错误的回调函数
  onClearError?: () => void;
  // AI 生成的后续问题建议
  suggestions?: string[];
  // 是否正在加载建议
  isLoadingSuggestions?: boolean;
  // AI 生成的欢迎问题建议
  welcomeSuggestions?: WelcomeSuggestion[];
  // 是否正在加载欢迎建议
  isLoadingWelcome?: boolean;
}

export const Thread: FC<ThreadProps> = ({
  errorMessage,
  showSettingsAction = false,
  onClearError,
  suggestions,
  isLoadingSuggestions,
  welcomeSuggestions,
  isLoadingWelcome,
}) => {
  // 控制设置对话框是否打开的状态
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSettingsChange = useCallback(
    (open: boolean) => {
      if (open) {
        onClearError?.();
      }
      setIsSettingsOpen(open);
    },
    [onClearError],
  );

  // 打开设置对话框的处理函数
  const handleOpenSettings = useCallback(() => {
    handleSettingsChange(true);
  }, [handleSettingsChange]);

  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        <ThreadPrimitive.Root
          className="aui-root aui-thread-root @container flex h-full flex-col bg-[var(--background)]"
          style={{
            ["--thread-max-width" as string]: "44rem",
          }}
        >
          <ThreadPrimitive.Viewport className="aui-thread-viewport relative flex flex-1 flex-col overflow-x-auto overflow-y-scroll px-4 scrollbar-thin scrollbar-thumb-[var(--foreground)] scrollbar-track-transparent">
            {/* 欢迎界面，当没有消息时显示 */}
            <ThreadWelcome />
            <ThreadPrimitive.Empty>
              <ThreadWelcomeSuggestions
                suggestions={welcomeSuggestions}
                isLoading={isLoadingWelcome}
              />
            </ThreadPrimitive.Empty>

            {/* 消息列表，包含用户消息和 AI 消息 */}
            <ThreadPrimitive.Messages
              components={{
                UserMessage,
                EditComposer,
                AssistantMessage,
              }}
            />
            {errorMessage ? (
              <ThreadErrorNotice
                message={errorMessage}
                onDismiss={onClearError}
                onOpenSettings={
                  showSettingsAction ? handleOpenSettings : undefined
                }
              />
            ) : null}

            {/* 如果非空（有消息），显示后续建议和底部输入框 */}
            <ThreadPrimitive.If empty={false}>
              <ThreadFollowupSuggestions
                suggestions={suggestions}
                isLoading={isLoadingSuggestions}
              />
              <div className="aui-thread-viewport-spacer min-h-8 grow" />
            </ThreadPrimitive.If>
            <Composer
              isSettingsOpen={isSettingsOpen}
              onOpenChange={handleSettingsChange}
              onClearError={onClearError}
            />
          </ThreadPrimitive.Viewport>
        </ThreadPrimitive.Root>
      </MotionConfig>
    </LazyMotion>
  );
};

interface ThreadErrorNoticeProps {
  message: string;
  onDismiss?: () => void;
  onOpenSettings?: () => void;
}

const ThreadErrorNotice: FC<ThreadErrorNoticeProps> = ({
  message,
  onDismiss,
  onOpenSettings,
}) => {
  return (
    <div className="aui-thread-error-notice-wrapper mx-auto mt-4 flex w-full max-w-[var(--thread-max-width)] justify-center">
      <div className="aui-thread-error-notice flex w-full gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive dark:border-destructive/40 dark:bg-destructive/5">
        <AlertCircleIcon className="aui-thread-error-icon mt-0.5 size-5 shrink-0" />
        <div className="aui-thread-error-content flex flex-col gap-3">
          <span className="aui-thread-error-message leading-relaxed">
            {message}
          </span>
          <div className="aui-thread-error-actions flex flex-wrap items-center gap-2">
            {onOpenSettings ? (
              <Button
                size="sm"
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10"
                onClick={onOpenSettings}
              >
                Open settings
              </Button>
            ) : null}
            {onDismiss ? (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10"
                onClick={onDismiss}
              >
                Dismiss
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        variant="outline"
        className="aui-thread-scroll-to-bottom absolute -top-12 z-10 self-center rounded-full p-4 disabled:invisible dark:bg-background dark:hover:bg-accent"
      >
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

// 欢迎界面组件
const ThreadWelcome: FC = () => {
  return (
    <ThreadPrimitive.Empty>
      <div className="aui-thread-welcome-root mx-auto my-auto flex w-full max-w-[var(--thread-max-width)] flex-grow flex-col">
        <div className="aui-thread-welcome-center flex w-full flex-grow flex-col items-center justify-center">
          <div className="aui-thread-welcome-message flex size-full flex-col justify-center px-8">
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="aui-thread-welcome-message-motion-1 text-2xl font-serif font-bold text-[var(--foreground)]"
            >
              你好！
            </m.div>
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ delay: 0.1 }}
              className="aui-thread-welcome-message-motion-2 text-2xl text-neutral-500 font-serif italic"
            >
              今天有什么可以帮你的吗？
            </m.div>
          </div>
        </div>
      </div>
    </ThreadPrimitive.Empty>
  );
};

// 欢迎页面的初始建议组件
interface ThreadWelcomeSuggestionsProps {
  suggestions?: WelcomeSuggestion[];
  isLoading?: boolean;
}

const ThreadWelcomeSuggestions: FC<ThreadWelcomeSuggestionsProps> = ({
  suggestions,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="aui-thread-welcome-suggestions grid w-full gap-2 @md:grid-cols-2">
        {/* 显示4个骨架屏来代表四条预取建议 */}
        {[1, 2, 3, 4].map((i) => (
          <div
            key={`skeleton-${i}`}
            className="aui-thread-welcome-suggestion-display [&:nth-child(n+3)]:hidden @md:[&:nth-child(n+3)]:block"
          >
            <div className="aui-thread-welcome-suggestion h-auto w-full flex-1 flex-col items-start justify-start gap-2 rounded-3xl border border-muted px-5 py-4 animate-pulse bg-muted/30">
              <div className="h-4 w-1/2 rounded bg-muted-foreground/20"></div>
              <div className="h-3 w-1/3 rounded bg-muted-foreground/10"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 如果建议为空也没显示骨架屏（例如出错或加载失败），依然展示默认退避问题
  const defaultSuggestions: WelcomeSuggestion[] = [
    {
      title: "总结本文",
      label: "内容要点",
      action: "请帮我总结一下当前页面的主要内容和要点",
    },
    {
      title: "什么是基座大模型",
      label: "概念解释",
      action: "什么是基座大模型？请详细解释一下",
    },
    {
      title: "解释技术概念",
      label: "深入理解",
      action: "请解释一下这个页面中提到的核心技术概念",
    },
    {
      title: "学习建议",
      label: "如何入门",
      action: "基于当前内容，你能给出一些学习建议和入门路径吗？",
    },
  ];

  const displaySuggestions = suggestions?.length
    ? suggestions
    : defaultSuggestions;

  return (
    <div className="aui-thread-welcome-suggestions grid w-full gap-2 @md:grid-cols-2">
      {displaySuggestions.map((suggestedAction, index) => (
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className="aui-thread-welcome-suggestion-display [&:nth-child(n+3)]:hidden @md:[&:nth-child(n+3)]:block"
        >
          <ThreadPrimitive.Suggestion
            prompt={suggestedAction.action}
            method="replace"
            autoSend
            asChild
          >
            <Button
              variant="ghost"
              className="aui-thread-welcome-suggestion h-auto w-full flex-1 flex-wrap items-start justify-start gap-1 rounded-3xl border px-5 py-4 text-left text-sm @md:flex-col dark:hover:bg-accent/60"
              aria-label={suggestedAction.action}
            >
              <span className="aui-thread-welcome-suggestion-text-1 font-medium">
                {suggestedAction.title}
              </span>
              <span className="aui-thread-welcome-suggestion-text-2 text-muted-foreground">
                {suggestedAction.label}
              </span>
            </Button>
          </ThreadPrimitive.Suggestion>
        </m.div>
      ))}
    </div>
  );
};

// 输入框组件 Props
interface ComposerProps {
  isSettingsOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onClearError?: () => void;
}

// 输入框组件，负责处理用户输入和发送消息
const Composer: FC<ComposerProps> = ({
  isSettingsOpen,
  onOpenChange,
  onClearError,
}) => {
  const { provider, openaiApiKey, geminiApiKey } = useAssistantSettings();
  const activeKey =
    provider === "openai"
      ? openaiApiKey
      : provider === "gemini"
        ? geminiApiKey
        : "";
  const hasActiveKey = provider === "intern" || activeKey.trim().length > 0;
  const providerLabel =
    provider === "gemini"
      ? "Google Gemini"
      : provider === "intern"
        ? "Intern-AI"
        : "OpenAI";

  const handleOpenSettings = useCallback(() => {
    onClearError?.();
    onOpenChange(true);
  }, [onClearError, onOpenChange]);

  return (
    <div className="aui-composer-wrapper sticky bottom-0 mx-auto flex w-full max-w-[var(--thread-max-width)] flex-col gap-4 overflow-visible bg-[var(--background)] pb-4 md:pb-6 pt-2 border-t border-[var(--foreground)]">
      <ThreadScrollToBottom />
      {/* 当没有消息时，显示空状态内容（现已经移到上面的Viewport内以统一滑动，这里可以置空或保留其它用途）*/}
      <ComposerPrimitive.Root
        className="aui-composer-root relative flex w-full flex-col rounded-none border border-[var(--foreground)] bg-[var(--background)] px-1 pt-2 shadow-none"
        aria-disabled={!hasActiveKey}
        data-key-required={!hasActiveKey}
      >
        {!hasActiveKey && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[var(--background)] px-6 text-center">
            <p className="text-sm text-muted-foreground">
              Add your {providerLabel} API key in Settings to start chatting.
            </p>
            <Button
              type="button"
              size="sm"
              onClick={handleOpenSettings}
              className="rounded-none border border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)]"
            >
              Open settings
            </Button>
          </div>
        )}
        <ComposerAttachments />
        <ComposerPrimitive.Input
          placeholder="Send a message..."
          className="aui-composer-input mb-1 max-h-32 min-h-16 w-full resize-none bg-transparent px-3.5 pt-1.5 pb-3 text-base outline-none placeholder:text-muted-foreground focus:outline-primary"
          rows={1}
          autoFocus
          aria-label="Message input"
          disabled={!hasActiveKey}
          // 单条消息硬上限 4000 字符：防 token bomb，保护免费模型额度
          maxLength={4000}
        />
        <ComposerAction
          canSend={hasActiveKey}
          isSettingsOpen={isSettingsOpen}
          onOpenChange={onOpenChange}
          onOpenSettings={handleOpenSettings}
          onClearError={onClearError}
        />
      </ComposerPrimitive.Root>
    </div>
  );
};

interface ComposerActionProps {
  canSend: boolean;
  isSettingsOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenSettings: () => void;
  onClearError?: () => void;
}

// 输入框操作按钮组件（发送、设置、取消）
const ComposerAction: FC<ComposerActionProps> = ({
  canSend,
  isSettingsOpen,
  onOpenChange,
  onOpenSettings,
  onClearError,
}) => {
  return (
    <>
      <div className="aui-composer-action-wrapper relative mx-1 mt-2 mb-2 flex items-center justify-between">
        <SettingsButton onClick={onOpenSettings} />

        <ThreadPrimitive.If running={false}>
          {canSend ? (
            <ComposerPrimitive.Send asChild>
              <TooltipIconButton
                tooltip="Send message"
                side="bottom"
                type="submit"
                variant="default"
                size="icon"
                className="aui-composer-send size-[34px] rounded-full p-1"
                aria-label="Send message"
                onClick={onClearError}
              >
                <ArrowUpIcon className="aui-composer-send-icon size-5" />
              </TooltipIconButton>
            </ComposerPrimitive.Send>
          ) : (
            <TooltipIconButton
              tooltip="Configure an API key to enable sending"
              side="bottom"
              type="button"
              variant="default"
              size="icon"
              className="aui-composer-send size-[34px] rounded-full p-1"
              aria-label="Open assistant settings"
              onClick={onOpenSettings}
            >
              <LockIcon className="aui-composer-send-icon size-5" />
            </TooltipIconButton>
          )}
        </ThreadPrimitive.If>

        <ThreadPrimitive.If running>
          <ComposerPrimitive.Cancel asChild>
            <Button
              type="button"
              variant="default"
              size="icon"
              className="aui-composer-cancel size-[34px] rounded-full border border-muted-foreground/60 hover:bg-primary/75 dark:border-muted-foreground/90"
              aria-label="Stop generating"
            >
              <Square className="aui-composer-cancel-icon size-3.5 fill-white dark:fill-black" />
            </Button>
          </ComposerPrimitive.Cancel>
        </ThreadPrimitive.If>
      </div>
      <SettingsDialog isOpen={isSettingsOpen} onOpenChange={onOpenChange} />
    </>
  );
};

const MessageError: FC = () => {
  return (
    <MessagePrimitive.Error>
      <ErrorPrimitive.Root className="aui-message-error-root mt-2 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive dark:bg-destructive/5 dark:text-red-200">
        <ErrorPrimitive.Message className="aui-message-error-message line-clamp-2" />
      </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
  );
};

// AI 消息组件
// 正在思考的加载状态组件
const ThreadThinking: FC = () => {
  return (
    <span className="aui-thread-thinking inline-flex items-center gap-1 h-5 ml-2">
      <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
      <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
      <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce"></span>
    </span>
  );
};

const AssistantMessageContent: FC = () => {
  const message = useMessage() as unknown as {
    status?: string | { type: string };
    content?: string | unknown[];
  };

  const isRunning =
    message.status === "in_progress" ||
    (typeof message.status === "object" && message.status?.type === "running");

  const hasContent =
    message.content &&
    (typeof message.content === "string"
      ? message.content.length > 0
      : Array.isArray(message.content)
        ? message.content.length > 0
        : !!message.content);

  return (
    <>
      <MessagePrimitive.Parts
        components={{
          Text: MarkdownText,
          tools: { Fallback: ToolFallback },
        }}
      />

      {/* 当正在生成且内容为空时显示加载动画 */}
      {isRunning && !hasContent && (
        <div className="absolute top-4 left-4">
          <ThreadThinking />
        </div>
      )}

      <MessageError />
    </>
  );
};

const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root asChild>
      <div
        className="aui-assistant-message-root relative mx-auto w-full max-w-[var(--thread-max-width)] animate-in py-4 duration-200 fade-in slide-in-from-bottom-1 last:mb-24"
        data-role="assistant"
      >
        <div className="aui-assistant-message-content mx-2 leading-7 break-words text-foreground bg-muted px-5 py-3 min-h-[3.25rem]">
          <AssistantMessageContent />
        </div>

        <div className="aui-assistant-message-footer mt-2 ml-2 flex">
          <BranchPicker />
          <AssistantActionBar />
        </div>
      </div>
    </MessagePrimitive.Root>
  );
};

// AI 消息操作栏（复制、刷新）
const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      autohideFloat="single-branch"
      className="aui-assistant-action-bar-root col-start-3 row-start-2 -ml-1 flex gap-1 text-muted-foreground data-floating:absolute data-floating:rounded-md data-floating:border data-floating:bg-background data-floating:p-1 data-floating:shadow-sm"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip="Copy">
          <MessagePrimitive.If copied>
            <CheckIcon />
          </MessagePrimitive.If>
          <MessagePrimitive.If copied={false}>
            <CopyIcon />
          </MessagePrimitive.If>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip="Refresh">
          <RefreshCwIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
    </ActionBarPrimitive.Root>
  );
};

// 用户消息组件
const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root asChild>
      <div
        className="aui-user-message-root mx-auto grid w-full max-w-[var(--thread-max-width)] animate-in auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 px-2 py-4 duration-200 fade-in slide-in-from-bottom-1 first:mt-3 last:mb-5 [&:where(>*)]:col-start-2"
        data-role="user"
      >
        <UserMessageAttachments />

        <div className="aui-user-message-content-wrapper relative col-start-2 min-w-0">
          <div className="aui-user-message-content rounded-none bg-[var(--foreground)] px-5 py-3 break-words text-[var(--background)] border border-[var(--foreground)]">
            <MessagePrimitive.Parts />
          </div>
          <div className="aui-user-action-bar-wrapper absolute top-1/2 left-0 -translate-x-full -translate-y-1/2 pr-2">
            <UserActionBar />
          </div>
        </div>

        <BranchPicker className="aui-user-branch-picker col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
      </div>
    </MessagePrimitive.Root>
  );
};

// 用户消息操作栏（编辑）
const UserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="aui-user-action-bar-root flex flex-col items-end"
    >
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip="Edit" className="aui-user-action-edit p-4">
          <PencilIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
};

// 编辑输入框组件（用于编辑已发送的消息）
const EditComposer: FC = () => {
  return (
    <div className="aui-edit-composer-wrapper mx-auto flex w-full max-w-[var(--thread-max-width)] flex-col gap-4 px-2 first:mt-4">
      <ComposerPrimitive.Root className="aui-edit-composer-root ml-auto flex w-full max-w-7/8 flex-col rounded-xl bg-muted">
        <ComposerPrimitive.Input
          className="aui-edit-composer-input flex min-h-[60px] w-full resize-none bg-transparent p-4 text-foreground outline-none"
          autoFocus
        />

        <div className="aui-edit-composer-footer mx-3 mb-3 flex items-center justify-center gap-2 self-end">
          <ComposerPrimitive.Cancel asChild>
            <Button variant="ghost" size="sm" aria-label="Cancel edit">
              Cancel
            </Button>
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send asChild>
            <Button size="sm" aria-label="Update message">
              Update
            </Button>
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </div>
  );
};

// 分支切换组件（用于在多次生成的回复之间切换）
const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
  className,
  ...rest
}) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn(
        "aui-branch-picker-root mr-2 -ml-2 inline-flex items-center text-xs text-muted-foreground",
        className,
      )}
      {...rest}
    >
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip="Previous">
          <ChevronLeftIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      <span className="aui-branch-picker-state font-medium">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip="Next">
          <ChevronRightIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};

// 后续问题建议组件 Props
interface ThreadFollowupSuggestionsProps {
  suggestions?: string[];
  isLoading?: boolean;
}

// 后续问题建议组件，显示 AI 生成的建议问题
const ThreadFollowupSuggestions: FC<ThreadFollowupSuggestionsProps> = ({
  suggestions,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="flex w-full max-w-[var(--thread-max-width)] flex-col items-start gap-2 mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-muted-foreground text-sm animate-pulse">
          正在思考后续问题...
        </div>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="flex w-full max-w-[var(--thread-max-width)] flex-col gap-2 mx-auto px-4 py-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
        建议提问
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <ThreadPrimitive.Suggestion
            key={`suggestion-${index}`}
            prompt={suggestion}
            method="replace"
            autoSend
            asChild
          >
            <Button
              variant="outline"
              className="h-auto whitespace-normal text-left justify-start px-3 py-2 text-sm rounded-xl border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-colors"
            >
              {suggestion}
            </Button>
          </ThreadPrimitive.Suggestion>
        ))}
      </div>
    </div>
  );
};
