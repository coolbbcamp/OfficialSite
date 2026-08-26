import { readFileSync } from "node:fs";
const s = readFileSync("assets/App3D-f554a111.js", "utf8");
const anchor = s.indexOf("await Promise.all([LE()");
const chunk = s.slice(anchor - 5000, anchor);
const leDefs = [...chunk.matchAll(/\bLE\b/g)];
console.log("LE refs in 5000 chars before use:", leDefs.length);
// find function definitions in chunk
const funcs = [...chunk.matchAll(/function [A-Z][A-z]{0,3}\(/g)];
funcs.forEach((m) => console.log(m[0], "at", m.index));
