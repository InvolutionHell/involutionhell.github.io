"use client";

import { useMDXComponent } from "next-contentlayer/hooks";

export default function MDXContent({ code }: { code: string }) {
  const MDX = useMDXComponent(code);
  return (
    <div className="prose prose-lg max-w-none">
      <style jsx global>{`
        .prose a {
          @apply hover-link;
          color: var(--primary);
          text-decoration: none;
        }

        .prose a:hover {
          text-decoration: underline;
        }

        .prose code {
          @apply hover-darken-text;
          background-color: var(--muted);
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
          font-size: 0.875em;
        }

        .prose pre {
          @apply hover-darken-bg;
          background-color: var(--muted);
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
        }

        .prose blockquote {
          @apply hover-darken-bg;
          border-left: 4px solid var(--primary);
          padding-left: 1rem;
          margin: 1rem 0;
          background-color: var(--muted);
          padding: 1rem;
          border-radius: 0.25rem;
        }

        .prose h1,
        .prose h2,
        .prose h3,
        .prose h4,
        .prose h5,
        .prose h6 {
          @apply hover-darken-text;
        }

        .prose p {
          line-height: 1.7;
          margin: 1rem 0;
        }

        .prose ul,
        .prose ol {
          margin: 1rem 0;
          padding-left: 2rem;
        }

        .prose li {
          margin: 0.5rem 0;
        }
      `}</style>
      <MDX />
    </div>
  );
}
