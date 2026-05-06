import { getTranslations } from "next-intl/server";

/**
 * 活跃度热力图 — GitHub 贡献图风格。
 * 数据源：leaderboard JSON 里的 dailyCounts（build-time 生成，零运行时 DB 查询）。
 *
 * 渲染规则：
 * - 固定显示过去 52 周（364 天）
 * - 列 = 周（左老右新），行 = 周一到周日
 * - 色阶按当日贡献次数分 5 档：0 / 1-2 / 3-5 / 6-10 / 10+
 * - 无 JS 交互，纯 server component，CSS title 原生 tooltip
 */

interface Props {
  /** 键 = "YYYY-MM-DD"，值 = 当日贡献次数（commits） */
  dailyCounts: Record<string, number>;
}

const WEEKS = 52;
const DAY_MS = 24 * 60 * 60 * 1000;

function getBucket(count: number): number {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}

function formatDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function ActivityHeatmap({ dailyCounts }: Props) {
  const t = await getTranslations("profile.activity");
  // 以今天为右边界，往前 52 周；按周对齐：从上上周日起（GitHub 图的起点）
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // 找到本周日作为右上角的终点
  const todayDow = today.getUTCDay(); // 0=Sun
  const lastSun = new Date(today.getTime() - todayDow * DAY_MS);
  const start = new Date(lastSun.getTime() - (WEEKS - 1) * 7 * DAY_MS);

  // 构造 WEEKS × 7 的二维网格
  const grid: Array<Array<{ day: string; count: number } | null>> = [];
  let total = 0;
  let activeDays = 0;

  for (let w = 0; w < WEEKS; w++) {
    const week: Array<{ day: string; count: number } | null> = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start.getTime() + (w * 7 + d) * DAY_MS);
      if (date > today) {
        week.push(null); // 未来的格子留空
        continue;
      }
      const key = formatDay(date);
      const count = dailyCounts[key] ?? 0;
      total += count;
      if (count > 0) activeDays++;
      week.push({ day: key, count });
    }
    grid.push(week);
  }

  // 月份标签：找到每列第一个周日的月份变化点
  const monthLabels: Array<{ col: number; label: string }> = [];
  let lastMonth = -1;
  for (let w = 0; w < WEEKS; w++) {
    const first = grid[w][0];
    if (!first) continue;
    const d = new Date(first.day);
    const m = d.getUTCMonth();
    if (m !== lastMonth) {
      // locale 驱动月份：zh 显示 "1月 2月 ..."，en 显示 "Jan Feb ..."
      monthLabels.push({
        col: w,
        label: t(`month.${m + 1}` as Parameters<typeof t>[0]),
      });
      lastMonth = m;
    }
  }

  return (
    <section className="border border-[var(--foreground)] p-6 lg:p-8 flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            {t("sec")}
          </div>
          <h3 className="font-serif text-xl font-black uppercase mt-1 text-[var(--foreground)]">
            {t("heading")}
          </h3>
        </div>
        <div className="font-mono text-[11px] text-neutral-500">
          {t("stats", {
            days: activeDays.toLocaleString(),
            commits: total.toLocaleString(),
          })}
        </div>
      </div>

      {/* 月份刻度 */}
      <div
        className="grid gap-[3px] text-[9px] font-mono text-neutral-500 pl-4"
        style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: WEEKS }).map((_, w) => {
          const label = monthLabels.find((m) => m.col === w);
          return (
            <div key={w} className="min-w-0">
              {label ? label.label : ""}
            </div>
          );
        })}
      </div>

      {/* 网格 + 左侧周几刻度 */}
      <div className="flex gap-1">
        {/* 周几刻度（周一 / 周四） */}
        <div className="flex flex-col justify-between font-mono text-[9px] text-neutral-500 py-0.5">
          <span></span>
          <span>{t("weekday.mon")}</span>
          <span></span>
          <span>{t("weekday.thu")}</span>
          <span></span>
          <span>{t("weekday.sat")}</span>
          <span></span>
        </div>

        {/* 主体网格：52 列 × 7 行 */}
        <div
          className="grid gap-[3px] flex-1"
          style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }}
        >
          {grid.map((week, w) => (
            <div key={w} className="grid grid-rows-7 gap-[3px]">
              {week.map((cell, d) => {
                if (!cell) {
                  return <div key={d} className="aspect-square" aria-hidden />;
                }
                const bucket = getBucket(cell.count);
                return (
                  <div
                    key={d}
                    title={`${cell.day}: ${cell.count} commits`}
                    className={[
                      "aspect-square border border-[var(--foreground)]/30",
                      bucket === 0
                        ? "bg-[var(--background)]"
                        : bucket === 1
                          ? "bg-[#CC0000]/20"
                          : bucket === 2
                            ? "bg-[#CC0000]/40"
                            : bucket === 3
                              ? "bg-[#CC0000]/70"
                              : "bg-[#CC0000]",
                    ].join(" ")}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 图例 */}
      <div className="flex items-center gap-2 font-mono text-[9px] text-neutral-500 self-end">
        <span>{t("legend.less")}</span>
        <span className="w-3 h-3 border border-[var(--foreground)]/30 bg-[var(--background)]" />
        <span className="w-3 h-3 border border-[var(--foreground)]/30 bg-[#CC0000]/20" />
        <span className="w-3 h-3 border border-[var(--foreground)]/30 bg-[#CC0000]/40" />
        <span className="w-3 h-3 border border-[var(--foreground)]/30 bg-[#CC0000]/70" />
        <span className="w-3 h-3 border border-[var(--foreground)]/30 bg-[#CC0000]" />
        <span>{t("legend.more")}</span>
      </div>
    </section>
  );
}
