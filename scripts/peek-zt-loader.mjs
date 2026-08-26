import { readFileSync } from "node:fs";
const s = readFileSync("assets/App3D-f554a111.js", "utf8");

// Find _initLoad definition
const idx = s.indexOf("_initLoad(");
console.log("_initLoad:", s.slice(idx, idx + 2000));
