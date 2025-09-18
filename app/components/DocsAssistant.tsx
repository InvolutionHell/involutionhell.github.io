"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useAISDKRuntime } from "@assistant-ui/react-ai-sdk";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AssistantModal } from "@/app/components/assistant-ui/assistant-modal";
import { useAssistantSettings } from "@/app/hooks/useAssistantSettings";

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
  const { provider, openaiApiKey, geminiApiKey } = useAssistantSettings();

  // Use DefaultChatTransport with request-level body configuration
  const chat = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      // Use function to ensure dynamic values are captured at request time
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
