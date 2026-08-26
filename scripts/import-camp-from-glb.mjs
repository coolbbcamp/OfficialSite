/**
 * Import models/scene-text/camp.glb → ground_camp_text.drc + snow KTX2.
 */
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { campGlb } from "./content/scene-text.mjs";
import { importCampGlbAssets } from "./scene-text-utils.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const glbPath = join(ROOT, campGlb);

if (!existsSync(glbPath)) {
  console.error(`Missing ${campGlb}`);
  process.exit(1);
}

importCampGlbAssets(glbPath).catch((e) => {
  console.error(e);
  process.exit(1);
});
