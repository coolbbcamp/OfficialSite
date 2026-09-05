/**
 * Import models/bull.glb → bull.drc + holographic KTX2 (same pipeline as monkey/roblox).
 * Usage: node scripts/import-bull-from-glb.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import sharp from "sharp";
import {
  bakeTexture,
  centerAndScale,
  encodeGeometryToDrc,
  generatePlanarUVs,
  getPudgyHeight,
  loadGlbGeometry,
  toKtx2,
} from "./monkey-utils.mjs";

const require = createRequire(import.meta.url);
const draco3d = require("draco3d");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS = join(ROOT, "assets");
const GLB = join(ROOT, "models", "bull.glb");
const MODEL_DIR = join(ROOT, "models", "bull");
const TEX_SIZE = 1024;

async function main() {
  console.log(`Loading ${GLB}...`);
  const geometry = await loadGlbGeometry(GLB);

  if (!geometry.attributes.uv) {
    console.warn("No UVs on bull mesh — generating planar UVs.");
    generatePlanarUVs(geometry);
  }

  const targetHeight = await getPudgyHeight();
  centerAndScale(geometry, targetHeight);

  await mkdir(MODEL_DIR, { recursive: true });
  const colorData = bakeTexture(geometry, TEX_SIZE, { dark: false });
  const darkData = bakeTexture(geometry, TEX_SIZE, { dark: true });

  const colorPng = join(MODEL_DIR, "bull_color.png");
  const darkPng = join(MODEL_DIR, "bull_dark.png");

  await sharp(colorData, { raw: { width: TEX_SIZE, height: TEX_SIZE, channels: 4 } })
    .png()
    .toFile(colorPng);
  await sharp(darkData, { raw: { width: TEX_SIZE, height: TEX_SIZE, channels: 4 } })
    .png()
    .toFile(darkPng);
  console.log("OK models/bull/bull_color.png + bull_dark.png");

  console.log("Encoding Draco geometry...");
  const encoderModule = await draco3d.createEncoderModule({});
  const drc = encodeGeometryToDrc(geometry, encoderModule);

  await mkdir(join(ASSETS, "geometries"), { recursive: true });
  await mkdir(join(ASSETS, "images", "cubes"), { recursive: true });
  await mkdir(join(ASSETS, "images"), { recursive: true });

  await writeFile(join(ASSETS, "geometries", "bull.drc"), drc);
  console.log(`OK geometries/bull.drc (${drc.byteLength} bytes)`);

  console.log("Encoding KTX2 textures...");
  await toKtx2(colorPng, join(ASSETS, "images", "cubes", "bull_color.ktx2"));
  console.log("OK images/cubes/bull_color.ktx2");
  await toKtx2(darkPng, join(ASSETS, "images", "bull_dark_color.ktx2"));
  console.log("OK images/bull_dark_color.ktx2");

  geometry.computeBoundingBox();
  console.log("Display bounds:", geometry.boundingBox.min, geometry.boundingBox.max);
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
