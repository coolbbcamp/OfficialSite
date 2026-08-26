import { readFileSync } from "node:fs";
const s = readFileSync("assets/App3D-f554a111.js", "utf8");
const i = s.indexOf("class nF extends");
const end = s.indexOf("class ", i + 100);
console.log(s.slice(i, end));
