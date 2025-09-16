import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import {
  ExternalLink,
  MessageCircle,
  Github,
  BookOpen,
  GraduationCap,
} from "lucide-react";

export function Community() {
  return (
    <section id="community" className="py-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            成为{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              社区
            </span>{" "}
            的一员
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            与来自世界各地的开发者一起学习、成长、创造。每个人的贡献都让社区变得更好。
          </p>
        </div>

        {/* Main CTA Card */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card className="relative overflow-hidden border-2 border-primary/20 bg-transparent shadow-none">
            <CardContent className="p-8 md:p-12 text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
                  <BookOpen className="h-8 w-8 text-sky-500" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  内卷知识库
                </h3>
                <p className="text-muted-foreground text-lg mb-6 max-w-2xl mx-auto">
                  探索我们精心整理的技术文档、教程和工具。从基础到进阶，应有尽有。
                </p>
                <Button
                  variant="outline"
                  asChild
                  className="text-lg px-8 py-6 h-auto"
                >
                  <a
                    href="https://involutionhell.github.io/docs/ai"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    访问知识库 <ExternalLink className="ml-2 h-5 w-5" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="border-border bg-transparent shadow-none hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 mb-4">
                  <Github className="h-6 w-6 text-sky-500" />
                </div>
                <h3 className="text-xl font-semibold mb-3">GitHub 仓库</h3>
                <p className="text-muted-foreground mb-6">
                  查看源代码，提交 Issue，参与项目讨论。
                </p>
                <Button variant="outline" asChild className="w-full">
                  <a
                    href="https://github.com/involutionhell"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    访问 GitHub <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-transparent shadow-none hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 mb-4">
                  <MessageCircle className="h-6 w-6 text-sky-500" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Discord 社区</h3>
                <p className="text-muted-foreground mb-6">
                  实时交流，分享经验，结识志同道合的朋友。
                </p>
                <Button
                  variant="outline"
                  asChild
                  className="w-full text-sky-600 dark:text-sky-400"
                >
                  <a
                    href="https://discord.com/invite/6CGP73ZWbD"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    加入 Discord <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-transparent shadow-none hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 mb-4">
                  <GraduationCap className="h-6 w-6 text-sky-500" />
                </div>
                <h3 className="text-xl font-semibold mb-3">文献资料</h3>
                <p className="text-muted-foreground mb-6">
                  访问我们在 Zotero 的文献库，获取精选学术资源。
                </p>
                <Button variant="outline" asChild className="w-full">
                  <a
                    href="https://www.zotero.org/groups/6053219/unsw_ai/library"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    访问文献库 <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
