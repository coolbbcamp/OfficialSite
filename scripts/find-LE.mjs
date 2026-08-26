import { readFileSync } from "node:fs";
const s = readFileSync("assets/App3D-f554a111.js", "utf8");
// find LE definition - often `function LE` or `LE=async`
const re = /(?:function LE|LE=async function|const LE=|async function LE)/g;
let m;
while ((m = re.exec(s))) {
  console.log("at", m.index, s.slice(m.index, m.index + 600));
}
