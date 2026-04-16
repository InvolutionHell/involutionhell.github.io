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

  const glm = createOpenAICompatible({
    name: "zhipu",
    baseURL: "https://open.bigmodel.cn/api/paas/v4/",
    apiKey: process.env.ZHIPU_API_KEY,
  });

  return glm("glm-4.6v-flash");
}
