import { readFileSync } from "node:fs";
const s = readFileSync("assets/App3D-f554a111.js", "utf8");
for (const fn of ["nR=function", "wR=function", "HR=function", "TU=function", "absolutePath", "setPath"]) {
  const i = s.indexOf(fn);
  if (i >= 0) console.log("\n===", fn, "===\n", s.slice(i, i + 500));
}
