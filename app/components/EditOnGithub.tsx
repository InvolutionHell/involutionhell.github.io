import Link from "next/link";

export function EditOnGithub({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 px-3 py-1.5 font-mono text-xs uppercase tracking-widest border border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors no-underline"
      data-umami-event="docs_edit_click"
      data-umami-event-page={href}
    >
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
        <path d="m15 5 4 4" />
      </svg>
      Edit Me
    </Link>
  );
}
