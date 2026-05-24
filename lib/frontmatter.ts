/**
 * buildFrontmatter：为 /docs 知识库生成 YAML frontmatter 字符串。
 *
 * 抽到独立模块的原因：EditorPageClient 和 PromoteToDocsButton 都需要它，
 * 把它留在 EditorPageClient.tsx 会让详情页/卡片 bundle 拖进整个编辑器栈。
 */
export function buildFrontmatter({
  title,
  description,
  tags,
}: {
  title: string;
  description?: string;
  tags?: string[];
}): string {
  const safeTitle = JSON.stringify(title);
  const safeDescription = JSON.stringify(description ?? "");
  const date = new Date().toISOString().slice(0, 10);
  const normalizedTags = (tags ?? [])
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  const lines = [
    "---",
    `title: ${safeTitle}`,
    `description: ${safeDescription}`,
    `date: "${date}"`,
  ];

  if (normalizedTags.length > 0) {
    lines.push(
      "tags:",
      ...normalizedTags.map((tag) => `  - ${JSON.stringify(tag)}`),
    );
  } else {
    lines.push("tags: []");
  }

  lines.push("---");
  return lines.join("\n");
}
