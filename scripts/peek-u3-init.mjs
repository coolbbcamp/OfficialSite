import { readFileSync } from "node:fs";
const s = readFileSync("assets/App3D-f554a111.js", "utf8");
const idx = s.indexOf("async init(){const e=await zt.batched");
console.log(s.slice(idx, idx + 180));
