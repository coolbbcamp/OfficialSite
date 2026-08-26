import { readFileSync } from "node:fs";
const s = readFileSync("assets/index-2eb69c09.js", "utf8");
const i = s.indexOf("function Wt(");
console.log(s.slice(i, i + 1200));
