/**
 * Import Blender monkey_display.glb → monkey.drc + holographic KTX2 textures.
 *
 * Prerequisites: models/monkey/monkey_display.glb (export from Blender or placeholder script)
 * Usage: node scripts/import-monkey-from-glb.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import sharp from "sharp";
import {
  MODEL_DIR,
  bakeTexture,
  centerAndScale,
  encodeGeometryToDrc,
  generatePlanarUVs,
  getPudgyHeight,
  loadGlbGeometry,
  resolveDisplayGlb,
  toKtx2,
} from "./monkey-utils.mjs";

const require = createRequire(import.meta.url);
const draco3d = require("draco3d");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS = join(ROOT, "assets");

async function main() {
  const displayPath = resolveDisplayGlb();
  console.log(`Loading ${displayPath}...`);
  const geometry = await loadGlbGeometry(displayPath);

  const targetHeight = await getPudgyHeight();
  centerAndScale(geometry, targetHeight);

  if (!geometry.attributes.uv) {
    console.warn("No UVs on display mesh — generating planar UVs (prefer UV unwrap in Blender).");
    generatePlanarUVs(geometry);
  }

  await mkdir(MODEL_DIR, { recursive: true });
  const size = 1024;
  const colorData = bakeTexture(geometry, size, { dark: false });
  const darkData = bakeTexture(geometry, size, { dark: true });

  const colorPng = join(MODEL_DIR, "monkey_color.png");
  const darkPng = join(MODEL_DIR, "monkey_dark.png");

  await sharp(colorData, { raw: { width: size, height: size, channels: 4 } }).png().toFile(colorPng);
  await sharp(darkData, { raw: { width: size, height: size, channels: 4 } }).png().toFile(darkPng);
  console.log("OK models/monkey/monkey_color.png + monkey_dark.png");

  console.log("Encoding Draco geometry...");
  const encoderModule = await draco3d.createEncoderModule({});
  const drc = encodeGeometryToDrc(geometry, encoderModule);

  await mkdir(join(ASSETS, "geometries"), { recursive: true });
  await mkdir(join(ASSETS, "images", "cubes"), { recursive: true });
  await mkdir(join(ASSETS, "images"), { recursive: true });

  await writeFile(join(ASSETS, "geometries", "monkey.drc"), drc);
  console.log(`OK geometries/monkey.drc (${drc.byteLength} bytes)`);

  console.log("Encoding KTX2 textures...");
  await toKtx2(colorPng, join(ASSETS, "images", "cubes", "monkey_color.ktx2"));
  console.log("OK images/cubes/monkey_color.ktx2");
  await toKtx2(darkPng, join(ASSETS, "images", "monkey_dark_color.ktx2"));
  console.log("OK images/monkey_dark_color.ktx2");

  geometry.computeBoundingBox();
  console.log("Display bounds:", geometry.boundingBox.min, geometry.boundingBox.max);
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
