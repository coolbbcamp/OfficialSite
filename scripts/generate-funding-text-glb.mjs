/**
 * Generate models/funding-text/funding_text.glb — per-letter extruded 3-line text.
 * Usage: node scripts/generate-funding-text-glb.mjs [--force]
 */
import { existsSync } from "node:fs";
import { FUNDING_GLB, generateFundingTextGlb } from "./funding-text-utils.mjs";

const force = process.argv.includes("--force");

async function main() {
  if (!force && existsSync(FUNDING_GLB)) {
    console.log("funding_text.glb already exists — skipping (use --force to regenerate).");
    return;
  }

  const pieces = await generateFundingTextGlb();
  console.log(`OK ${FUNDING_GLB} (${pieces.length} letter pieces)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
