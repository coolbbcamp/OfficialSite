import { readFileSync } from "node:fs";
const s = readFileSync("assets/App3D-f554a111.js", "utf8");

const w3 = s.indexOf("class w3{");
console.log("w3:", s.slice(w3, w3 + 600));

const c3 = s.indexOf("class C3{");
console.log("C3:", s.slice(c3, c3 + 600));

const igloobase = s.indexOf("igloobase");
console.log("igloobase:", s.slice(igloobase - 100, igloobase + 400));
