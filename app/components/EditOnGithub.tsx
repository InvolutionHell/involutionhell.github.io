import Link from "next/link";

// 复用的编辑链接按钮，统一封装图标与样式
interface EditOnGithubProps {
  href: string;
}

export function EditOnGithub({ href }: EditOnGithubProps) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center rounded-md border border-transparent w-9 h-9 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label="Edit on GitHub"
    >
      <span
        aria-hidden
        className="material-symbols-outlined text-lg flex items-center justify-center"
      >
        edit
      </span>
    </Link>
  );
}
