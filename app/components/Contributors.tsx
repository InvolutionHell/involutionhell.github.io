import Image from "next/image";
import Link from "next/link";

// Define contributor data structure
interface Contributor {
  login: string;
  avatar_url: string;
  html_url: string;
}

export function Contributors({
  contributors,
}: {
  contributors: Contributor[];
}) {
  if (contributors.length === 0) {
    return null; // Don't render anything if no contributors
  }

  return (
    <div className="mt-8 rounded-lg border bg-card p-6 text-card-foreground">
      <h3 className="mb-4 text-lg font-bold">贡献者</h3>
      <div className="flex flex-wrap gap-x-6 gap-y-4">
        {contributors.map((contributor) => (
          <Link
            key={contributor.login}
            href={contributor.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium hover:underline"
          >
            <Image
              src={contributor.avatar_url}
              alt={contributor.login}
              width={45}
              height={45}
              className="rounded-full"
            />
            {contributor.login}
          </Link>
        ))}
      </div>
    </div>
  );
}
