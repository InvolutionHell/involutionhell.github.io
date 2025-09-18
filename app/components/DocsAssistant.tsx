"use client";

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
          pageContext: pageContext,
          provider: provider,
          apiKey: apiKey,
        };
      },
    }),
  });

  const runtime = useAISDKRuntime(chat);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <AssistantModal />
    </AssistantRuntimeProvider>
  );
}
