import { readFileSync } from "node:fs";
const s = readFileSync("assets/App3D-f554a111.js", "utf8");

// Find draco worker - search for attribute name mapping
const patterns = ["unique_id", "attribute_types", '"centr"', "batchId", "emission", "INVALID"];
for (const p of patterns) {
  let idx = 0;
  let count = 0;
  while (count < 3) {
    const i = s.indexOf(p, idx);
    if (i < 0) break;
    if (p === "unique_id" || p === "attribute_types" || p === '"centr"') {
      console.log(`\n=== ${p} at ${i} ===`);
      console.log(s.slice(i - 100, i + 300));
    }
    idx = i + 1;
    count++;
  }
}

// Find DRACOLoader worker source - look for onmessage decode
const decodeIdx = s.indexOf("case\"decode\"");
console.log("\ndecode worker:", s.slice(decodeIdx - 500, decodeIdx + 1500));
