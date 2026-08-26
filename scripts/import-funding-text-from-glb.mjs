/**
 * Import funding text GLB → funding_text.drc + cyan ice KTX2 textures.
 * Usage: node scripts/import-funding-text-from-glb.mjs
 */
import { existsSync } from "node:fs";
import {
  FUNDING_GLB,
  bakeAndEncodeFundingText,
  fitPiecesToIgloo,
  generateFundingTextGlb,
  getIglooBounds,
  loadGlbPieces,
} from "./funding-text-utils.mjs";

async function main() {
  let pieces;
  if (existsSync(FUNDING_GLB)) {
    console.log(`Loading ${FUNDING_GLB}...`);
    pieces = await loadGlbPieces(FUNDING_GLB);
    const iglooBounds = await getIglooBounds();
    fitPiecesToIgloo(pieces, iglooBounds);
    console.log(`Loaded ${pieces.length} mesh pieces from GLB`);
  } else {
    console.log("No GLB found — generating procedural funding text...");
    pieces = await generateFundingTextGlb();
  }

  const { pieceCount } = await bakeAndEncodeFundingText(pieces);
  console.log(`Done — ${pieceCount} animated letter blocks.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
