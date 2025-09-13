import { allDocs } from "contentlayer/generated";
import { notFound } from "next/navigation";
import MDXContent from "@/app/components/MDXContent";

// Pre-generate all nested doc paths, split into segments for catch-all route
export function generateStaticParams() {
  return allDocs.map((d) => ({ slug: d.slug.split("/") }));
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const slugPath = slug.join("/");
  const doc = allDocs.find((d) => d.slug === slugPath);
  if (!doc) return notFound();

  return (
    <article style={{ maxWidth: 820, margin: "40px auto", padding: 16 }}>
      <h1
        className="hover-darken-text"
        style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}
      >
        {doc.title}
      </h1>
      <div className="hover-darken">
        <MDXContent code={doc.body.code} />
      </div>
    </article>
  );
}
