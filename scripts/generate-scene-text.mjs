/**
 * Bake camp.glb → ground_camp_text.drc + snow KTX2 for the igloo scene.
 */
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { campGlb } from "./content/scene-text.mjs";
import { importCampGlbAssets } from "./scene-text-utils.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(ROOT, campGlb);

if (!existsSync(src)) {
  console.error(`Missing ${src}`);
  process.exit(1);
}

await importCampGlbAssets(src);
