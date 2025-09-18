import { openai } from "@ai-sdk/openai";
import { streamText, UIMessage, convertToModelMessages, tool } from "ai";
import { frontendTools } from "@assistant-ui/react-ai-sdk";
import { z } from "zod";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    system,
    tools,
  }: {
    messages: UIMessage[];
    system?: string; // System message forwarded from AssistantChatTransport
    tools?: any; // Frontend tools forwarded from AssistantChatTransport
  } = await req.json();

  try {
    const result = streamText({
      model: openai("gpt-4o-mini"), // Using more cost-effective model
      system:
        system ||
        `You are a helpful AI assistant for a documentation website. 
      You can help users understand the documentation, answer questions about the content, 
      and provide guidance on the topics covered in the docs. Be concise and helpful.`,
      messages: convertToModelMessages(messages),
      tools: {
        // Wrap frontend tools with frontendTools helper
        ...frontendTools(tools),
        // Backend tools
        get_documentation_info: tool({
          description:
            "Get information about the current documentation page or topic",
          inputSchema: z.object({
            topic: z
              .string()
              .describe("The topic or page to get information about"),
          }),
          execute: async ({ topic }) => {
            return `This is a documentation website covering topics like AI, computer science, and development guides. The current topic "${topic}" is part of our comprehensive documentation collection.`;
          },
        }),
        search_docs: tool({
          description: "Search through the documentation for specific topics",
          inputSchema: z.object({
            query: z.string().describe("The search query"),
          }),
          execute: async ({ query }) => {
            return `Searching for "${query}" in the documentation. This site covers AI foundations, computer science fundamentals, and development guides.`;
          },
        }),
      },
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
