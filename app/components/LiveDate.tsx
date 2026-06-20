"use client";

import { useEffect, useState } from "react";

type LiveDateProps = {
  // milliseconds since epoch
  initialTimestamp: number;
};

// 固定时区（悉尼）保证服务端/客户端首帧一致，避免 hydration mismatch；
// 挂载后每秒刷新，避免 SSG/ISR 把 build 时刻的日期冻住。
const TIMEZONE = "Australia/Sydney";

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: TIMEZONE,
  });
}

export function LiveDate({ initialTimestamp }: LiveDateProps) {
  const [formattedDate, setFormattedDate] = useState(() =>
    formatDate(initialTimestamp),
  );

  useEffect(() => {
    const update = () => setFormattedDate(formatDate(Date.now()));
    update();
    const intervalId = setInterval(update, 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
      {formattedDate}
    </div>
  );
}
