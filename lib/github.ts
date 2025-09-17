// GitHub 相关工具方法：集中维护仓库常量与文档路径生成逻辑
const GITHUB_OWNER = "InvolutionHell";
const GITHUB_REPO = "involutionhell.github.io";
const DEFAULT_BRANCH = "main";
const DOCS_BASE = "app/docs";

const REPO_BASE_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`;

// 拼接路径并清理多余斜杠，避免出现 // 或首尾斜杠
function joinPath(...segments: (string | undefined)[]) {
  return segments
    .filter((segment) => (segment ?? "").trim().length > 0)
    .join("/")
    .replace(/\/+/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

// 将路径逐段 URL 编码，处理中文等特殊字符
function encodeRepoPath(...segments: (string | undefined)[]) {
  const joined = joinPath(...segments);
  if (!joined) return "";
  return joined
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

// 构建文档的 GitHub 编辑链接
export function buildDocsEditUrl(relativeDocPath: string) {
  const encoded = encodeRepoPath(DOCS_BASE, relativeDocPath);
  return `${REPO_BASE_URL}/edit/${DEFAULT_BRANCH}/${encoded}`;
}

// 构建在 GitHub 新建文档的链接，附带 frontmatter 参数
export function buildDocsNewUrl(relativeDir: string, params: URLSearchParams) {
  const encodedDir = encodeRepoPath(DOCS_BASE, relativeDir);
  const query = params.toString();
  const suffix = query ? `?${query}` : "";
  return `${REPO_BASE_URL}/new/${DEFAULT_BRANCH}/${encodedDir}${suffix}`;
}

// 帮助预览完整 docs 路径（未编码）
export function normalizeDocsPath(relative: string) {
  return joinPath(DOCS_BASE, relative);
}

// 暴露常量给其他场景复用
export const githubConstants = {
  owner: GITHUB_OWNER,
  repo: GITHUB_REPO,
  defaultBranch: DEFAULT_BRANCH,
  docsBase: DOCS_BASE,
  repoBaseUrl: REPO_BASE_URL,
};
