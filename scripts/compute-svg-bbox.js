const fs = require("fs");

const path = process.argv[2] || "public/mascot.svg";
const s = fs.readFileSync(path, "utf8");
const rects = [...s.matchAll(/<rect[^>]+>/g)];
let minX = Infinity,
  minY = Infinity,
  maxX = -Infinity,
  maxY = -Infinity;
for (const m of rects) {
  const r = m[0];
  const x = +(r.match(/x="([\d.]+)"/)?.[1] ?? NaN);
  const y = +(r.match(/y="([\d.]+)"/)?.[1] ?? NaN);
  const w = +(r.match(/width="([\d.]+)"/)?.[1] ?? NaN);
  const h = +(r.match(/height="([\d.]+)"/)?.[1] ?? NaN);
  if (!isFinite(x) || !isFinite(y) || !isFinite(w) || !isFinite(h)) continue;
  if (x < minX) minX = x;
  if (y < minY) minY = y;
  if (x + w > maxX) maxX = x + w;
  if (y + h > maxY) maxY = y + h;
}
console.log(
  JSON.stringify(
    {
      minX,
      minY,
      maxX,
      maxY,
      width: Math.ceil(maxX - minX),
      height: Math.ceil(maxY - minY),
    },
    null,
    2,
  ),
);
