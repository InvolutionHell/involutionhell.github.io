import { allDocs } from 'contentlayer/generated'
import { notFound } from 'next/navigation'
import { useMDXComponent } from 'next-contentlayer/hooks'

export function generateStaticParams() {
  return allDocs.map((d) => ({ slug: d.slug }))
}

export default function DocPage({ params }: { params: { slug: string } }) {
  const doc = allDocs.find((d) => d.slug === params.slug)
  if (!doc) return notFound()

  const MDX = useMDXComponent(doc.body.code)

  return (
    <article style={{ maxWidth: 820, margin: '40px auto', padding: 16 }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>{doc.title}</h1>
      <MDX />
    </article>
  )
}
