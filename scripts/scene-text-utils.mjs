/**
 * Flat ground-camp 3D text → simple Draco + snow-ice KTX2.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import sharp from "sharp";
import { encodeGeometryToDrc, bakeTexture, generatePlanarUVs, loadGlbGeometry, toKtx2 } from "./monkey-utils.mjs";
import { campGlb, groundLines, targetGroundHeight } from "./content/scene-text.mjs";

const require = createRequire(import.meta.url);
const draco3d = require("draco3d");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FONT_URL =
  "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/fonts/helvetiker_bold.typeface.json";

async function loadFont() {
  const res = await fetch(FONT_URL);
  if (!res.ok) throw new Error(`Failed to fetch font: ${res.status}`);
  const loader = new FontLoader();
  return loader.parse(await res.json());
}

function flatTextOpts(font, size) {
  return {
    font,
    size,
    depth: size * 0.09,
    curveSegments: 5,
    bevelEnabled: true,
    bevelThickness: size * 0.022,
    bevelSize: size * 0.018,
    bevelSegments: 1,
  };
}

function measureLine(font, text, size) {
  const geo = new TextGeometry(text, flatTextOpts(font, size));
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  geo.dispose();
  return { width: bb.max.x - bb.min.x, height: bb.max.y - bb.min.y, minY: bb.min.y };
}

export function buildGroundCampGeometry(font) {
  const lineGap = 0.2;
  const geos = [];
  let yCursor = 0;
  const metrics = groundLines.map(({ text, size }) => measureLine(font, text, size));
  const maxWidth = Math.max(...metrics.map((m) => m.width));

  for (let i = 0; i < groundLines.length; i++) {
    const { text, size } = groundLines[i];
    const m = metrics[i];
    const geo = new TextGeometry(text, flatTextOpts(font, size));
    geo.computeBoundingBox();
    const bb = geo.boundingBox;
    const x = (maxWidth - (bb.max.x - bb.min.x)) / 2;
    geo.translate(x - bb.min.x, yCursor - bb.min.y, -bb.min.z);
    geos.push(geo);
    yCursor -= m.height + lineGap;
  }

  const merged = mergeGeometries(geos, true);
  geos.forEach((g) => g.dispose());
  if (!merged) throw new Error("Failed to merge ground camp text");

  merged.rotateX(-Math.PI / 2);
  merged.computeBoundingBox();
  const box = merged.boundingBox;
  const center = new THREE.Vector3();
  box.getCenter(center);
  merged.translate(-center.x, -box.min.y, -center.z);

  const width = box.max.x - box.min.x;
  const targetWidth = targetGroundHeight * 2;
  const scale = targetWidth / width;
  merged.scale(scale, scale, scale);
  merged.computeBoundingBox();

  if (!merged.attributes.normal) merged.computeVertexNormals();
  generateGroundPlanarUVs(merged);

  return merged;
}

/** Planar UVs on XZ after rotateX(-PI/2) — standard planar XY would collapse to text thickness. */
function generateGroundPlanarUVs(geometry) {
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox;
  const pos = geometry.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  const sx = bb.max.x - bb.min.x || 1;
  const sz = bb.max.z - bb.min.z || 1;
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) - bb.min.x) / sx;
    uv[i * 2 + 1] = (pos.getZ(i) - bb.min.z) / sz;
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

