import { readFileSync } from "node:fs";
const s = readFileSync("assets/App3D-f554a111.js", "utf8");
const i = s.indexOf("mesh.name=\"logo\"");
console.log(s.slice(i - 1500, i + 800));
