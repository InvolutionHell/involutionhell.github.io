"use client";

import { useCallback, useEffect, useState } from "react";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
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
  content?: string;
  slug?: string;
}

interface DocsAssistantProps {
  pageContext: PageContext;
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

  const chat = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: () => {
        const apiKey = provider === "openai" ? openaiApiKey : geminiApiKey;
        return {
          pageContext,
          provider,
          apiKey,
        };
      },
    }),
  });

  const {
    error: chatError,
    status: chatStatus,
    clearError: clearChatError,
  } = chat;
  const [assistantError, setAssistantError] =
    useState<AssistantErrorState | null>(null);

  useEffect(() => {
    if (!chatError) {
      return;
    }

    setAssistantError(deriveAssistantError(chatError, provider));
    clearChatError();
  }, [chatError, clearChatError, provider]);

  useEffect(() => {
    if (chatStatus === "submitted" || chatStatus === "streaming") {
      setAssistantError(null);
    }
  }, [chatStatus]);

  const handleClearError = useCallback(() => {
    setAssistantError(null);
    clearChatError();
  }, [clearChatError]);

  const runtime = useAISDKRuntime(chat);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <AssistantModal
        errorMessage={assistantError?.message}
        showSettingsAction={assistantError?.showSettingsCTA ?? false}
        onClearError={assistantError ? handleClearError : undefined}
      />
    </AssistantRuntimeProvider>
  );
}

interface AssistantErrorState {
  message: string;
  showSettingsCTA: boolean;
}

function deriveAssistantError(
  err: unknown,
  provider: "openai" | "gemini",
): AssistantErrorState {
  const providerLabel = provider === "gemini" ? "Google Gemini" : "OpenAI";
  const fallback: AssistantErrorState = {
    message:
      "The assistant couldn't complete that request. Please try again later.",
    showSettingsCTA: false,
  };

  if (!err) {
    return fallback;
  }

  const maybeError = err as Partial<{
    message?: string;
    statusCode?: number;
    responseBody?: string;
    data?: unknown;
  }>;

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

  if (!message && err instanceof Error && typeof err.message === "string") {
    message = err.message.trim();
  }

  if (!message && maybeError.data && typeof maybeError.data === "object") {
    const dataError = (maybeError.data as { error?: unknown }).error;
    if (typeof dataError === "string" && dataError.trim().length > 0) {
      message = dataError.trim();
    }
  }

  const statusCode =
    typeof maybeError.statusCode === "number"
      ? maybeError.statusCode
      : undefined;
  const normalized = message.toLowerCase();

  let showSettingsCTA = false;

  if (
    statusCode === 400 ||
    statusCode === 401 ||
    statusCode === 403 ||
    normalized.includes("api key") ||
    normalized.includes("apikey") ||
    normalized.includes("missing key") ||
    normalized.includes("unauthorized")
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
    friendlyMessage =
      "The provider is rate limiting requests. Please wait and try again.";
  } else if (statusCode && statusCode >= 500) {
    friendlyMessage =
      "The AI provider is currently unavailable. Please try again soon.";
  }

  return {
    message: friendlyMessage,
    showSettingsCTA,
  };
}

function extractErrorFromResponseBody(body: string): string | undefined {
  const trimmed = body.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === "string") {
      return parsed.trim();
    }
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as { error?: unknown }).error === "string"
    ) {
      return (parsed as { error: string }).error.trim();
    }
  } catch {
    // Ignore JSON parsing issues and fall back to the raw body text.
  }

  return trimmed;
}
