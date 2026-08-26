import { readFileSync } from "node:fs";
const s = readFileSync("assets/index-2eb69c09.js", "utf8");
const i = s.lastIndexOf("(async");
console.log(s.slice(i, i + 1500));
