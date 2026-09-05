import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";

const downloadSrc = readFileSync(join(ROOT, "scripts", "download-igloo-assets.mjs"), "utf8");
const manifestLines = [
  ...downloadSrc
    .split("\n")
    .filter((l) => l.match(/^\s+"[^"]+",?\s*$/))
    .map((l) => l.trim().replace(/^"|",?$/g, "")),
  "geometries/monkey.drc",
  "geometries/funding_text.drc",
  "geometries/roblox.drc",
  "images/cubes/monkey_color.ktx2",
  "images/cubes/roblox_color.ktx2",
  "images/cubes/roblox_color.png",
  "App3D-coolbb.js",
  "images/monkey_dark_color.ktx2",
  "images/roblox_dark_color.ktx2",
  "images/igloo/funding_text_color.ktx2",
  "images/igloo/funding_text_exploded_color.ktx2",
];

async function check(path) {
  const url = `${BASE}/assets/${path}`;
  const res = await fetch(url);
  const ct = res.headers.get("content-type") || "";
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  if (ct.includes("text/html")) throw new Error(`html fallback ${url}`);
  return { path, ct, size: res.headers.get("content-length") };
}

async function main() {
  const indexRes = await fetch(`${BASE}/`);
  const indexHtml = await indexRes.text();
  if (!indexHtml.includes("index-2eb69c09.js")) {
    throw new Error("index.html missing entry script");
  }
  if (!indexHtml.includes("CoolBB")) {
    throw new Error(
      `Wrong app on ${BASE} (expected CoolBB). Stop other servers on this port or set BASE_URL.`,
    );
  }
  console.log("OK index.html");

  const indexJs = await fetch(`${BASE}/assets/index-2eb69c09.js`);
  const jsText = await indexJs.text();
  if (jsText.includes("https://www.igloo.inc")) {
    throw new Error("index bundle still references igloo.inc URLs — run: npm run download");
  }
  if (!jsText.includes("ht=function(t){return\"/\"+t}")) {
    throw new Error("index bundle missing local asset path helper — run: node scripts/patch-index-bundle.mjs");
  }
  console.log("OK index bundle (no igloo.inc)");

  let failed = 0;
  for (const path of manifestLines) {
    try {
      const info = await check(path);
      console.log(`OK HTTP ${path}`);
    } catch (err) {
      console.error(`FAIL ${path}: ${err.message}`);
      failed++;
    }
  }

  if (failed) {
    process.exit(1);
  }
  console.log(`\nSmoke HTTP check passed (${manifestLines.length} assets + index)`);
}

main();
