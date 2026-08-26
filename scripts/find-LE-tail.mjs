import { readFileSync } from "node:fs";
const s = readFileSync("assets/App3D-f554a111.js", "utf8");
// last 30k chars often have svelte helpers
const tail = s.slice(-40000);
const idx = tail.indexOf("LE");
console.log("LE in tail count:", (tail.match(/\bLE\b/g) || []).length);
let i = 0;
while (true) {
  const j = tail.indexOf("LE", i);
  if (j === -1) break;
  console.log(tail.slice(j - 40, j + 80).replace(/\n/g, " "));
  i = j + 2;
  if (i > 20000) break;
}
