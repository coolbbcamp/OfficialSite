import { readFileSync } from "node:fs";
const s = readFileSync("assets/App3D-f554a111.js", "utf8");
for (const cls of ["class aF", "class nF", "class Jo"]) {
  const i = s.indexOf(cls);
  if (i >= 0) console.log("\n===", cls, "===\n", s.slice(i, i + 2000));
}
