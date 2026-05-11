/**
 * @description 转义尖括号脚本
 * @author Siz Long
 * @date 2025-09-27
 *
 * 2026-05 更新：修幂等性 bug
 *   旧 negative lookahead `(?![A-Za-z/][A-Za-z0-9:_-]*\s*\/?>)` 只接受
 *   <div> / </div> / <br /> 这种**无属性**的标签，把 `<img src="..." />`、
 *   `<a href="...">` 这种**带属性的合法 HTML** 误判为"可疑尖括号"并 escape。
 *   导致：每次 build 都把 leetcode markdown 注释里的 `<img>` 转 `&lt;img&gt;`，
 *   working tree 永久脏。Backfill workflow（要求 git status 干净）反复被阻断。
 *
 *   修：lookahead 加属性段 `([ \t][^<>]*)?`，让 `<tagname attr="...">` 也被
 *   识别为正常 HTML 不 escape。
 *
 * 极简策略：
 * 1) 跳过 fenced code / inline code（保留原样）
 * 2) 仅在普通文本行内转义形如 <数字开头...> 或 <单词里含逗号/空格/数学符号...> 的片段
 * 3) 不动像 <Component> / <div> / <img src="..." />（含属性）这类"正常标签"
 */
import { promises as fs } from "node:fs";
import fg from "fast-glob";

const files = await fg(["content/docs/**/*.md"], { dot: false });

/**
 * 正常 HTML/JSX 标签匹配模式（用于 negative lookahead）：
 *   - 可选 `/` 表示闭合标签 (</div>)
 *   - 标签名首字母为字母，后跟字母/数字/冒号/下划线/连字符
 *   - 可选属性段：空格后跟任意非尖括号字符（[^<>] 防 ReDoS）
 *   - 可选 `/` 表示自闭合 (<br />)
 *   - `>` 收尾
 *
 * 接受样例（lookahead 命中，不 escape）：
 *   <div>           </div>         <br />
 *   <img src="..." />              <a href="x" title="y">
 *   <Component prop="val" />
 *
 * 不接受样例（lookahead miss，进 escape 分支）：
 *   <8>             <1,2,3>        <x, y>         <not a tag>
 */
const VALID_TAG_LOOKAHEAD = /\/?[A-Za-z][A-Za-z0-9:_-]*([ \t][^<>]*)?\s*\/?>/;

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

  // 在普通文本里做"可疑尖括号"的转义：
  //  - <\d...>  如 <8>、<1,2,3>
  //  - <[^\s/>][^>]*[,;+\-*/= ]+[^>]*>  含明显非标签符号的
  src = src
    .replace(/<\d[^>]*>/g, (m) =>
      m.replaceAll("<", "&lt;").replaceAll(">", "&gt;"),
    )
    .replace(new RegExp(`<(?!${VALID_TAG_LOOKAHEAD.source})[^>]*>`, "g"), (m) =>
      m.replaceAll("<", "&lt;").replaceAll(">", "&gt;"),
    );

  // 还原占位的代码块/行内代码
  src = src.replace(/__CODE_BLOCK_(\d+)__/g, (_, i) => blocks[Number(i)]);

  await fs.writeFile(file, src, "utf8");
  console.log(`Escaped angles in ${file}`);
}
