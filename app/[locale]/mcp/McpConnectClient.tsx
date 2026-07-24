"use client";

import Link from "next/link";
import { Check, Copy, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getStoredToken } from "@/lib/use-auth";
import {
  buildMcpClientSnippets,
  MCP_CLIENT_REGISTRY,
  type McpClientId,
  type McpConnectLocale,
  type McpConnectMode,
} from "@/lib/mcp/connect-snippets";

interface McpConnectClientProps {
  locale: McpConnectLocale;
}

export function McpConnectClient({ locale }: McpConnectClientProps) {
  const t = useTranslations("mcpConnect");
  const [mode, setMode] = useState<McpConnectMode>("publish");
  const [clientId, setClientId] = useState<McpClientId>("claude-code");
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string>();
  const [copyStatus, setCopyStatus] = useState<{
    id: string;
    state: "copied" | "failed";
  } | null>(null);

  useEffect(() => {
    const storedToken = getStoredToken();
    const currentServerUrl = new URL("/api/mcp", window.location.origin).href;
    Promise.resolve().then(() => {
      setToken(storedToken);
      setServerUrl(currentServerUrl);
    });
  }, []);

  const blocks = buildMcpClientSnippets(clientId, {
    token,
    mode,
    locale,
    serverUrl,
  });

  async function copy(value: string, id: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus({ id, state: "copied" });
    } catch {
      setCopyStatus({ id, state: "failed" });
    }
  }

  function copyLabel(id: string) {
    if (copyStatus?.id !== id) return t("copy.copy");
    return t(`copy.${copyStatus.state}`);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 lg:px-8">
      <header className="mb-10 border-t-4 border-[var(--foreground)] pt-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500">
          {t("eyebrow")}
        </p>
        <h1 className="mt-2 font-serif text-4xl font-black uppercase tracking-tight text-[var(--foreground)] md:text-6xl">
          {t("title")}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400 md:text-base">
          {t("intro")}
        </p>
        <p className="mt-3 max-w-3xl font-mono text-xs leading-relaxed text-neutral-500">
          {t("privacy")}
        </p>
      </header>

      <section className="mb-8 border border-[var(--foreground)] p-4 md:p-6">
        <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-widest">
          {t("mode.label")}
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(["search", "publish"] as const).map((candidate) => (
            <button
              key={candidate}
              type="button"
              aria-pressed={mode === candidate}
              onClick={() => setMode(candidate)}
              className={`border px-4 py-3 text-left font-sans text-sm font-bold transition-colors ${
                mode === candidate
                  ? "border-[#CC0000] bg-[#CC0000] text-white"
                  : "border-[var(--foreground)] hover:text-[#CC0000]"
              }`}
            >
              {t(`mode.${candidate}`)}
            </button>
          ))}
        </div>
      </section>

      {token ? (
        <section className="mb-8 flex flex-col gap-3 border border-emerald-700 bg-emerald-50 p-4 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-100 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-sans text-sm font-bold">
              {t("auth.tokenReady")}
            </div>
            <div className="mt-1 font-mono text-xs opacity-70">
              ••••••••{token.slice(-6)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => copy(token, "satoken")}
            className="inline-flex items-center justify-center gap-2 border border-current px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider hover:bg-emerald-900 hover:text-white"
          >
            {copyStatus?.id === "satoken" && copyStatus.state === "copied" ? (
              <Check className="size-4" aria-hidden="true" />
            ) : (
              <Copy className="size-4" aria-hidden="true" />
            )}
            {copyStatus?.id === "satoken"
              ? t(`copy.${copyStatus.state}`)
              : t("auth.copyToken")}
          </button>
        </section>
      ) : (
        <section className="mb-8 border border-amber-700 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
          {t("auth.loginHint")}{" "}
          <Link
            href="/login"
            className="font-bold underline underline-offset-4"
          >
            {t("auth.loginLink")}
          </Link>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <section aria-label={t("clients.label")}>
          <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-widest">
            {t("clients.label")}
          </h2>
          <div
            role="tablist"
            aria-orientation="vertical"
            className="grid grid-cols-2 border-l border-t border-[var(--foreground)] sm:grid-cols-3 lg:grid-cols-1"
          >
            {MCP_CLIENT_REGISTRY.map((client) => (
              <button
                key={client.id}
                id={`mcp-client-${client.id}`}
                type="button"
                role="tab"
                aria-selected={clientId === client.id}
                aria-controls="mcp-client-panel"
                onClick={() => setClientId(client.id)}
                className={`border-b border-r border-[var(--foreground)] px-3 py-3 text-left font-sans text-xs font-bold transition-colors ${
                  clientId === client.id
                    ? "bg-[var(--foreground)] text-[var(--background)]"
                    : "hover:text-[#CC0000]"
                }`}
              >
                {t(`clients.${client.id}`)}
              </button>
            ))}
          </div>
        </section>

        <section
          id="mcp-client-panel"
          role="tabpanel"
          aria-labelledby={`mcp-client-${clientId}`}
          className="min-w-0"
        >
          <div className="mb-4 border-b-2 border-[var(--foreground)] pb-3">
            <h2 className="font-serif text-2xl font-black">
              {t(`clients.${clientId}`)}
            </h2>
          </div>

          <div className="space-y-5">
            {blocks.map((block) => {
              if (block.kind === "code") {
                const copyId = `${clientId}-${mode}-${block.id}`;
                return (
                  <article key={block.id}>
                    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-mono text-xs font-bold uppercase tracking-widest">
                        {t(`blocks.${block.title}`)}
                      </h3>
                      {block.detail ? (
                        <span className="break-all font-mono text-[11px] text-neutral-500">
                          {block.detail}
                        </span>
                      ) : null}
                    </div>
                    <div className="relative border border-[var(--foreground)] bg-neutral-950 text-neutral-100">
                      <pre className="overflow-x-auto whitespace-pre-wrap break-words p-4 pr-28 font-mono text-xs leading-6">
                        <code>{block.content}</code>
                      </pre>
                      <button
                        type="button"
                        onClick={() => copy(block.content, copyId)}
                        className="absolute right-2 top-2 inline-flex items-center gap-1.5 border border-neutral-600 bg-neutral-950 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider hover:border-white"
                        aria-label={`${copyLabel(copyId)}: ${t(
                          `blocks.${block.title}`,
                        )}`}
                      >
                        {copyStatus?.id === copyId &&
                        copyStatus.state === "copied" ? (
                          <Check className="size-3.5" aria-hidden="true" />
                        ) : (
                          <Copy className="size-3.5" aria-hidden="true" />
                        )}
                        {copyLabel(copyId)}
                      </button>
                    </div>
                  </article>
                );
              }

              if (block.kind === "link") {
                return (
                  <article key={block.id}>
                    <h3 className="mb-2 font-mono text-xs font-bold uppercase tracking-widest">
                      {t(`blocks.${block.title}`)}
                    </h3>
                    <a
                      href={block.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 border border-[var(--foreground)] p-4 text-sm font-bold hover:text-[#CC0000]"
                    >
                      <span>{t(`messages.${block.messageKey}`)}</span>
                      <ExternalLink
                        className="size-4 shrink-0"
                        aria-hidden="true"
                      />
                    </a>
                  </article>
                );
              }

              return (
                <p
                  key={block.id}
                  className={`border p-4 text-sm leading-relaxed ${
                    block.tone === "notice"
                      ? "border-amber-700 bg-amber-50 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"
                      : "border-[var(--foreground)]"
                  }`}
                >
                  {t(`messages.${block.messageKey}`, block.values)}
                </p>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
