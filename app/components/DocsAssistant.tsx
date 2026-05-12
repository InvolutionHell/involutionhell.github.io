"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";

import {
  AssistantRuntimeProvider,
  type AssistantRuntime,
} from "@assistant-ui/react";
import { useAISDKRuntime } from "@assistant-ui/react-ai-sdk";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AssistantModal } from "@/app/components/assistant-ui/assistant-modal";
import {
  AssistantSettingsProvider,
  useAssistantSettings,
} from "@/app/hooks/useAssistantSettings";

interface PageContext {
  title?: string;
  description?: string;
  slug?: string;
}

export interface WelcomeSuggestion {
  title: string;
  label: string;
  action: string;
}

interface DocsAssistantProps {
  pageContext: PageContext;
}

function hashTransportConfig(value: string): string {
  // 使用FNV-1a（32位）算法，避免在客户端聊天ID中嵌入原始API密钥。
  let hash = 0x811c9dc5;

  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(36);
}

export function DocsAssistant({ pageContext }: DocsAssistantProps) {
  return (
    <AssistantSettingsProvider>
      <DocsAssistantInner pageContext={pageContext} />
    </AssistantSettingsProvider>
  );
}

function DocsAssistantInner({ pageContext }: DocsAssistantProps) {
  const { provider, openaiApiKey, geminiApiKey } = useAssistantSettings();

  const apiKey =
    provider === "openai"
      ? openaiApiKey
      : provider === "gemini"
        ? geminiApiKey
        : "";

  // 按 slug 从 localStorage 读取或生成持久化会话 ID
  // 同一文档页关闭后再打开依然复用同一 chatId，保持会话连续性
  const [chatId] = useState<string>(() => {
    // SSR 阶段无法访问 localStorage，生成占位 ID（不影响 DOM，不产生 hydration 警告）
    if (typeof window === "undefined") {
      return `chat-ssr-${Math.random().toString(36).slice(2)}`;
    }
    const key = `chat_id:${pageContext.slug ?? "__global__"}`;
    const stored = localStorage.getItem(key);
    if (stored) return stored;
    const newId = `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, newId);
    return newId;
  });

  const chatRuntimeId = useMemo(
    () => `${chatId}:${provider}:${hashTransportConfig(apiKey)}`,
    [chatId, provider, apiKey],
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: {
          pageContext,
          provider,
          apiKey,
          chatId,
        },
        // 在每次请求时动态读取 satoken，避免用户登录前创建 transport 导致 token 为空
        fetch: async (url, init) => {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("satoken")
              : null;
          const headers = new Headers(init?.headers);
          if (token) headers.set("x-satoken", token);
          return fetch(url, { ...init, headers });
        },
      }),
    [pageContext, provider, apiKey, chatId],
  );

  const [suggestions, setSuggestions] = useState<string[]>([]);
  // 仅标志后台是否正在获取建议（用于逻辑判断）
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  // 控制 UI 上是否显示“正在思考...”加载状态（只有主回答结束后，由于建议还在获取，才显示骨架屏）
  const [showSuggestionsLoader, setShowSuggestionsLoader] = useState(false);
  // 缓存获取好的建议，等待主回答结束后才推给 Thread 渲染
  const [pendingSuggestions, setPendingSuggestions] = useState<string[]>([]);

  // 欢迎页建议相关的 state
  const [welcomeSuggestions, setWelcomeSuggestions] = useState<
    WelcomeSuggestion[]
  >([]);
  const [isLoadingWelcome, setIsLoadingWelcome] = useState(false);
  const fetchedWelcomeRef = useRef(false);

  // 埋点上报函数
  // x-satoken 由服务端验证身份，不在 body 里传 userId（服务端自己解析）
  const logAnalyticsEvent = useCallback(
    async (eventType: string, eventData?: Record<string, unknown>) => {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("satoken")
            : null;
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) headers["x-satoken"] = token;

        await fetch("/api/analytics", {
          method: "POST",
          headers,
          body: JSON.stringify({
            eventType,
            eventData: {
              ...eventData,
              chatId,
              url: window.location.href,
              provider,
            },
          }),
        });
      } catch (e) {
        console.error("Failed to log analytics event:", e);
      }
    },
    [chatId, provider],
  );

  // 组件挂载时上报打开事件
  useEffect(() => {
    logAnalyticsEvent("assistant_opened");
  }, [logAnalyticsEvent]);

  const chat = useChat({
    // ai-sdk/react 的 useChat 只在 id 改变时重建内部 Chat 实例；
    // transport/body 变化不会自动生效。这里用 runtime id 触发重建，
    // 同时保留 body.chatId 作为后端持久化会话 id。
    id: chatRuntimeId,
    transport,
    onFinish: () => {
      // 聊天流式传输完成后（onFinish），记录一次查询行为
      if (window.umami) {
        window.umami.track("ai_assistant_query");
      }
      logAnalyticsEvent("message_completed");
    },
  });

  const {
    error: chatError,
    status: chatStatus,
    messages,
    clearError: clearChatError,
    // 其他需要的属性...
  } = chat;

  // 初次加载欢迎建议的 Effect
  useEffect(() => {
    // 只有在没消息、且还没尝试获取过时才去拉取
    if (messages.length === 0 && !fetchedWelcomeRef.current) {
      fetchedWelcomeRef.current = true;
      setIsLoadingWelcome(true);

      (async () => {
        try {
          const response = await fetch("/api/suggestions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [],
              pageContext,
              provider,
              apiKey,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data && Array.isArray(data.questions)) {
              // 这里的 questions 实际上在欢迎时是个对象数组
              setWelcomeSuggestions(data.questions);
            }
          }
        } catch (error) {
          console.error("获取欢迎建议失败:", error);
        } finally {
          setIsLoadingWelcome(false);
        }
      })();
    }
  }, [messages.length, pageContext, provider, apiKey]);

  // 跟踪上一次的状态，用于检测对话结束
  const prevStatusRef = useRef(chatStatus);

  useEffect(() => {
    const prevStatus = prevStatusRef.current;

    // 当用户发送新消息时（状态从非提交/流式跳转为提交/流式状态）
    const isNewRequest =
      (chatStatus === "submitted" || chatStatus === "streaming") &&
      prevStatus !== "submitted" &&
      prevStatus !== "streaming";

    if (isNewRequest) {
      // 对话开始，清空旧建议，准备在后台预先获取新建议并行处理
      setSuggestions([]);
      setPendingSuggestions([]);
      setIsFetchingSuggestions(true);
      setShowSuggestionsLoader(false);

      const currentMessages = messages;

      (async () => {
        try {
          const response = await fetch("/api/suggestions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: currentMessages,
              pageContext,
              provider,
              apiKey,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data && Array.isArray(data.questions)) {
              setPendingSuggestions(data.questions);
              logAnalyticsEvent("suggestions_generated", {
                count: data.questions.length,
              });
            }
          }
        } catch (error) {
          console.error("获取建议失败:", error);
        } finally {
          setIsFetchingSuggestions(false);
        }
      })();
    }

    // 监控 AI 主流程是否结束：当从 'streaming' 变为 'submitted' / 结束状态时
    const isChatFinished =
      prevStatus === "streaming" &&
      chatStatus !== "streaming" &&
      chatStatus !== "submitted";

    if (isChatFinished) {
      // 如果到主回答结束时，后台的预取建议还在进行，就开始在UI显示“正在思考”
      if (isFetchingSuggestions) {
        setShowSuggestionsLoader(true);
      } else {
        // 如果当时预取就已经完成了，则直接显示收集好的预取建议
        setSuggestions(pendingSuggestions);
        setShowSuggestionsLoader(false);
      }
    }

    // 最关键：更新过去的聊天状态
    prevStatusRef.current = chatStatus;
  }, [
    chatStatus,
    messages,
    pageContext,
    provider,
    apiKey,
    isFetchingSuggestions,
    pendingSuggestions,
    logAnalyticsEvent,
  ]);

  // 当建议获取状态或 pending 数据改变，且主回答已经不是打字状态时，更新 UI
  useEffect(() => {
    // 假设非正在打字且非提交中，即为主回复闲置状态
    const isIdle = chatStatus !== "streaming" && chatStatus !== "submitted";

    // 如果后台刚刚完成了预取，并且主回复已经闲置，而且存在建议可以展示
    if (!isFetchingSuggestions && isIdle && pendingSuggestions.length > 0) {
      // 检查当前建议是否为空且 pending 建议非空，来避免多次重复触发渲染
      setSuggestions((prev) => {
        if (prev.length === 0) {
          return pendingSuggestions;
        }
        return prev;
      });
      setShowSuggestionsLoader(false);
    }
  }, [isFetchingSuggestions, pendingSuggestions, chatStatus]);

  // 当对话状态重置或开始时清空建议
  useEffect(() => {
    if (chatStatus === "streaming" || chatStatus === "submitted") {
      setSuggestions([]);
      setShowSuggestionsLoader(false);
    }
  }, [chatStatus]);

  // 当 Provider 更改时清除之前的错误
  useEffect(() => {
    clearChatError();
  }, [provider, apiKey, clearChatError]);

  // 当对话状态重置时也清除错误
  useEffect(() => {
    if (chatStatus === "submitted" || chatStatus === "streaming") {
      clearChatError();
    }
  }, [chatStatus, clearChatError]);

  const assistantError =
    chatError && chatStatus !== "submitted" && chatStatus !== "streaming"
      ? deriveAssistantError(chatError, provider)
      : null;

  const handleClearError = useCallback(() => {
    clearChatError();
  }, [clearChatError]);

  // @assistant-ui/react-ai-sdk 与 @assistant-ui/react 内部 AssistantRuntime 类型因版本分叉而不兼容，运行时行为一致
  const runtime = useAISDKRuntime(chat) as unknown as AssistantRuntime;

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <AssistantModal
        errorMessage={assistantError?.message}
        showSettingsAction={assistantError?.showSettingsCTA ?? false}
        onClearError={assistantError ? handleClearError : undefined}
        suggestions={suggestions}
        isLoadingSuggestions={showSuggestionsLoader}
        welcomeSuggestions={welcomeSuggestions}
        isLoadingWelcome={isLoadingWelcome}
      />
    </AssistantRuntimeProvider>
  );
}

interface AssistantErrorState {
  message: string;
  showSettingsCTA: boolean;
}

type AssistantProvider = "openai" | "gemini" | "intern";

type AssistantErrorData = {
  error?: string;
};

type AssistantErrorPayload = {
  message?: string;
  statusCode?: number;
  responseBody?: string;
  data?: AssistantErrorData;
};

type AssistantErrorInput =
  | AssistantErrorPayload
  | Error
  | string
  | null
  | undefined;

function deriveAssistantError(
  err: AssistantErrorInput,
  provider: AssistantProvider,
): AssistantErrorState {
  const providerLabel =
    provider === "gemini"
      ? "Google Gemini"
      : provider === "intern"
        ? "Intern-AI"
        : "OpenAI";
  const fallback: AssistantErrorState = {
    message:
      "The assistant couldn't complete that request. Please try again later.",
    showSettingsCTA: false,
  };

  if (!err) {
    return fallback;
  }

  const maybeError = coerceAssistantErrorPayload(err);

  let message = "";

  if (
    typeof maybeError.message === "string" &&
    maybeError.message.trim().length > 0
  ) {
    message = maybeError.message.trim();
  }

  if (
    typeof maybeError.responseBody === "string" &&
    maybeError.responseBody.trim().length > 0
  ) {
    const extracted = extractErrorFromResponseBody(maybeError.responseBody);
    if (extracted) {
      message = extracted;
    }
  }

  if (!message && maybeError.data?.error) {
    message = maybeError.data.error.trim();
  }

  const statusCode =
    typeof maybeError.statusCode === "number"
      ? maybeError.statusCode
      : undefined;
  const normalized = message.toLowerCase();

  let showSettingsCTA = false;

  // For intern provider, don't show settings CTA for API key related errors
  // 对于书生，不要显示 API 密钥相关的错误
  if (
    provider !== "intern" &&
    (statusCode === 400 ||
      statusCode === 401 ||
      statusCode === 403 ||
      normalized.includes("api key") ||
      normalized.includes("apikey") ||
      normalized.includes("missing key") ||
      normalized.includes("unauthorized"))
  ) {
    showSettingsCTA = true;
  }

  let friendlyMessage = message || fallback.message;

  if (showSettingsCTA) {
    friendlyMessage =
      message && message.length > 0
        ? message
        : `The ${providerLabel} API key looks incorrect. Update it in settings and try again.`;
  } else if (statusCode === 429) {
    // 优先用服务端返回的中文友好提示（rate_limited / quota_exhausted），
    // 只在服务端没给消息时才兜底到默认英文文案
    friendlyMessage =
      message && message.length > 0 ? message : "请求太频繁，请稍等片刻再试。";
  } else if (statusCode && statusCode >= 500) {
    friendlyMessage =
      message && message.length > 0
        ? message
        : "AI 服务暂时不可用，请稍后再试。";
  }

  return {
    message: friendlyMessage,
    showSettingsCTA,
  };
}

function coerceAssistantErrorPayload(
  err: AssistantErrorInput,
): AssistantErrorPayload {
  if (!err) {
    return {};
  }
  if (typeof err === "string") {
    return { message: err };
  }
  if (err instanceof Error) {
    return { message: err.message };
  }
  return err;
}

function extractErrorFromResponseBody(body: string): string | undefined {
  const trimmed = body.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(trimmed) as string | AssistantErrorData;
    if (typeof parsed === "string") {
      return parsed.trim();
    }
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.error === "string"
    ) {
      return parsed.error.trim();
    }
  } catch {
    // Ignore JSON parsing issues and fall back to the raw body text.
    // 忽略 JSON 解析问题，回退到原始正文文本。
  }

  return trimmed;
}