function bakeSnowIceTexture(geometry, size) {
  const pos = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  const index = geometry.index;
  const data = new Uint8Array(size * size * 4);
  const light = new THREE.Vector3(0.4, 1.0, 0.35).normalize();
  const light2 = new THREE.Vector3(-0.45, 0.25, -0.35).normalize();

  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();
  const uvA = new THREE.Vector2();
  const uvB = new THREE.Vector2();
  const uvC = new THREE.Vector2();
  const edge1 = new THREE.Vector3();
  const edge2 = new THREE.Vector3();
  const normal = new THREE.Vector3();

  const hi = [0.95, 0.99, 1.0];
  const lo = [0.78, 0.9, 0.98];
  const triCount = index ? index.count / 3 : pos.count / 3;

  for (let t = 0; t < triCount; t++) {
    const i0 = index ? index.getX(t * 3) : t * 3;
    const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;

    vA.fromBufferAttribute(pos, i0);
    vB.fromBufferAttribute(pos, i1);
    vC.fromBufferAttribute(pos, i2);
    uvA.fromBufferAttribute(uv, i0);
    uvB.fromBufferAttribute(uv, i1);
    uvC.fromBufferAttribute(uv, i2);

    edge1.subVectors(vB, vA);
    edge2.subVectors(vC, vA);
    normal.crossVectors(edge1, edge2).normalize();

    const lambert =
      Math.max(0, normal.dot(light)) * 0.7 + Math.max(0, normal.dot(light2)) * 0.3;
    const heightShade = THREE.MathUtils.clamp(vA.y * 0.15 + vB.y * 0.15 + vC.y * 0.15 + 0.55, 0, 1);
    const shade = THREE.MathUtils.clamp(lambert * 0.65 + heightShade * 0.35, 0, 1);

    const minU = Math.min(uvA.x, uvB.x, uvC.x);
    const maxU = Math.max(uvA.x, uvB.x, uvC.x);
    const minV = Math.min(uvA.y, uvB.y, uvC.y);
    const maxV = Math.max(uvA.y, uvB.y, uvC.y);
    const x0 = Math.max(0, Math.floor(minU * size));
    const x1 = Math.min(size - 1, Math.ceil(maxU * size));
    const y0 = Math.max(0, Math.floor((1 - maxV) * size));
    const y1 = Math.min(size - 1, Math.ceil((1 - minV) * size));

    for (let py = y0; py <= y1; py++) {
      for (let px = x0; px <= x1; px++) {
        const u = (px + 0.5) / size;
        const v = 1 - (py + 0.5) / size;
        const wA = (u - uvB.x) * (uvC.y - uvB.y) - (v - uvB.y) * (uvC.x - uvB.x);
        const wB = (u - uvC.x) * (uvA.y - uvC.y) - (v - uvC.y) * (uvA.x - uvC.x);
        const wC = (u - uvA.x) * (uvB.y - uvA.y) - (v - uvA.y) * (uvB.x - uvA.x);
        if (wA < 0 || wB < 0 || wC < 0) continue;

        const r = lo[0] + (hi[0] - lo[0]) * shade;
        const g = lo[1] + (hi[1] - lo[1]) * shade;
        const b = lo[2] + (hi[2] - lo[2]) * shade;
        const idx = (py * size + px) * 4;
        data[idx] = Math.round(r * 255);
        data[idx + 1] = Math.round(g * 255);
        data[idx + 2] = Math.round(b * 255);
        data[idx + 3] = 255;
      }
    }
  }

  return data;
}

/** Lay Meshy GLB flat on snow, scale to readable width, face igloo camera. */
export async function prepareCampGeometryFromGlb(glbPath = join(ROOT, campGlb)) {
  const geometry = await loadGlbGeometry(glbPath);
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox;
  const center = new THREE.Vector3();
  bb.getCenter(center);
  geometry.translate(-center.x, -bb.min.y, -center.z);

  // Letters stand in Y in the GLB — lay them flat on the ground plane.
  geometry.rotateX(-Math.PI / 2);
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  geometry.translate(0, -box.min.y, 0);

  const width = Math.max(box.max.x - box.min.x, box.max.z - box.min.z);
  const targetWidth = targetGroundHeight * 2;
  const scale = targetWidth / width;
  geometry.scale(scale, scale, scale);
  geometry.rotateY(Math.PI * 0.25);

  geometry.computeBoundingBox();
  const finalBox = geometry.boundingBox;
  geometry.translate(
    -(finalBox.min.x + finalBox.max.x) / 2,
    -finalBox.min.y,
    -(finalBox.min.z + finalBox.max.z) / 2,
  );

  geometry.computeBoundingBox();
  if (!geometry.attributes.normal) geometry.computeVertexNormals();
  generateGroundPlanarUVs(geometry);
  return geometry;
}

async function writeGroundCampAssets(geometry, { snowIce = true } = {}) {
  geometry.computeBoundingBox();
  console.log("Ground camp bounds:", geometry.boundingBox.min, geometry.boundingBox.max);

  const texSize = 1024;
  const colorData = snowIce ? bakeSnowIceTexture(geometry, texSize) : bakeTexture(geometry, texSize);
  const colorPng = join(ROOT, "models", "scene-text", "ground_camp_color.png");
  await mkdir(dirname(colorPng), { recursive: true });
  await sharp(colorData, { raw: { width: texSize, height: texSize, channels: 4 } })
    .png()
    .toFile(colorPng);

  const encoderModule = await draco3d.createEncoderModule({});
  const drc = encodeGeometryToDrc(geometry, encoderModule);

  const geoOut = join(ROOT, "assets", "geometries", "ground_camp_text.drc");
  const ktx2Out = join(ROOT, "assets", "images", "igloo", "ground_camp_text_color.ktx2");
  await mkdir(join(ROOT, "assets", "geometries"), { recursive: true });
  await mkdir(join(ROOT, "assets", "images", "igloo"), { recursive: true });
  await writeFile(geoOut, drc);
  await toKtx2(colorPng, ktx2Out);

  console.log(`OK ${geoOut} (${drc.byteLength} bytes)`);
  console.log(`OK ${ktx2Out}`);
  return { geoOut, ktx2Out };
}

export async function importCampGlbAssets(glbPath = join(ROOT, campGlb)) {
  console.log(`Importing ${glbPath}...`);
  const geometry = await prepareCampGeometryFromGlb(glbPath);
  return writeGroundCampAssets(geometry, { snowIce: true });
}

export async function generateGroundCampAssets() {
  const font = await loadFont();
  const geometry = buildGroundCampGeometry(font);
  return writeGroundCampAssets(geometry);
}
