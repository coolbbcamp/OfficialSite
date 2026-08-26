import { readFileSync } from "node:fs";
const s = readFileSync("assets/App3D-f554a111.js", "utf8");
const start = s.indexOf("class jF{");
const chunk = s.slice(start, start + 15000);
const idx = chunk.indexOf("createScenes");
console.log(chunk.slice(idx, idx + 2500));
