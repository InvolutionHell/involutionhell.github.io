import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, UIMessage, convertToModelMessages } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    system,
    pageContext,
    provider,
    apiKey,
  }: {
    messages: UIMessage[];
    system?: string; // System message forwarded from AssistantChatTransport
    tools?: unknown; // Frontend tools forwarded from AssistantChatTransport
    pageContext?: {
      title?: string;
      description?: string;
      content?: string;
      slug?: string;
    };
    provider?: "openai" | "gemini";
    apiKey?: string;
  } = await req.json();

  // Check if API key is provided
  if (!apiKey || apiKey.trim() === "") {
    return Response.json(
      {
        error:
          "API key is required. Please configure your API key in the settings.",
      },
      { status: 400 },
    );
  }

  try {
    // Build system message with page context
    let systemMessage =
      system ||
      `You are a helpful AI assistant for a documentation website. 
    You can help users understand the documentation, answer questions about the content, 
    and provide guidance on the topics covered in the docs. Be concise and helpful.`;

    // Add current page context if available
    if (pageContext?.content) {
      systemMessage += `\n\n--- CURRENT PAGE CONTEXT ---\n`;
      if (pageContext.title) {
        systemMessage += `Page Title: ${pageContext.title}\n`;
      }
      if (pageContext.description) {
        systemMessage += `Page Description: ${pageContext.description}\n`;
      }
      if (pageContext.slug) {
        systemMessage += `Page URL: /docs/${pageContext.slug}\n`;
      }
      systemMessage += `Page Content:\n${pageContext.content}`;
      systemMessage += `\n--- END OF CONTEXT ---\n\nWhen users ask about "this page", "current page", or refer to the content they're reading, use the above context to provide accurate answers. You can summarize, explain, or answer specific questions about the current page content.`;
    }

    // Select model based on provider
    let model;
    if (provider === "gemini") {
      const customGoogle = createGoogleGenerativeAI({
        apiKey: apiKey,
      });
      model = customGoogle("models/gemini-2.0-flash");
    } else {
      // Default to OpenAI
      const customOpenAI = createOpenAI({
        apiKey: apiKey,
      });
      model = customOpenAI("gpt-4.1-nano");
    }

    const result = streamText({
      model: model,
      system: systemMessage,
      messages: convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: "Failed to process chat request" },
      { status: 500 },
    );
  }
}
