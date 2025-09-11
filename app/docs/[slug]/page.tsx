import { allDocs } from 'contentlayer/generated'
import { notFound } from 'next/navigation'
import MDXContent from '@/app/components/MDXContent'

export function generateStaticParams() {
  return allDocs.map((d) => ({ slug: d.slug }))
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const doc = allDocs.find((d) => d.slug === slug)
  if (!doc) return notFound()

  return (
    <article style={{ maxWidth: 820, margin: '40px auto', padding: 16 }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>{doc.title}</h1>
      <MDXContent code={doc.body.code} />
    </article>
  )
}
