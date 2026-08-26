import { readFileSync } from "node:fs";

const s = readFileSync("assets/index-2eb69c09.js", "utf8");
const patterns = ["App3D", "relativePath", ".ready", "loader", "hidden", "hide("];
for (const p of patterns) {
  let idx = 0;
  const hits = [];
  while (true) {
    const i = s.indexOf(p, idx);
    if (i === -1) break;
    hits.push(s.slice(Math.max(0, i - 80), i + 120));
    idx = i + 1;
    if (hits.length >= 3) break;
  }
  console.log("\n===", p, "===");
  hits.forEach((h, n) => console.log(n, h.replace(/\n/g, " ")));
}
