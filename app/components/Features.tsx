import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Users, Zap, Heart } from "lucide-react";
import { Github as GithubIcon } from "./icons/Github";

export function Features() {
  const features = [
    {
      icon: <GithubIcon className="h-8 w-8 text-sky-500" />,
      title: "完全开源",
      description:
        "所有内容存放于 GitHub 仓库，任何人都能参与贡献。代码透明，社区驱动。",
      highlight: "100% 透明",
      color: "bg-red-100",
    },
    {
      icon: <Heart className="h-8 w-8 text-sky-500" />,
      title: "开放透明",
      description:
        "没有门槛、没有收费，所有资料和代码都对外公开。真正的开放式学习环境。",
      highlight: "免费开放",
      color: "bg-red-200",
    },
    {
      icon: <Users className="h-8 w-8 text-sky-500" />,
      title: "社区驱动",
      description:
        "每一位贡献者都是组织的建设者。共同打造属于开发者的学习天堂。",
      highlight: "共同建设",
      color: "bg-red-100",
    },
    {
      icon: <Zap className="h-8 w-8 text-sky-500" />,
      title: "高效学习",
      description:
        "精心整理的技术文档，避免重复造轮子。专注于提升实际技能而非内卷竞争。",
      highlight: "效率优先",
      color: "bg-red-200",
    },
  ];

  return (
    <section id="features" className="py-12">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h3 className="text-3xl md:text-4xl font-bold mb-6">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              内卷地狱
            </span>
            想做什么{" "}
          </h3>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            我们致力于创造一个真正属于开发者的学习环境，让每个人都能在这里获得成长。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="relative overflow-hidden border-border bg-transparent shadow-none hover:shadow-elegant transition-all duration-500 hover:-translate-y-2 group"
            >
              <CardContent className="p-8">
                <div className="flex items-start space-x-4">
                  <div className="p-0">{feature.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold">{feature.title}</h3>
                      <Badge variant="outline" className="text-xs">
                        {feature.highlight}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>

                {/* Hover effect decoration */}
                <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity duration-500"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
