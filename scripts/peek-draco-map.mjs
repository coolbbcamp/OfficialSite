import { readFileSync } from "node:fs";
const s = readFileSync("assets/App3D-f554a111.js", "utf8");
// Find the exact mapping line
const m = s.match(/d\.attributes\.forEach\(\([^)]+\)=>\{[^}]+\}/);
console.log(m?.[0]);

// Also find e= array for types
const eIdx = s.indexOf('const e=["Int8Array"');
console.log(s.slice(eIdx, eIdx + 200));
