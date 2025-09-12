import Link from 'next/link'
import { allDocs } from 'contentlayer/generated'

export default function DocsIndex() {
  const docs = [...allDocs].sort((a, b) =>
    (b.date ?? '').localeCompare(a.date ?? '')
  )

  return (
    <main className="main-container">
      <h1 className="page-title">Docs</h1>
      <ul className="doc-list">
        {docs.map((d) => (
          <li key={d._id} className="doc-card">
            <Link href={`/docs/${d.slug}`} className="doc-link">
              {d.title}
            </Link>
            {d.description && <p style={{ opacity: 0.8 }}>{d.description}</p>}
          </li>
        ))}
      </ul>
    </main>
  )
}