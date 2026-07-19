import { describe, expect, it } from "vitest";
import {
  buildMcpClientSnippets,
  buildMcpConnectSnippets,
  type McpClientId,
  type McpSnippetOptions,
} from "@/lib/mcp/connect-snippets";

function codeBlock(
  clientId: McpClientId,
  options: McpSnippetOptions,
  id: string,
) {
  const block = buildMcpClientSnippets(clientId, options).find(
    (candidate) => candidate.id === id,
  );
  if (!block || block.kind !== "code") {
    throw new Error(`Missing code block ${clientId}/${id}`);
  }
  return block;
}

describe("MCP connect snippet builders", () => {
  it("injects a logged-in token into Claude Code publish snippets", () => {
    const options = { token: "token-abc-123", mode: "publish" } as const;
    const cli = codeBlock("claude-code", options, "cli").content;
    const config = codeBlock("claude-code", options, "config").content;

    expect(cli).toBe(
      'claude mcp add --transport http involutionhell https://involutionhell.com/api/mcp --header "Authorization: Bearer token-abc-123"',
    );
    expect(config).toContain('"Authorization":"Bearer token-abc-123"');
  });

  it("uses the locale-specific placeholder when no token is available", () => {
    const zh = codeBlock(
      "claude-code",
      { token: null, mode: "publish", locale: "zh" },
      "cli",
    ).content;
    const en = codeBlock(
      "claude-code",
      { token: null, mode: "publish", locale: "en" },
      "cli",
    ).content;

    expect(zh).toContain("<你的satoken>");
    expect(en).toContain("<YOUR_SATOKEN>");
  });

  it("removes Authorization and token setup from every anonymous client", () => {
    const rendered = JSON.stringify(
      buildMcpConnectSnippets({
        token: "must-not-appear",
        mode: "search",
        locale: "en",
      }),
    );

    expect(rendered).not.toContain("Authorization");
    expect(rendered).not.toContain("must-not-appear");
    expect(rendered).not.toContain("INVOLUTIONHELL_TOKEN");
    expect(rendered).not.toContain("INVOLUTIONHELL_SATOKEN");
  });

  it("uses httpUrl rather than url in Gemini settings", () => {
    const block = codeBlock(
      "gemini",
      { token: "gemini-token", mode: "publish" },
      "config",
    );
    const config = JSON.parse(block.content);
    const server = config.mcpServers.involutionhell;

    expect(server.httpUrl).toBe("https://involutionhell.com/api/mcp");
    expect(server).not.toHaveProperty("url");
    expect(server.headers.Authorization).toBe("Bearer gemini-token");
  });

  it("uses VS Code inputs and a top-level servers key", () => {
    const block = codeBlock(
      "vscode",
      { token: "not-embedded", mode: "publish" },
      "config",
    );
    const config = JSON.parse(block.content);

    expect(block.detail).toBe(".vscode/mcp.json");
    expect(config).toHaveProperty("servers.involutionhell");
    expect(config).not.toHaveProperty("mcpServers");
    expect(config.inputs[0]).toMatchObject({
      type: "promptString",
      id: "ih-token",
      password: true,
    });
    expect(config.servers.involutionhell.headers.Authorization).toBe(
      "Bearer ${input:ih-token}",
    );
    expect(block.content).not.toContain("not-embedded");
  });

  it("stores the Codex bearer env-var name instead of its value", () => {
    const options = { token: "codex-secret", mode: "publish" } as const;
    const cli = codeBlock("codex", options, "cli").content;
    const config = codeBlock("codex", options, "config").content;

    expect(cli).toContain("export INVOLUTIONHELL_TOKEN=codex-secret");
    expect(cli).toContain("--bearer-token-env-var INVOLUTIONHELL_TOKEN");
    expect(config).toContain('bearer_token_env_var = "INVOLUTIONHELL_TOKEN"');
    expect(config).not.toContain("codex-secret");
  });

  it("uses an env reference in Cursor config and keeps the value in a companion line", () => {
    const options = { token: "cursor-secret", mode: "publish" } as const;
    const environment = codeBlock("cursor", options, "environment").content;
    const config = codeBlock("cursor", options, "config").content;

    expect(environment).toBe("export INVOLUTIONHELL_TOKEN=cursor-secret");
    expect(config).toContain("Bearer ${env:INVOLUTIONHELL_TOKEN}");
    expect(config).not.toContain("cursor-secret");
  });

  it("keeps web clients search-only and gives Pi its companion CLI token env", () => {
    const options = { token: "web-secret", mode: "publish" } as const;
    const claudeAi = buildMcpClientSnippets("claude-ai", options);
    const chatgpt = buildMcpClientSnippets("chatgpt", options);
    const pi = codeBlock("pi", options, "command").content;

    expect(claudeAi.every((block) => block.kind !== "code")).toBe(true);
    expect(chatgpt.every((block) => block.kind !== "code")).toBe(true);
    expect(JSON.stringify([claudeAi, chatgpt])).not.toContain("web-secret");
    expect(pi).toContain("export INVOLUTIONHELL_SATOKEN=web-secret");
    expect(pi).toContain(
      'npx --yes github:InvolutionHell/involutionhell-agent-tools search "..."',
    );
  });
});
