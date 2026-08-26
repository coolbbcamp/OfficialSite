import { readFileSync } from "node:fs";
const s = readFileSync("assets/App3D-f554a111.js", "utf8");
const i = s.indexOf("setRelativePath");
console.log(s.slice(i - 100, i + 600));
