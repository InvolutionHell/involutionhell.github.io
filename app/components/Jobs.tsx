import { Card, CardContent } from "../../components/ui/card";
import Link from "next/link";
import {
  Briefcase,
  CircuitBoard,
  GitBranch,
  ShieldAlert,
  FileCode2,
  NotebookPen,
} from "lucide-react";

const items = [
  {
    key: "tech-stack",
    title: "技术栈",
    desc: "岗位常见技术与学习路径",
    href: "/docs/guide/job/tech-stack",
    icon: CircuitBoard,
  },
  {
    key: "workflow",
    title: "业务流",
    desc: "真实业务流程与协作规范",
    href: "/docs/guide/job/workflow",
    icon: GitBranch,
  },
  {
    key: "pitfalls",
    title: "避雷",
    desc: "避坑经验与团队选择建议",
    href: "/docs/guide/job/pitfalls",
    icon: ShieldAlert,
  },
  {
    key: "coding-test",
    title: "笔试",
    desc: "笔试高频题与解题思路",
    href: "/docs/guide/job/coding-test",
    icon: FileCode2,
  },
  {
    key: "interview",
    title: "面经",
    desc: "面试问题库与面经分享",
    href: "/docs/guide/job/interview",
    icon: NotebookPen,
  },
];

export function Jobs() {
  return (
    <section id="jobs" className="py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 inline-flex items-center gap-2">
            <Briefcase className="h-7 w-7 text-sky-600 dark:text-sky-400" />
            找工作
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base">
            聚合求职所需的关键信息：快速定位方向，高效准备与避坑。
          </p>
        </div>

        <Card className="border-border bg-transparent shadow-none">
          <CardContent className="p-4 md:p-6">
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {items.map(({ key, title, desc, href, icon: Icon }) => (
                <li key={key} className="h-full">
                  <Link
                    href={href}
                    className="block h-full border border-border px-4 py-3 hover:bg-accent/10 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="h-5 w-5 mt-0.5 text-sky-600 dark:text-sky-400" />
                      <div>
                        <div className="font-medium">{title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {desc}
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export default Jobs;
