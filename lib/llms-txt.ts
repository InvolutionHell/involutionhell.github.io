// lib/llms-txt.ts

/**
 * @file lib/llms-txt.ts
 * @description
 * `/llms.txt` 正文生成器（llmstxt.org 约定）。只出索引不出全文 —— 三百多篇
 * 正文拼进去是几 MB，会挤爆它本来要省的上下文。
 *
 * 不 import `@/lib/source`：那条链会拖进 fumadocs-mdx 管线，vitest 起不来。
 * 枚举文档在 `app/llms.txt/route.ts`，这里保持纯函数。
 */

export interface LlmsTxtEntry {
  /** 站内绝对路径，如 `/zh/docs/career/xxx`，不含域名 */
  pathname: string;
  title: string;
  /** frontmatter description，可能缺失或为空 */
  description?: string;
  /** 分组小标题，同一个值的条目会归到一起，按首次出现顺序排列 */
  section: string;
}

/**
 * 单条描述的长度上限。个别 frontmatter 描述写得极长（有的贡献者把整段
 * 摘要塞进去），不截断的话少数几篇就能把索引撑肥一倍，挤掉别的条目
 * 被读到的机会。300 够表达一篇文档讲什么了。
 */
const MAX_DESCRIPTION = 300;

const HEADER = `# Involution Hell（内卷地狱）

> 面向留学生与求职者的开源社区知识库：算法题解、系统设计、面试经验与求职指南。内容由社区贡献者共同维护。

本文件是全站文档索引，供 AI 引擎检索与引用。中文文档在 \`/zh/docs/\`，英文在 \`/en/docs/\`；
某篇没有英文版时，\`/en/\` 路径会回退渲染中文原文。

内容采用 CC BY-NC-SA 4.0 许可：可以引用和转述，请保留出处链接并注明来源；禁止商业化再分发。
`;

/** 折叠空白 + 去掉会破坏 markdown 链接的方括号。 */
function clean(text: string): string {
  return text.replace(/\s+/g, " ").replace(/[[\]]/g, "").trim();
}

/**
 * 把文档条目渲染成 llms.txt 正文。
 *
 * @param entries 全部文档条目，分组顺序由 `section` 首次出现的顺序决定
 * @param siteUrl 站点根 URL（不带尾斜杠），拼成绝对链接 —— 相对链接对
 *                抓取方没用，它们不一定知道自己是从哪个域名拿到这个文件的
 */
export function buildLlmsTxt(entries: LlmsTxtEntry[], siteUrl: string): string {
  const groups = new Map<string, LlmsTxtEntry[]>();
  for (const entry of entries) {
    const bucket = groups.get(entry.section);
    if (bucket) {
      bucket.push(entry);
    } else {
      groups.set(entry.section, [entry]);
    }
  }

  const lines: string[] = [HEADER];
  for (const [section, items] of groups) {
    lines.push(`## ${section}`, "");
    for (const item of items) {
      const title = clean(item.title) || item.pathname;
      const raw = item.description ? clean(item.description) : "";
      const description =
        raw.length > MAX_DESCRIPTION
          ? `${raw.slice(0, MAX_DESCRIPTION).trimEnd()}…`
          : raw;
      const link = `- [${title}](${siteUrl}${item.pathname})`;
      lines.push(description ? `${link}: ${description}` : link);
    }
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}
