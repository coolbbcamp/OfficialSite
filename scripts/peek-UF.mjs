import { readFileSync } from "node:fs";
const s = readFileSync("assets/App3D-f554a111.js", "utf8");
const i = s.indexOf("class UF extends");
console.log(s.slice(i, i + 4000));
