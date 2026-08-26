import { readFileSync } from "node:fs";
const s = readFileSync("assets/App3D-f554a111.js", "utf8");

// Find lR function
const lrIdx = s.indexOf("function lR(");
if (lrIdx >= 0) console.log("lR:", s.slice(lrIdx, lrIdx + 800));

// Find batched method
const batIdx = s.indexOf("batched(");
console.log("batched context:", s.slice(batIdx - 100, batIdx + 400));

// Find igloo.drc
let idx = 0;
while (true) {
  const i = s.indexOf("igloo.drc", idx);
  if (i < 0) break;
  console.log("igloo.drc at", i, s.slice(i - 80, i + 120));
  idx = i + 1;
}

// Find igloo_color
idx = 0;
while (true) {
  const i = s.indexOf("igloo_color", idx);
  if (i < 0) break;
  console.log("igloo_color at", i, s.slice(i - 60, i + 100));
  idx = i + 1;
}

// Find w3 and C3 classes - igloo_cage
const cageIdx = s.indexOf("igloo_cage.drc");
console.log("cage:", s.slice(cageIdx - 200, cageIdx + 200));
