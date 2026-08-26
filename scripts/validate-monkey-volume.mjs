/**
 * Validate monkey_64.ktx2 silhouette and waist continuity.
 * Usage: node scripts/validate-monkey-volume.mjs [path-to-ktx2]
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { decompress } from "fzstd";
import { read } from "ktx-parse";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RES = 64;

function idx(x, y, z) {
  return x + y * RES + z * RES * RES;
}

function loadVolumeData(path) {
  const k = read(readFileSync(path));
  let data = k.levels[0].levelData;
  if (k.supercompressionScheme === 2) data = decompress(data);
  return data;
}

function isInside(data, x, y, z) {
  const a = data[idx(x, y, z) * 4 + 3] / 255;
  return (a * 2 - 1) * 2 < 0;
}

function validate(path) {
  const data = loadVolumeData(path);
  let insideTotal = 0;
  const perY = new Array(RES).fill(0);

  for (let z = 0; z < RES; z++) {
    for (let y = 0; y < RES; y++) {
      for (let x = 0; x < RES; x++) {
        if (isInside(data, x, y, z)) {
          insideTotal++;
          perY[y]++;
        }
      }
    }
  }

  console.log(`Volume: ${path}`);
  console.log(`Inside voxels: ${insideTotal} / ${RES ** 3}`);

  const peachPath = join(ROOT, "assets", "images", "volumes", "peachesbody_64.ktx2");
  let peachInside = 25885;
  try {
    const peachData = loadVolumeData(peachPath);
    peachInside = 0;
    for (let i = 0; i < RES ** 3; i++) {
      const a = peachData[i * 4 + 3] / 255;
      if ((a * 2 - 1) * 2 < 0) peachInside++;
    }
    console.log(`Peach reference inside: ${peachInside}`);
  } catch {
    console.log("Peach reference not available for comparison.");
  }

  const warnings = [];
  if (insideTotal < 5000) warnings.push(`Too few inside voxels (${insideTotal})`);
  // Placeholder procedural volume is intentionally chunky; Blender watertight mesh should be ~25k–45k.
  if (insideTotal > 120000) warnings.push(`Volume too bloated (${insideTotal}) — check watertight mesh`);
  if (insideTotal > peachInside * 3 && insideTotal <= 120000) {
    warnings.push(`Inside count ${insideTotal} is >3× peach (${peachInside}) — replace placeholder GLB with Blender export`);
  }

  for (let y = 1; y < RES; y++) {
    if (perY[y] === 0 || perY[y - 1] === 0) continue;
    const drop = perY[y - 1] - perY[y];
    if (drop > perY[y - 1] * 0.5) {
      warnings.push(`Waist seam risk at y=${y}: slice ${perY[y]} vs y-1 ${perY[y - 1]}`);
    }
  }

  const zMid = Math.floor(RES / 2);
  console.log("\nSide-view silhouette (z=" + zMid + ", #=inside):");
  for (let y = RES - 1; y >= 0; y--) {
    let row = "";
    for (let x = 0; x < RES; x++) {
      row += isInside(data, x, y, zMid) ? "#" : ".";
    }
    if (row.includes("#")) console.log(row);
  }

  if (warnings.length) {
    console.warn("\nWarnings:");
    for (const w of warnings) console.warn("  -", w);
    // Fail only on structural issues (too few voxels or extreme bloat), not placeholder fatness.
    const fatal = warnings.some((w) => w.includes("Too few") || w.includes("too bloated") || w.includes("Waist seam"));
    return !fatal;
  }

  console.log("\nValidation OK.");
  return true;
}

const path =
  process.argv[2] || join(ROOT, "assets", "images", "volumes", "monkey_64.ktx2");
const ok = validate(path);
process.exit(ok ? 0 : 1);
