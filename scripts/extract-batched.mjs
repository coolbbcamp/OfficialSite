import { readFileSync } from "node:fs";
const s = readFileSync("assets/App3D-f554a111.js", "utf8");
const terms = ["attributeId", "attribute_types", "centr:", '"centr"', "name:centr"];
for (const term of terms) {
  const i = s.indexOf(term);
  if (i >= 0) console.log(term, s.slice(i - 40, i + 200));
}
