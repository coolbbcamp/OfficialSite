import { readFileSync } from "node:fs";
const s = readFileSync("assets/App3D-f554a111.js", "utf8");
const idx = s.indexOf("colorText:");
console.log(s.slice(idx - 200, idx + 300));
