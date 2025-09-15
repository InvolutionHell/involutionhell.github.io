"use client";
import * as React from "react";

// Debug helpers (removed in production)

type ZoteroItem = {
  key: string;
  data?: {
    itemType?: string;
    title?: string;
    url?: string;
    date?: string;
    creators?: { lastName?: string; firstName?: string; name?: string }[];
    abstractNote?: string;
    publicationTitle?: string;
  };
  links?: { alternate?: { href?: string } };
};

export function ZoteroFeed({
  groupId = 6053219,
  limit = 8,
}: {
  groupId?: number;
  limit?: number;
}) {
  const [items, setItems] = React.useState<ZoteroItem[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();
    // Fetch only top-level items; exclude children implicitly. We will filter
    // attachments/notes on the client for extra safety.
    const url = `https://api.zotero.org/groups/${groupId}/items/top?format=json&limit=${limit}&sort=date&direction=desc`;
    fetch(url, { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        const data: ZoteroItem[] = await r.json();
        // No debug exposure in production
        setItems(data);
      })
      .catch((e: unknown) => {
        if ((e as { name?: string }).name !== "AbortError") {
          setError((e as Error).message || String(e));
        }
      });
    return () => controller.abort();
  }, [groupId, limit]);

  const openUrl = `https://www.zotero.org/groups/${groupId}/library`;

  return (
    <section className="mt-16 mb-10" aria-labelledby="zotero-heading">
      <div className="border border-border bg-background/20 backdrop-blur-sm rounded-lg p-6">
        <div className="mb-3 flex items-baseline justify-between">
          <h3
            id="zotero-heading"
            className="text-xs font-semibold tracking-wide uppercase text-muted-foreground"
          >
            我们在读什么:
          </h3>
          <a
            href={openUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-sky-600 dark:text-sky-400 hover:underline"
          >
            在 Zotero 中打开 →
          </a>
        </div>

        {error && (
          <div className="border border-border p-4 text-sm text-red-600 dark:text-red-400">
            加载失败：{error}
          </div>
        )}

        {!items && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: limit }).map((_, i) => (
              <div
                key={i}
                className="h-20 border border-border bg-transparent animate-pulse"
              />
            ))}
          </div>
        )}

        {items && (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items
              // Guard against attachments/notes even if server-side filter changes
              .filter(
                (it) =>
                  it.data?.itemType !== "attachment" &&
                  it.data?.itemType !== "note",
              )
              .filter((it) => it.data?.title && it.data.title.trim() !== "")
              .map((it) => {
                const d = it.data ?? {};
                const title = d.title!;
                const link = d.url || it.links?.alternate?.href || openUrl;
                const authors = (d.creators || [])
                  .map(
                    (c) =>
                      c.name ||
                      [c.lastName, c.firstName].filter(Boolean).join(", "),
                  )
                  .filter(Boolean)
                  .join("; ");
                const venue = d.publicationTitle;
                const date = d.date;

                return (
                  <li
                    key={it.key}
                    className="border border-border px-3 py-2 bg-transparent hover:bg-accent/10 transition"
                  >
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-foreground hover:underline text-sm leading-tight block"
                    >
                      {title}
                    </a>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {authors && <span>{authors}</span>}
                      {authors && (venue || date) && <span> · </span>}
                      {venue && <span>{venue}</span>}
                      {venue && date && <span> · </span>}
                      {date && <span>{date}</span>}
                    </div>
                  </li>
                );
              })}
          </ul>
        )}
      </div>
    </section>
  );
}

export default ZoteroFeed;
