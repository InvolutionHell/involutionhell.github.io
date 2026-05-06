/**
 * @description 转义尖括号脚本
 * @author Siz Long
 * @date 2025-09-27
 */
import { promises as fs } from "node:fs";
import fg from "fast-glob";

/**
 * 极简策略：
 * 1) 跳过 fenced code / inline code（保留原样）
 * 2) 仅在普通文本行内转义形如 <数字开头...> 或 <单词里含逗号/空格/数学符号...> 的片段
 * 3) 不动像 <Component> / <div> 这类“正常标签/组件名”的片段
 */
const files = await fg(["content/docs/**/*.md"], { dot: false });

for (const file of files) {
  let src = await fs.readFile(file, "utf8");

  // 粗粒度：把代码块剥离（防止误替换），留下占位符
  const blocks = [];
  src = src.replace(/```[\s\S]*?```/g, (m) => {
    blocks.push(m);
    return `__CODE_BLOCK_${blocks.length - 1}__`;
  });

  // 行内代码也剥离
  src = src.replace(/`[^`]*`/g, (m) => {
    blocks.push(m);
    return `__CODE_BLOCK_${blocks.length - 1}__`;
  });

  // 在普通文本里做“可疑尖括号”的转义：
  //  - <\d...>  如 <8>、<1,2,3>
  //  - <[^\s/>][^>]*[,;+\-*/= ]+[^>]*>  含明显非标签符号的
  src = src
    .replace(/<\d[^>]*>/g, (m) =>
      m.replaceAll("<", "&lt;").replaceAll(">", "&gt;"),
    )
    .replace(/<(?![A-Za-z/][A-Za-z0-9:_-]*\s*\/?>)[^>]*>/g, (m) =>
      m.replaceAll("<", "&lt;").replaceAll(">", "&gt;"),
    );

  // 还原占位的代码块/行内代码
  src = src.replace(/__CODE_BLOCK_(\d+)__/g, (_, i) => blocks[Number(i)]);

  await fs.writeFile(file, src, "utf8");
  console.log(`Escaped angles in ${file}`);
}
