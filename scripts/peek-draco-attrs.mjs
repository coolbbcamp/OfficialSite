import { readFileSync } from "node:fs";
const s = readFileSync("assets/App3D-f554a111.js", "utf8");

// Find class that has batched and load methods
const idx = s.indexOf("batched(i){return this._initLoad");
const chunk = s.slice(idx - 3000, idx + 500);
// Find attributeIDs in this chunk
const ai = chunk.indexOf("attributeIDs");
console.log("attributeIDs in loader:", chunk.slice(ai - 200, ai + 800));

// Search globally for batchId mapping
const bi = s.indexOf("batchId:");
console.log("batchId:", s.slice(bi - 100, bi + 400));

// Find Yf constant
const yf = s.match(/Yf="batchId"/);
console.log("Yf match:", yf);

// Search for centr in attribute mapping
let search = 0;
while (true) {
  const i = s.indexOf("centr:", search);
  if (i < 0) break;
  const ctx = s.slice(i - 30, i + 80);
  if (ctx.includes("attribute") || ctx.includes("ID")) {
    console.log("centr mapping:", ctx);
  }
  search = i + 1;
}
