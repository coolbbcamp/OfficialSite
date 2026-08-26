import { access } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync, existsSync } from "node:fs";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const ASSETS = join(ROOT, "assets");

const LOCAL_ONLY = [
  "audio/children.ogg",
  "audio/children-loop.ogg",
  "geometries/monkey.drc",
  "geometries/funding_text.drc",
  "geometries/ground_camp_text.drc",
  "images/igloo/ground_camp_text_color.ktx2",
  "images/cubes/monkey_color.ktx2",
  "images/monkey_dark_color.ktx2",
  "images/igloo/funding_text_color.ktx2",
  "images/igloo/funding_text_exploded_color.ktx2",
  "images/volumes/monkey_64.ktx2",
  "images/ui/logo-datatexture.ktx2",
];

const SOURCE_GLB = [
  "models/monkey/monkey_display.glb",
  "models/monkey/monkey_volume.glb",
];

const downloadSrc = readFileSync(join(ROOT, "scripts", "download-igloo-assets.mjs"), "utf8");
const manifestLines = [
  ...downloadSrc
    .split("\n")
    .filter((l) => l.match(/^\s+"[^"]+",?\s*$/))
    .map((l) => l.trim().replace(/^"|",?$/g, "")),
  ...LOCAL_ONLY,
];

let failed = 0;
const glbOk =
  (await access(join(ROOT, "models/monkey/monkey.glb")).then(() => true).catch(() => false)) ||
  ((await access(join(ROOT, "models/monkey/monkey_display.glb")).then(() => true).catch(() => false)) &&
    (await access(join(ROOT, "models/monkey/monkey_volume.glb")).then(() => true).catch(() => false)));

for (const path of manifestLines) {
  if (SOURCE_GLB.includes(path)) continue;
  const file = join(ASSETS, path);
  try {
    await access(file);
    console.log(`OK ${path}`);
  } catch {
    console.error(`MISSING ${path}`);
    failed++;
  }
}

if (glbOk) {
  if (existsSync(join(ROOT, "models/monkey/monkey.glb"))) {
    console.log("OK models/monkey/monkey.glb");
  } else {
    console.log("OK models/monkey/monkey_display.glb");
    console.log("OK models/monkey/monkey_volume.glb");
  }
} else {
  console.error("MISSING models/monkey/monkey.glb (or monkey_display.glb + monkey_volume.glb)");
  failed++;
}

try {
  await access(join(ROOT, "models/monkey/particle_seed.bin"));
  console.log("OK models/monkey/particle_seed.bin");
} catch {
  console.error("MISSING models/monkey/particle_seed.bin");
  failed++;
}

if (failed) {
  console.error(`${failed} assets missing on disk`);
  process.exit(1);
}
console.log(`All ${manifestLines.length} assets present`);
