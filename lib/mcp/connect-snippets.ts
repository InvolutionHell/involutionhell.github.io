const DEFAULT_MCP_URL = "https://involutionhell.com/api/mcp";
const CODEX_TOKEN_ENV = "INVOLUTIONHELL_TOKEN";
const PI_TOKEN_ENV = "INVOLUTIONHELL_SATOKEN";

export type McpConnectMode = "search" | "publish";
export type McpConnectLocale = "zh" | "en";

export type McpClientId =
  | "claude-code"
  | "codex"
  | "opencode"
  | "gemini"
  | "cursor"
  | "vscode"
  | "claude-ai"
  | "chatgpt"
  | "pi";

export type McpSnippetMessageKey =
  | "claudeAiSteps"
  | "chatgptSteps"
  | "webSearchOnly"
  | "vscodePrompt"
  | "piNoMcp"
  | "piSkill";

export type McpSnippetBlock =
  | {
      id: string;
      kind: "code";
      title: "cli" | "config" | "environment" | "command";
      detail?: string;
      content: string;
    }
  | {
      id: string;
      kind: "message";
      messageKey: McpSnippetMessageKey;
      tone?: "notice";
      values?: Record<string, string>;
    }
  | {
      id: string;
      kind: "link";
      title: "skill";
      messageKey: "piSkill";
      href: string;
    };

export interface McpSnippetOptions {
  token: string | null;
  mode: McpConnectMode;
  locale?: McpConnectLocale;
  serverUrl?: string;
}

export interface McpClientSnippets {
  id: McpClientId;
  blocks: McpSnippetBlock[];
}

interface McpClientDefinition {
  id: McpClientId;
  build: (options: Required<McpSnippetOptions>) => McpSnippetBlock[];
}

function json(value: unknown): string {
  return JSON.stringify(value);
}

function resolvedToken({ token, locale }: Required<McpSnippetOptions>): string {
  if (token) return token;
  return locale === "zh" ? "<你的satoken>" : "<YOUR_SATOKEN>";
}

function claudeCodeBlocks(
  options: Required<McpSnippetOptions>,
): McpSnippetBlock[] {
  const token = resolvedToken(options);
  const publish = options.mode === "publish";
  const server = {
    type: "http",
    url: options.serverUrl,
    ...(publish ? { headers: { Authorization: `Bearer ${token}` } } : {}),
  };

  return [
    {
      id: "cli",
      kind: "code",
      title: "cli",
      content: `claude mcp add --transport http involutionhell ${options.serverUrl}${
        publish ? ` --header "Authorization: Bearer ${token}"` : ""
      }`,
    },
    {
      id: "config",
      kind: "code",
      title: "config",
      detail: ".mcp.json project root or ~/.claude.json",
      content: json({ mcpServers: { involutionhell: server } }),
    },
  ];
}

function codexBlocks(options: Required<McpSnippetOptions>): McpSnippetBlock[] {
  const publish = options.mode === "publish";
  const token = resolvedToken(options);
  const command = `codex mcp add involutionhell --url ${options.serverUrl}${
    publish ? ` --bearer-token-env-var ${CODEX_TOKEN_ENV}` : ""
  }`;
  const config = [
    "[mcp_servers.involutionhell]",
    `url = "${options.serverUrl}"`,
    ...(publish ? [`bearer_token_env_var = "${CODEX_TOKEN_ENV}"`] : []),
  ].join("\n");

  return [
    {
      id: "cli",
      kind: "code",
      title: "cli",
      content: publish
        ? `export ${CODEX_TOKEN_ENV}=${token}\n${command}`
        : command,
    },
    {
      id: "config",
      kind: "code",
      title: "config",
      detail: "~/.codex/config.toml",
      content: config,
    },
  ];
}

function openCodeBlocks(
  options: Required<McpSnippetOptions>,
): McpSnippetBlock[] {
  const publish = options.mode === "publish";
  const token = resolvedToken(options);
  const server = {
    type: "remote",
    url: options.serverUrl,
    enabled: true,
    ...(publish ? { headers: { Authorization: `Bearer ${token}` } } : {}),
  };

  return [
    {
      id: "config",
      kind: "code",
      title: "config",
      detail: "opencode.json project or ~/.config/opencode/opencode.json",
      content: json({
        $schema: "https://opencode.ai/config.json",
        mcp: { involutionhell: server },
      }),
    },
  ];
}

function geminiBlocks(options: Required<McpSnippetOptions>): McpSnippetBlock[] {
  const publish = options.mode === "publish";
  const token = resolvedToken(options);
  const server = {
    httpUrl: options.serverUrl,
    ...(publish ? { headers: { Authorization: `Bearer ${token}` } } : {}),
  };

  return [
    {
      id: "cli",
      kind: "code",
      title: "cli",
      content: `gemini mcp add --transport http involutionhell ${options.serverUrl}${
        publish ? ` --header "Authorization: Bearer ${token}"` : ""
      }`,
    },
    {
      id: "config",
      kind: "code",
      title: "config",
      detail: "~/.gemini/settings.json",
      content: json({ mcpServers: { involutionhell: server } }),
    },
  ];
}

