import { readFileSync } from "node:fs";

const s = readFileSync("assets/App3D-f554a111.js", "utf8");

// Find he.init definition context
const idx = s.indexOf("he.init");
console.log("he.init occurrences:", (s.match(/he\.init/g) || []).length);
let i = s.indexOf("init({canvasCnt");
while (i !== -1) {
  console.log("\n--- init at", i, "---");
  console.log(s.slice(i - 200, i + 400));
  i = s.indexOf("init({canvasCnt", i + 1);
}

// jF class
const jf = s.match(/class jF[^{]{0,200}/);
console.log("\njF:", jf?.[0]);

// relativePath usage
const rp = [...s.matchAll(/relativePath[^,]{0,80}/g)].slice(0, 8);
rp.forEach((m) => console.log("rp:", m[0]));
