import Link from "next/link";
import { source } from "@/lib/source";
import HoverCard from "@/app/components/HoverCard";

export default function DocsIndex() {
  const pages = source
    .getPages()
    .sort((a, b) => (a.data.title ?? "").localeCompare(b.data.title ?? ""));

  return (
    <main style={{ maxWidth: 800, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Docs</h1>
      <ul style={{ display: "grid", gap: 12 }}>
        {pages.map((d) => (
          <li key={d.slugs.join("/")}>
            <HoverCard
              hoverType="scale"
              className="border border-gray-200 rounded-lg p-4 cursor-pointer bg-white dark:bg-gray-800 dark:border-gray-700"
            >
              <Link
                href={`/docs/${d.slugs.join("/")}`}
                className="block w-full h-full"
                style={{
                  fontWeight: 600,
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                {d.data.title}
                {d.data.description && (
                  <p style={{ opacity: 0.8, marginTop: 8 }}>
                    {d.data.description}
                  </p>
                )}
              </Link>
            </HoverCard>
          </li>
        ))}
      </ul>
    </main>
  );
}
