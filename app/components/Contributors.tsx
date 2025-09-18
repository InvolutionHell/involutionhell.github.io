import Image from "next/image";
import Link from "next/link";

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
    return null;
  }

  return (
    <section aria-labelledby="contributors-heading">
      <hr className="border-border/70 !mt-10 !mb-5" />
      <h2 id="contributors-heading">{"\u8d21\u732e\u8005"}</h2>
      <ul className="mt-0 mb-0 flex flex-wrap items-center gap-x-6 gap-y-4 list-none p-0">
        {contributors.map((contributor) => (
          <li key={contributor.login}>
            <Link
              href={contributor.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 text-base font-medium text-primary transition-colors hover:text-primary/80 no-underline"
            >
              <Image
                src={contributor.avatar_url}
                alt={contributor.login}
                width={35}
                height={35}
                className="!m-0 h-10 w-10 rounded-full border border-border/50 object-cover shadow-sm"
              />
              <span>{contributor.login}</span>
            </Link>
          </li>
        ))}
      </ul>
      <hr className="!mb-0 !mt-5 border-border/70" />
    </section>
  );
}
