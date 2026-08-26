import { readFileSync } from "node:fs";
const s = readFileSync("assets/App3D-f554a111.js", "utf8");
const idx = s.indexOf('setAttribute("centr"');
console.log(s.slice(idx - 1500, idx + 500));
