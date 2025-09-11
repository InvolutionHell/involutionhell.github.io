import Link from 'next/link'
import { allDocs } from 'contentlayer/generated'

export default function DocsIndex() {
  const docs = [...allDocs].sort((a, b) =>
    (b.date ?? '').localeCompare(a.date ?? '')
  )

  return (
    <main style={{ maxWidth: 800, margin: '40px auto', padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Docs</h1>
      <ul style={{ display: 'grid', gap: 12 }}>
        {docs.map((d) => (
          <li key={d._id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
            <Link href={`/docs/${d.slug}`} style={{ fontWeight: 600 }}>
              {d.title}
            </Link>
            {d.description && <p style={{ opacity: 0.8 }}>{d.description}</p>}
          </li>
        ))}
      </ul>
    </main>
  )
}
