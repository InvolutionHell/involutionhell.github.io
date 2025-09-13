import Link from "next/link";
import { allDocs } from "contentlayer/generated";

export default function DocsIndex() {
  const docs = [...allDocs].sort((a, b) =>
    (b.date ?? "").localeCompare(a.date ?? "")
  );

  return (
    <main style={{ maxWidth: 800, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Docs</h1>
      <ul style={{ display: "grid", gap: 12 }}>
        {docs.map((d) => (
          <li
            key={d._id}
            className="hover-darken-bg"
            style={{
              border: "1px solid #eee",
              borderRadius: 8,
              padding: 16,
              cursor: "pointer",
            }}
          >
            <Link
              href={`/docs/${d.slug}`}
              className="hover-link block w-full h-full"
              style={{
                fontWeight: 600,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              {d.title}
              {d.description && (
                <p style={{ opacity: 0.8, marginTop: 8 }}>{d.description}</p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
