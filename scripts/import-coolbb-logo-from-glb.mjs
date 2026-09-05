/**
 * Import models/CoolBB.glb → coolbb.drc + holographic KTX2 (same pipeline as grok/roblox).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import * as THREE from "three";
import sharp from "sharp";
import {
  bakeTexture,
  centerAndScale,
  encodeGeometryToDrc,
  generatePlanarUVs,
  getPudgyHeight,
  loadGlbGeometry,
  normalizeLogoForUiSlot,
  simplifyGeometry,
  toKtx2,
} from "./monkey-utils.mjs";

const require = createRequire(import.meta.url);
const draco3d = require("draco3d");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS = join(ROOT, "assets");
const GLB = join(ROOT, "models", "CoolBB.glb");
const MODEL_DIR = join(ROOT, "models", "coolbb");
const TEX_SIZE = 1024;
/** Screen height / width for the top-left logo slot (matches original MSDF). */
export const LOGO_HEIGHT_RATIO = 0.21;

async function main() {
  console.log(`Loading ${GLB}...`);
  let geometry = await loadGlbGeometry(GLB);

  if (!geometry.attributes.uv) {
    console.warn("No UVs on coolbb mesh — generating planar UVs.");
    generatePlanarUVs(geometry);
  }

  const targetHeight = await getPudgyHeight();
  centerAndScale(geometry, targetHeight);

  const before = geometry.index.count / 3;
  geometry = await simplifyGeometry(geometry, 10000);
  const after = geometry.index.count / 3;
  console.log(`OK simplified ${Math.round(before)} → ${Math.round(after)} triangles`);

  const aspect = normalizeLogoForUiSlot(geometry);

  await mkdir(MODEL_DIR, { recursive: true });
  const colorData = bakeTexture(geometry, TEX_SIZE, { dark: false });
  const darkData = bakeTexture(geometry, TEX_SIZE, { dark: true });

  const colorPng = join(MODEL_DIR, "coolbb_color.png");
  const darkPng = join(MODEL_DIR, "coolbb_dark.png");

  await sharp(colorData, { raw: { width: TEX_SIZE, height: TEX_SIZE, channels: 4 } })
    .png()
    .toFile(colorPng);
  await sharp(darkData, { raw: { width: TEX_SIZE, height: TEX_SIZE, channels: 4 } })
    .png()
    .toFile(darkPng);
  console.log("OK models/coolbb/coolbb_color.png + coolbb_dark.png");

  const encoderModule = await draco3d.createEncoderModule({});
  const drc = encodeGeometryToDrc(geometry, encoderModule);

  await mkdir(join(ASSETS, "geometries"), { recursive: true });
  await mkdir(join(ASSETS, "images", "cubes"), { recursive: true });
  await mkdir(join(ASSETS, "images"), { recursive: true });

  await writeFile(join(ASSETS, "geometries", "coolbb.drc"), drc);
  console.log(`OK geometries/coolbb.drc (${drc.byteLength} bytes)`);

  await toKtx2(colorPng, join(ASSETS, "images", "cubes", "coolbb_color.ktx2"));
  console.log("OK images/cubes/coolbb_color.ktx2");
  await toKtx2(darkPng, join(ASSETS, "images", "coolbb_dark_color.ktx2"));
  console.log("OK images/coolbb_dark_color.ktx2");

  await writeFile(join(MODEL_DIR, "aspect.json"), JSON.stringify(aspect, null, 2) + "\n");
  console.log("OK models/coolbb/aspect.json", aspect);
  console.log("Bounds:", geometry.boundingBox.min, geometry.boundingBox.max);
}

const isMain =
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}