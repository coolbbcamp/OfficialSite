/**
 * Export placeholder monkey_display.glb + monkey_volume.glb from procedural meshes.
 * Replace these files with Blender exports for the final realistic chimp model.
 *
 * Usage: node scripts/export-monkey-placeholder-glb.mjs [--force]
 */
import { existsSync } from "node:fs";
import { buildMonkeyParts, buildMonkeyVolumeParts } from "./generate-monkey-model.mjs";
import {
  DISPLAY_GLB,
  VOLUME_GLB,
  centerAndScale,
  exportGeometryToGlb,
  getPudgyHeight,
} from "./monkey-utils.mjs";

const force = process.argv.includes("--force");

async function main() {
  if (!force && existsSync(DISPLAY_GLB) && existsSync(VOLUME_GLB)) {
    console.log("monkey_display.glb and monkey_volume.glb already exist — skipping placeholder export.");
    console.log("Delete them or pass --force to regenerate placeholders from procedural meshes.");
    return;
  }

  const targetHeight = await getPudgyHeight();
  console.log(`Exporting placeholder GLBs (target height ${targetHeight.toFixed(3)})...`);
  console.warn(
    "NOTE: These are procedural placeholders. Replace with Blender exports for your realistic chimp.",
  );

  const displayGeo = buildMonkeyParts();
  centerAndScale(displayGeo, targetHeight);
  await exportGeometryToGlb(displayGeo, DISPLAY_GLB, "monkey_display");

  const volumeGeo = buildMonkeyVolumeParts();
  centerAndScale(volumeGeo, targetHeight);
  await exportGeometryToGlb(volumeGeo, VOLUME_GLB, "monkey_volume");

  console.log(`OK ${DISPLAY_GLB}`);
  console.log(`OK ${VOLUME_GLB}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
