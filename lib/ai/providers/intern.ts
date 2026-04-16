import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * 免费聊天模型：智谱 GLM-4.6V-Flash
 *
 * 历史原因：此前默认走上海 AI Lab 的书生 Intern-S1，现因 key 过期改接智谱
 * GLM-4.6V-Flash（同样免费、128K 上下文、支持多模态）。为避免破坏用户
 * localStorage 里已有的 provider="intern" 设置，函数/Provider 名保留 `intern`
 * 作为语义上的"免费兜底模型"标识。
 *
 * 开发环境仍可通过 DEEPSEEK_API_KEY 快速切换到 Deepseek 接口做调试。
 * 生产环境需要在服务端配置 ZHIPU_API_KEY（智谱 AI 开放平台）。
 */
export function createInternModel() {
  const isDev = process.env.NODE_ENV === "development";

  if (isDev && process.env.DEEPSEEK_API_KEY) {
    const deepseek = createOpenAICompatible({
      name: "deepseek",
      baseURL: "https://api.deepseek.com",
      apiKey: process.env.DEEPSEEK_API_KEY,
    });
    return deepseek("deepseek-chat");
  }

  // 显式校验 ZHIPU_API_KEY：若漏配，下游 401 又会在 UI 上变成 "unauthorized"
  // 透传 —— 正好绕回 issue #285 原本要修的症状。在这里早抛出带指引的错误，
  // 运维看日志一眼知道补哪个 env var，避免二次塌房（Copilot CR #2）。
  const zhipuApiKey = process.env.ZHIPU_API_KEY;
  if (!zhipuApiKey || zhipuApiKey.trim() === "") {
    throw new Error(
      "Missing required environment variable ZHIPU_API_KEY. " +
        "配置位置：Vercel Project Settings → Environment Variables。" +
        "免费 key 从 https://open.bigmodel.cn/ 获取。",
    );
  }

  const glm = createOpenAICompatible({
    name: "zhipu",
    baseURL: "https://open.bigmodel.cn/api/paas/v4/",
    apiKey: zhipuApiKey,
  });

  return glm("glm-4.6v-flash");
}