function cursorBlocks(options: Required<McpSnippetOptions>): McpSnippetBlock[] {
  const publish = options.mode === "publish";
  const token = resolvedToken(options);
  const blocks: McpSnippetBlock[] = [];

  if (publish) {
    blocks.push({
      id: "environment",
      kind: "code",
      title: "environment",
      content: `export ${CODEX_TOKEN_ENV}=${token}`,
    });
  }

  blocks.push({
    id: "config",
    kind: "code",
    title: "config",
    detail: "~/.cursor/mcp.json or .cursor/mcp.json",
    content: json({
      mcpServers: {
        involutionhell: {
          url: options.serverUrl,
          ...(publish
            ? {
                headers: {
                  Authorization: `Bearer \${env:${CODEX_TOKEN_ENV}}`,
                },
              }
            : {}),
        },
      },
    }),
  });

  return blocks;
}

function vscodeBlocks(options: Required<McpSnippetOptions>): McpSnippetBlock[] {
  const publish = options.mode === "publish";
  const server = {
    type: "http",
    url: options.serverUrl,
    ...(publish
      ? { headers: { Authorization: "Bearer ${input:ih-token}" } }
      : {}),
  };

  return [
    {
      id: "config",
      kind: "code",
      title: "config",
      detail: ".vscode/mcp.json",
      content: json({
        ...(publish
          ? {
              inputs: [
                {
                  type: "promptString",
                  id: "ih-token",
                  description: "InvolutionHell token",
                  password: true,
                },
              ],
            }
          : {}),
        servers: { involutionhell: server },
      }),
    },
    ...(publish
      ? ([
          {
            id: "prompt-note",
            kind: "message",
            messageKey: "vscodePrompt",
          },
        ] satisfies McpSnippetBlock[])
      : []),
  ];
}

function webBlocks(
  client: "claude-ai" | "chatgpt",
  options: Required<McpSnippetOptions>,
): McpSnippetBlock[] {
  return [
    {
      id: "steps",
      kind: "message",
      messageKey: client === "claude-ai" ? "claudeAiSteps" : "chatgptSteps",
      values: { url: options.serverUrl },
    },
    {
      id: "search-only",
      kind: "message",
      messageKey: "webSearchOnly",
      tone: "notice",
    },
  ];
}

function piBlocks(options: Required<McpSnippetOptions>): McpSnippetBlock[] {
  const token = resolvedToken(options);
  const command =
    'npx --yes github:InvolutionHell/involutionhell-agent-tools search "..."';

  return [
    {
      id: "no-mcp",
      kind: "message",
      messageKey: "piNoMcp",
      tone: "notice",
    },
    {
      id: "command",
      kind: "code",
      title: "command",
      content:
        options.mode === "publish"
          ? `export ${PI_TOKEN_ENV}=${token}\n${command}`
          : command,
    },
    {
      id: "skill",
      kind: "link",
      title: "skill",
      messageKey: "piSkill",
      href: "https://github.com/InvolutionHell/involutionhell-agent-tools",
    },
  ];
}

export const MCP_CLIENT_REGISTRY: readonly McpClientDefinition[] = [
  { id: "claude-code", build: claudeCodeBlocks },
  { id: "codex", build: codexBlocks },
  { id: "opencode", build: openCodeBlocks },
  { id: "gemini", build: geminiBlocks },
  { id: "cursor", build: cursorBlocks },
  { id: "vscode", build: vscodeBlocks },
  { id: "claude-ai", build: (options) => webBlocks("claude-ai", options) },
  { id: "chatgpt", build: (options) => webBlocks("chatgpt", options) },
  { id: "pi", build: piBlocks },
];

function normalizeOptions(
  options: McpSnippetOptions,
): Required<McpSnippetOptions> {
  return {
    ...options,
    locale: options.locale ?? "en",
    serverUrl: options.serverUrl ?? DEFAULT_MCP_URL,
  };
}

export function buildMcpClientSnippets(
  clientId: McpClientId,
  options: McpSnippetOptions,
): McpSnippetBlock[] {
  const client = MCP_CLIENT_REGISTRY.find(({ id }) => id === clientId);
  if (!client) return [];
  return client.build(normalizeOptions(options));
}

export function buildMcpConnectSnippets(
  options: McpSnippetOptions,
): McpClientSnippets[] {
  const normalized = normalizeOptions(options);
  return MCP_CLIENT_REGISTRY.map(({ id, build }) => ({
    id,
    blocks: build(normalized),
  }));
}
