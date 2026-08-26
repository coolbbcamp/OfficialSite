import { readFileSync } from "node:fs";
const s = readFileSync("assets/App3D-f554a111.js", "utf8");
const patterns = ["zt.load", "zt={", "const zt", "le.load", "const le=", "le={", "nR()", "setDecoderPath"];
for (const p of patterns) {
  let idx = 0, n = 0;
  while (n < 2) {
    const i = s.indexOf(p, idx);
    if (i === -1) break;
    console.log("\n---", p, "at", i, "---");
    console.log(s.slice(i - 80, i + 300));
    idx = i + 1;
    n++;
  }
}
