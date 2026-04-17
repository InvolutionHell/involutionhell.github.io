import { streamText, UIMessage, convertToModelMessages } from "ai";
import { getModel, requiresApiKey, type AIProvider } from "@/lib/ai/models";
import { buildSystemMessage } from "@/lib/ai/prompt";
import { source } from "@/lib/source";
import { limitChat, rateLimitResponse } from "@/lib/rate-limit";
import fs from "fs/promises";
import path from "path";

// 缓存解析后的 MDX 文本，减少重复的磁盘 I/O 和正则解析开销
const mdxContentCache = new Map<string, string>();

// 流式响应最长30秒
export const maxDuration = 30;

interface ChatRequest {
  messages: UIMessage[];
  system?: string;
  pageContext?: {
    title?: string;
    description?: string;
    content?: string;
    slug?: string;
  };
  provider?: AIProvider;
  apiKey?: string;
  chatId?: string;
}

import { resolveUserId } from "@/lib/server-auth";

export async function POST(req: Request) {
  // 0. Rate limit：免费模型 GLM-4.6V-Flash 并发极低（≈ 5），
  //    单用户开几个 tab 就能打爆。per-IP 滑动窗口限流先挡一层。
  //    （L2 防护；如果 Upstash env 漏配会自动降级为放行+warn）
  //
  //    预读 body 判断是否带图（hasImage=true 会触发更严的 5 req/60s 窗口）。
  //    为此多克一次请求，后续 proxyReq/req.json() 仍可独立读（Copilot CR #4）。
  let hasImage = false;
  try {
    const body = (await req.clone().json()) as Partial<ChatRequest>;
    hasImage = messagesHaveImage(body.messages);
  } catch {
    // body 不是合法 JSON：按无图处理，继续让下游的 req.json() 去报真正的错
  }
  const rl = await limitChat(req, hasImage);
  if (!rl.success) return rateLimitResponse(rl);

  // 1. 克隆请求，因为如果代理失败，后面的代码还需要读取 req.json()
  const proxyReq = req.clone();

  // ====== 尝试优雅降级代理到 Java 后端 ======
  // Java 后端 /openai/responses/stream 带 @SaCheckLogin，匿名请求必 401；
  // 直接跳过代理省掉 5s 超时，也避免 401 文案被上游误显示为"unauthorized"。
  // 匿名分支走显式 if 短路，不进 try/catch —— 否则每个匿名请求都会被 catch
  // 打成 "Java Backend unavailable" 带 stack 的 warn，生产日志会刷爆
  // （Copilot CR #1）。
  const satoken = req.headers.get("x-satoken");
  if (!satoken) {
    console.log(
      "[Chat Fallback Proxy] ⏭️  Anonymous request, skip backend proxy, use local inference.",
    );
  } else {
    try {
      const backendUrl = process.env.BACKEND_URL;
      if (!backendUrl) throw new Error("BACKEND_URL is not configured.");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时

      // 原封不动把前端的参数丢给 Java
      let proxyRes: Response;
      try {
        proxyRes = await fetch(`${backendUrl}/openai/responses/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // 浏览器侧用 x-satoken 传递 token，转发给后端时改回后端期望的 satoken
            satoken,
          },
          body: await proxyReq.text(),
          signal: controller.signal,
        });
      } finally {
        // 无论成功还是抛出（网络错误/超时中断），都清除定时器
        clearTimeout(timeoutId);
      }

      // 如果 Java 后端返回成功，则直接把它的流传回浏览器，提前结束
      if (proxyRes.ok && proxyRes.body) {
        console.log(
          "[Chat Fallback Proxy] 🚀 Java Backend responded successfully. Piping stream...",
        );
        return new Response(proxyRes.body, {
          headers: {
            "Content-Type":
              proxyRes.headers.get("Content-Type") ||
              "text/plain; charset=utf-8",
          },
        });
      } else {
        console.warn(
          `[Chat Fallback Proxy] ⚠️ Java Backend returned status: ${proxyRes.status}, fallback to local Next.js inference.`,
        );
      }
    } catch (error) {
      console.warn(
        `[Chat Fallback Proxy] ❌ Java Backend unavailable or timed out, fallback to local Next.js inference. Error:`,
        error,
      );
    }
  }
  // ====== 代理失败/匿名短路，继续往下走，启用备选方案（本地直连 AI）======

  try {
    // 先把 body 消费掉，再并行验证用户身份
    const {
      messages,
      system,
      pageContext,
      provider = "intern", // 默认使用书生模型
      apiKey,
      chatId,
    }: ChatRequest = await req.json();

    // 并行解析用户身份（不阻塞主流程，失败静默降级为匿名）
    const userIdPromise = resolveUserId(req);

    // 对指定Provider验证key是否存在
    if (requiresApiKey(provider) && (!apiKey || apiKey.trim() === "")) {
      return Response.json(
        {
          error:
            "API key is required. Please configure your API key in the settings.",
        },
        { status: 400 },
      );
    }

    // 如果有 slug 但没有 content，尝试在服务端读取内容
    if (pageContext?.slug && !pageContext.content) {
      try {
        const slugArray = pageContext.slug.split("/");
        const page = source.getPage(slugArray);

        if (page) {
          const cachedContent = mdxContentCache.get(page.path);

          // 在生产环境下使用缓存，开发环境下不使用以支持文档热更新
          if (cachedContent) {
            console.log("[Cache hit!!!!]", page.path);
            pageContext.content = cachedContent;
          } else {
            const fullFilePath = path.join(
              process.cwd(),
              "app/docs",
              page.path,
            );
            const rawContent = await fs.readFile(fullFilePath, "utf-8");
            const content = extractTextFromMDX(rawContent);

            mdxContentCache.set(page.path, content);
            pageContext.content = content;
          }
        }
      } catch (error) {
        console.warn(
          "Failed to fetch content for slug:",
          pageContext.slug,
          error,
        );
        // 出错时不中断，只是缺少上下文
      }
    }

    // 构建系统消息，包含页面上下文
    const systemMessage = buildSystemMessage(system, pageContext);

    // 根据Provider获取 AI 模型实例
    const model = getModel(provider, apiKey);

    const effectiveChatId = chatId || crypto.randomUUID();

    // 生成流式响应
    const result = streamText({
      model: model,
      system: systemMessage,
      messages: await convertToModelMessages(messages || []),
      onFinish: async ({ text }) => {
        // 2026-04-17 起对话历史改由后端 /api/chat/sessions/save 统一持久化（事务保证
        // Chat + Message 一起落库）。原本 prisma 直连 Neon 的方案在 Neon → 自建 PG
        // 切换后会产生前后端双写不同库的脏数据，所以整条路径下掉。
        try {
          const backendUrl = process.env.BACKEND_URL;
          if (!backendUrl) {
            console.warn(
              "[Chat History] BACKEND_URL 未配置，跳过持久化（不阻塞流式返回）",
            );
            return;
          }

          // 从 parts 数组中提取最后一条 user 消息的纯文本；AI SDK v5 没有 content
          // 字段，需要自己拼。空消息（role 不是 user 或 parts 为空）就传 null，
          // 后端看到 null/空串会跳过插入，语义和原 Prisma 版 if 判断保持一致。
          const safeMessages = messages || [];
          const lastUserMessage = safeMessages[safeMessages.length - 1];
          const userContent =
            lastUserMessage && lastUserMessage.role === "user"
              ? Array.isArray(lastUserMessage.parts)
                ? lastUserMessage.parts
                    .filter((part) => part.type === "text")
                    .map(
                      (part) => (part as { type: "text"; text: string }).text,
                    )
                    .join("\n")
                : (lastUserMessage as unknown as { content?: string })
                    ?.content || ""
              : "";

          // 后端用 sa-token 从 header 取 userId 关联会话；匿名请求不带 satoken
          // 时后端自动把 userId 置 NULL，行为与原 prisma.chat.upsert 一致。
          // 静默 await 用户解析（原代码 await userIdPromise，这里保持阻塞等待
          // 以确保后端鉴权不会错用过期数据；失败已在 resolveUserId 内降级）。
          await userIdPromise;

          const resp = await fetch(`${backendUrl}/api/chat/sessions/save`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(satoken ? { satoken } : {}),
            },
            body: JSON.stringify({
              chatId: effectiveChatId,
              userMessage: userContent,
              assistantMessage: text,
            }),
          });
          if (!resp.ok) {
            console.warn(
              `[Chat History] backend save returned ${resp.status}, history may be lost for chat ${effectiveChatId}`,
            );
          }
        } catch (error) {
          console.error("Failed to save chat history:", error);
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);

    // 处理特定模型创建错误
    if (error instanceof Error && error.message.includes("API key")) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    // 识别上游（智谱 GLM）限流/欠费/鉴权错误，给出结构化 code 让前端友好提示。
    // 智谱业务码参考：
    //   1302 - 接口请求并发超额（与 HTTP 429 对应）
    //   1113 - 账户余额不足 / 免费额度耗尽
    //   1001/1002/1003 - 鉴权失败
    const mapped = mapUpstreamError(error);
    if (mapped) {
      return Response.json(
        { error: mapped.message, code: mapped.code },
        { status: mapped.status },
      );
    }

    return Response.json(
      { error: "Failed to process chat request" },
      { status: 500 },
    );
  }
}

/**
 * 判断一组 UIMessage 里是否含图片 part。支持 AI SDK v5 的多种图片表达：
 * `type === "image"` / `type === "image_url"` / `type === "file"` 且 mediaType 起头 image。
 * 任何异常结构都当作无图，宁可放过也不误杀。
 */
function messagesHaveImage(messages: unknown): boolean {
  if (!Array.isArray(messages)) return false;
  return messages.some((msg) => {
    if (!msg || typeof msg !== "object") return false;
    const parts = (msg as { parts?: unknown }).parts;
    if (!Array.isArray(parts)) return false;
    return parts.some((part) => {
      if (!part || typeof part !== "object") return false;
      const type = (part as { type?: unknown }).type;
      if (type === "image" || type === "image_url") return true;
      if (type === "file") {
        const mediaType = (part as { mediaType?: unknown }).mediaType;
        return typeof mediaType === "string" && mediaType.startsWith("image/");
      }
      return false;
    });
  });
}

interface MappedUpstreamError {
  status: number;
  code: "rate_limited" | "quota_exhausted" | "upstream_auth" | "upstream_down";
  message: string;
}

function mapUpstreamError(err: unknown): MappedUpstreamError | null {
  if (!err) return null;

  // 仅使用 message / response payload，**不要拼 stack** —— stack 里带行号
  // 形如 `:429:` / `:1302:` 会误匹配业务码正则（Copilot CR #5）。
  // JSON.stringify 对循环引用会抛错，用 try/catch 兜底（Copilot CR #6）。
  let raw: string;
  if (err instanceof Error) {
    raw = err.message;
  } else if (typeof err === "string") {
    raw = err;
  } else {
    try {
      raw = JSON.stringify(err);
    } catch {
      raw = String(err);
    }
  }

  // 业务码正则：全部用 `[^\s]{0,N}?` 代替 `.*`，限死回溯深度避免 ReDoS
  // （CodeQL polynomial regex 告警）。关键词语义够短，10~20 字符窗口足够。
  const hasStatus429 = /\b429\b|rate[-_ ]?limit|too many requests/i.test(raw);
  const has1302 = /\b1302\b|并发超额|速率限制|控制请求频率/.test(raw);
  const has1113 =
    /\b1113\b|余额不足|额度[^\s]{0,10}?耗尽|quota[^\s]{0,10}?exhaust/i.test(
      raw,
    );
  const hasAuth =
    /\b1001\b|\b1002\b|\b1003\b|\b401\b|unauthorized|invalid[^\s]{0,10}?api[^\s]{0,10}?key/i.test(
      raw,
    );

  if (has1302 || hasStatus429) {
    return {
      status: 429,
      code: "rate_limited",
      message: "AI 服务被挤爆了，排队中，请 30 秒后再试。(上游并发限流)",
    };
  }
  if (has1113) {
    return {
      status: 503,
      code: "quota_exhausted",
      message:
        "免费模型今日额度已用完，请明天再来，或在设置里切到你自己的 OpenAI/Gemini。",
    };
  }
  if (hasAuth) {
    return {
      status: 502,
      code: "upstream_auth",
      message:
        "AI 服务密钥配置异常，站点管理员已收到通知。请稍后重试或切换到自有 API Key。",
    };
  }
  return null;
}

// 提取纯文本内容，过滤掉 MDX 语法
function extractTextFromMDX(content: string): string {
  let text = content
    .replace(/^---[\s\S]*?---/m, "") // 移除头部元数据 (frontmatter)
    .replace(/```[\s\S]*?```/g, "") // 移除代码块
    .replace(/`([^`]+)`/g, "$1"); // 移除内联代码符号，保留内容

  // 递归移除 HTML/MDX 标签，防止嵌套标签清理不干净
  let prevText;
  do {
    prevText = text;
    text = text.replace(/<[^>]+>/g, "");
  } while (text !== prevText);

  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1") // 移除粗体符号，保留文字
    .replace(/\*([^*]+)\*/g, "$1") // 移除斜体符号，保留文字
    .replace(/#{1,6}\s+/g, "") // 移除标题符号 (#)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // 移除链接语法，仅保留链接文本
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1") // 移除图片语法，保留 alt 文本
    .replace(/[#*`()[!\]!]/g, "") // 移除剩余的常用 Markdown 符号
    .replace(/\n{2,}/g, "\n") // 规范化换行，将多余的空行合并
    .trim();
}
