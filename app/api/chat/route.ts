import { openai } from "@ai-sdk/openai";
import { streamText, UIMessage, convertToModelMessages } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    system,
    pageContext,
  }: {
    messages: UIMessage[];
    system?: string; // System message forwarded from AssistantChatTransport
    tools?: any; // Frontend tools forwarded from AssistantChatTransport
    pageContext?: {
      title?: string;
      description?: string;
      content?: string;
      slug?: string;
    };
  } = await req.json();

  console.log("Chat API received request. pageContext (API):", {
    title: pageContext?.title,
    contentPreview: pageContext?.content?.substring(0, 100) + "...",
    slug: pageContext?.slug,
  });

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

    const result = streamText({
      model: openai("gpt-4.1-nano"), // Using more cost-effective model
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
