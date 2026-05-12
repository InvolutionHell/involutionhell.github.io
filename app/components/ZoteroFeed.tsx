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
    const url = `https://api.zotero.org/groups/${groupId}/items/top?format=json&limit=${limit}&sort=dateAdded&direction=desc`;
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
      <div className="border border-[var(--foreground)] bg-[var(--background)] p-8 newsprint-texture transition-colors duration-300">
        <div className="mb-6 flex items-baseline justify-between border-b border-[var(--foreground)] pb-4 transition-colors duration-300">
          <h2
            id="zotero-heading"
            className="font-mono text-xs font-bold tracking-widest uppercase text-[var(--foreground)]"
          >
            Reading List / 我们在读什么
          </h2>
          <a
            href={openUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-[10px] uppercase tracking-widest font-bold text-[#CC0000] hover:underline underline-offset-4"
          >
            Full Library →
          </a>
        </div>

        {error && (
          <div className="border border-[#CC0000] p-4 font-mono text-xs text-[#CC0000]">
            ERROR LOAD_FAILED: {error}
          </div>
        )}

        {!items && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t border-l border-[var(--foreground)] transition-colors duration-300">
            {Array.from({ length: limit }).map((_, i) => (
              <div
                key={i}
                className="h-24 border-r border-b border-[var(--foreground)] bg-neutral-100 dark:bg-neutral-900 animate-pulse transition-colors duration-300"
              />
            ))}
          </div>
        )}

        {items && (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t border-l border-[var(--foreground)] transition-colors duration-300">
            {items
              .filter(
                (it) =>
                  it.data?.itemType !== "attachment" &&
                  it.data?.itemType !== "note",
              )
              .filter((it) => it.data?.title && it.data.title.trim() !== "")
              .map((it, idx) => {
                const d = it.data ?? {};
                const title = d.title!;
                const link = d.url || it.links?.alternate?.href || openUrl;
                const creators = d.creators || [];
                const authors = creators
                  .map(
                    (c) =>
                      c.name ||
                      [c.lastName, c.firstName].filter(Boolean).join(", "),
                  )
                  .filter(Boolean)
                  .join("; ");
                const venue = d.publicationTitle;
                const date = d.date;
                const key = it.key;

                return (
                  <li
                    key={key}
                    className="border-r border-b border-[var(--foreground)] p-6 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition group"
                  >
                    <div className="font-mono text-[10px] text-neutral-400 mb-2">
                      REF. {idx + 1}
                    </div>
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-serif font-bold text-lg leading-tight block mb-3 text-[var(--foreground)] group-hover:text-[#CC0000] transition-colors"
                    >
                      {title}
                    </a>
                    <div className="text-[11px] font-body text-neutral-600 dark:text-neutral-400 leading-relaxed text-justify">
                      {authors && <span>{authors}</span>}
                      <div className="mt-2 font-mono text-[9px] uppercase tracking-wider text-neutral-500 flex gap-2">
                        {venue && (
                          <span className="truncate max-w-[150px]">
                            {venue}
                          </span>
                        )}
                        {date && <span>[{date}]</span>}
                      </div>
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
