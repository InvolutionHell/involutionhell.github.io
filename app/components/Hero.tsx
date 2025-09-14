import Link from "next/link";
import { Button } from "./ui/button";
import { ExternalLink } from "lucide-react";
import { Github as GithubIcon } from "./icons/Github";
import { ZoteroFeed } from "@/app/components/ZoteroFeed";
import { ExternalFrame } from "./ExternalFrame";

export function Hero() {
  const categories: { title: string; desc: string; href: string }[] = [
    {
      title: "AI",
      desc: "基础数学、LLM、训练与推理、评测、数据集等",
      href: "/docs/ai",
    },
    {
      title: "Computer Science",
      desc: "数据结构、算法与基础计算机科学知识",
      href: "/docs/computer-science",
    },
    {
      title: "Guide",
      desc: "使用指引与贡献流程（即将上线）",
      href: "/docs/guide",
    },
  ];

  return (
    <section className="relative">
      <div className="container mx-auto px-6 pt-12 pb-0 text-center">
        {/* Mascot with overlay title at 3/4 height */}
        <div className="relative mx-auto max-w-5xl">
          <img
            src="/mascot.svg"
            alt="Mascot"
            className="mx-auto h-[25vh] w-auto object-contain"
          />
          <h1 className="pointer-events-none select-none text-4xl md:text-6xl font-semibold leading-tight bg-gradient-primary bg-clip-text text-transparent">
            内卷地狱
          </h1>
        </div>

        <div className="mx-auto max-w-4xl mt-8">
          <p className="text-base md:text-lg text-muted-foreground">
            一个由开发者自发组织、免费开放的学习社区。降低门槛，避免无意义内卷，专注真实进步与乐趣。
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild>
              <a href="/docs/ai" target="_blank" rel="noopener noreferrer">
                访问知识库 <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a
                href="https://github.com/involutionhell"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub 仓库 <GithubIcon className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
        {/* Top-level directories */}
        <div className="mt-14">
          <div className="mb-4  吗,klext-sm text-muted-foreground">目录</div>
          <ul className="grid gap-4 md:grid-cols-3">
            {categories.map((c) => (
              <li key={c.title} className="h-full">
                <Link
                  href={c.href}
                  className="flex border border-border p-5 hover:bg-accent transition-colors h-full flex flex-col"
                >
                  <div className="text-lg font-semibold">{c.title}</div>
                  <p className="mt-1 text-sm text-muted-foreground flex-1">
                    {c.desc}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {/* 最新文献（Zotero，避免被 iframe 拒绝） */}
        <ZoteroFeed groupId={6053219} limit={8} />
      </div>
    </section>
  );
}
