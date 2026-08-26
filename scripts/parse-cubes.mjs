import { readFileSync } from "node:fs";

const s = readFileSync("assets/App3D-f554a111.js", "utf8");
const marker = "cubes:[{title:";
const start = s.indexOf(marker);
if (start < 0) throw new Error("no cubes marker");
let depth = 0;
let i = s.indexOf("[", start);
const begin = i;
for (; i < s.length; i++) {
  const c = s[i];
  if (c === "[") depth++;
  else if (c === "]") {
    depth--;
    if (depth === 0) break;
  }
}
const arr = s.slice(begin, i + 1);
console.log("array chars", arr.length);
const cubes = eval(arr);
console.log("cubes", cubes.length);
console.log("cube0 keys", Object.keys(cubes[0]));
console.log("cube0 innerobject", cubes[0].innerobject);
console.log("cube0 interior.obj", cubes[0].interior?.obj);
