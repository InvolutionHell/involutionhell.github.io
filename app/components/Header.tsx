import { ThemeToggle } from "./ThemeToggle";
import { Button } from "../../components/ui/button";
import { MessageCircle } from "lucide-react";
import { Github as GithubIcon } from "./icons/Github";

export function Header() {
  return (
    <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* 简洁方形标识，无渐变、无圆角 */}
          <div className="w-8 h-8 border border-gray-300 dark:border-gray-700 flex items-center justify-center text-sm font-semibold">
            IH
          </div>
          {/* 纯文本标题，无渐变 */}
          <span className="font-semibold text-lg tracking-tight">
            Involution Hell
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            特点
          </a>
          <a
            href="#community"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            社区
          </a>
          <a
            href="#contact"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            联系我们
          </a>
        </nav>

        <div className="flex items-center gap-2">
          {/* 扁平图标按钮：移除圆角与缩放动画 */}
          <Button variant="ghost" size="icon" asChild className="rounded-none">
            <a
              href="https://github.com/involutionhell"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <GithubIcon className="h-5 w-5" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" asChild className="rounded-none">
            <a
              href="https://discord.com/invite/6CGP73ZWbD"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Discord"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
