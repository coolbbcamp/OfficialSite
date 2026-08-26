/**
 * Funding text mesh utilities: procedural 3D letters, igloo-format Draco encode, cyan ice bake.
 */
import { readFileSync, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import sharp from "sharp";
import { generatePlanarUVs, toKtx2 } from "./monkey-utils.mjs";
import { lines } from "./content/funding-text.mjs";

const require = createRequire(import.meta.url);
const draco3d = require("draco3d");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const MODEL_DIR = join(ROOT, "models", "funding-text");
export const FUNDING_GLB = join(MODEL_DIR, "funding_text.glb");
export const IGLOO_DRC = join(ROOT, "assets", "geometries", "igloo.drc");

const FONT_URL =
  "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/fonts/helvetiker_bold.typeface.json";

const IGLOO_INFO = {
  type: 0,
  attributes: [
    ["position", 7],
    ["normal", 7],
    ["uv", 7],
    ["centr", 7],
    ["rand", 7],
    ["emission", 7],
    ["batchId", 5],
  ],
};

export async function getIglooBounds() {
  const decoderModule = await draco3d.createDecoderModule({});
  const raw = readFileSync(IGLOO_DRC);
  const buffer = new decoderModule.DecoderBuffer();
  buffer.Init(new Int8Array(raw), raw.byteLength);
  const decoder = new decoderModule.Decoder();
  const mesh = new decoderModule.Mesh();
  const ok = decoder.DecodeBufferToMesh(buffer, mesh);
  if (!ok.ok()) throw new Error("Failed to decode igloo.drc reference");

  const posAttr = decoder.GetAttributeByUniqueId(mesh, 0);
  const posData = new decoderModule.DracoFloat32Array();
  decoder.GetAttributeFloatForAllPoints(mesh, posAttr, posData);
  const n = mesh.num_points();
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < n; i++) {
    const x = posData.GetValue(i * 3);
    const y = posData.GetValue(i * 3 + 1);
    const z = posData.GetValue(i * 3 + 2);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  }
  return {
    min: new THREE.Vector3(minX, minY, minZ),
    max: new THREE.Vector3(maxX, maxY, maxZ),
    size: new THREE.Vector3(maxX - minX, maxY - minY, maxZ - minZ),
  };
}

async function loadFont() {
  const res = await fetch(FONT_URL);
  if (!res.ok) throw new Error(`Failed to fetch font: ${res.status}`);
  const json = await res.json();
  const loader = new FontLoader();
  return loader.parse(json);
}

function textOpts(font, size) {
  return {
    font,
    size,
    depth: size * 0.55,
    curveSegments: 6,
    bevelEnabled: true,
    bevelThickness: size * 0.06,
    bevelSize: size * 0.035,
    bevelSegments: 2,
  };
}

function measureLine(font, text, size) {
  const geo = new TextGeometry(text, textOpts(font, size));
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  geo.dispose();
  return {
    width: bb.max.x - bb.min.x,
    height: bb.max.y - bb.min.y,
    minY: bb.min.y,
    maxY: bb.max.y,
  };
}

/**
 * Build one mesh geometry per letter (spaces skipped) arranged in three lines.
 */
export function buildFundingTextPieces(font, size = 0.55) {
  const lineGap = size * 0.55;
  const letterGap = size * 0.08;
  const lineMetrics = lines.map((line) => measureLine(font, line, size));
  const maxLineWidth = Math.max(...lineMetrics.map((m) => m.width));

  const pieces = [];
  let batchId = 0;
  let yCursor = 0;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const metrics = lineMetrics[lineIdx];
    let x = (maxLineWidth - metrics.width) / 2;

    for (const char of line) {
      if (char === " ") {
        x += size * 0.38;
        continue;
      }

      const geo = new TextGeometry(char, textOpts(font, size));
      geo.computeBoundingBox();
      const bb = geo.boundingBox;
      const charWidth = bb.max.x - bb.min.x;

      geo.translate(x - bb.min.x, yCursor - bb.min.y, -bb.min.z);
      pieces.push({ name: `letter_${batchId}_${char}`, geometry: geo, batchId });
      batchId++;
      x += charWidth + letterGap;
    }

    yCursor -= metrics.height + lineGap;
  }

  return pieces;
}

export function fitPiecesToIgloo(pieces, iglooBounds) {
  const group = new THREE.Group();
  for (const piece of pieces) {
    const mesh = new THREE.Mesh(piece.geometry);
    group.add(mesh);
  }

  const box = new THREE.Box3().setFromObject(group);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const target = iglooBounds.size.clone();
  target.multiplyScalar(0.88);
  const scale = Math.min(
    target.x / (size.x || 1),
    target.y / (size.y || 1),
    target.z / (size.z || 1),
  );

  for (const piece of pieces) {
    piece.geometry.translate(-center.x, -box.min.y, -center.z);
    piece.geometry.scale(scale, scale, scale);
  }

  const fitted = new THREE.Box3();
  for (const piece of pieces) {
    piece.geometry.computeBoundingBox();
    fitted.union(piece.geometry.boundingBox);
  }

  const yShift = iglooBounds.min.y - fitted.min.y;
  for (const piece of pieces) {
    piece.geometry.translate(0, yShift, 0);
  }
}

function preparePieceGeometry(geometry, batchId) {
  geometry.computeBoundingBox();
  const centroid = new THREE.Vector3();
  geometry.boundingBox.getCenter(centroid);

  const pos = geometry.attributes.position;
  const count = pos.count;
  const centr = new Float32Array(count * 3);
  const rand = new Float32Array(count * 3);
  const emission = new Float32Array(count);
  const batch = new Uint32Array(count);

  const randVec = new THREE.Vector3(
    Math.random(),
    Math.random(),
    Math.random(),
  );

  for (let i = 0; i < count; i++) {
    centr[i * 3] = centroid.x;
    centr[i * 3 + 1] = centroid.y;
    centr[i * 3 + 2] = centroid.z;
    rand[i * 3] = randVec.x;
    rand[i * 3 + 1] = randVec.y;
    rand[i * 3 + 2] = randVec.z;
    emission[i] = 0.82 + Math.random() * 0.18;
    batch[i] = batchId;
  }

  geometry.setAttribute("centr", new THREE.BufferAttribute(centr, 3));
  geometry.setAttribute("rand", new THREE.BufferAttribute(rand, 3));
  geometry.setAttribute("emission", new THREE.BufferAttribute(emission, 1));
  geometry.setAttribute("batchId", new THREE.BufferAttribute(batch, 1));

  if (!geometry.attributes.normal) geometry.computeVertexNormals();
  if (!geometry.attributes.uv) generatePlanarUVs(geometry);

  return geometry;
}

export function piecesToBatchedGeometry(pieces) {
  const prepared = pieces.map((p) => preparePieceGeometry(p.geometry, p.batchId));
  const merged = mergeGeometries(prepared, true);
  if (!merged) throw new Error("Failed to merge letter geometries");
  merged.computeBoundingBox();
  return merged;
}

export async function loadGlbPieces(glbPath) {
  if (!existsSync(glbPath)) throw new Error(`GLB not found: ${glbPath}`);
  const buf = readFileSync(glbPath);
  const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const loader = new GLTFLoader();
  const gltf = await loader.parseAsync(arrayBuffer, glbPath);
  gltf.scene.updateMatrixWorld(true);

  const pieces = [];
  let batchId = 0;
  gltf.scene.traverse((child) => {
    if (!child.isMesh) return;
    const g = child.geometry.clone();
    g.applyMatrix4(child.matrixWorld);
    pieces.push({ name: child.name || `piece_${batchId}`, geometry: g, batchId });
    batchId++;
  });

  if (pieces.length === 0) throw new Error(`No meshes in GLB: ${glbPath}`);
  return pieces;
}

function barycentric(px, py, a, b, c) {
  const v0x = c.x - a.x, v0y = c.y - a.y;
  const v1x = b.x - a.x, v1y = b.y - a.y;
  const v2x = px - a.x, v2y = py - a.y;
  const dot00 = v0x * v0x + v0y * v0y;
  const dot01 = v0x * v1x + v0y * v1y;
  const dot02 = v0x * v2x + v0y * v2y;
  const dot11 = v1x * v1x + v1y * v1y;
  const dot12 = v1x * v2x + v1y * v2y;
  const inv = 1 / (dot00 * dot11 - dot01 * dot01);
  const u = (dot11 * dot02 - dot01 * dot12) * inv;
  const v = (dot00 * dot12 - dot01 * dot02) * inv;
  return new THREE.Vector3(1 - u - v, v, u);
}

function hash(n) {
  const s = Math.sin(n) * 43758.5453;
  return s - Math.floor(s);
}

export function bakeCyanIceTexture(geometry, size, { dark = false } = {}) {
  const pos = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  const index = geometry.index;
  const data = new Uint8Array(size * size * 4);
  const light = new THREE.Vector3(0.35, 0.85, 0.6).normalize();
  const light2 = new THREE.Vector3(-0.5, 0.3, -0.4).normalize();

  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();
  const uvA = new THREE.Vector2();
  const uvB = new THREE.Vector2();
  const uvC = new THREE.Vector2();
  const edge1 = new THREE.Vector3();
  const edge2 = new THREE.Vector3();
  const normal = new THREE.Vector3();

  const hi = dark ? [0.05, 0.55, 0.72] : [0.35, 0.95, 1.0];
  const lo = dark ? [0.0, 0.12, 0.22] : [0.0, 0.35, 0.52];

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
        const w = barycentric(u, v, uvA, uvB, uvC);
        if (w.x < 0 || w.y < 0 || w.z < 0) continue;

        const p = new THREE.Vector3()
          .addScaledVector(vA, w.x)
          .addScaledVector(vB, w.y)
          .addScaledVector(vC, w.z);

        const lambert =
          Math.max(0, normal.dot(light)) * 0.65 + Math.max(0, normal.dot(light2)) * 0.35;
        const heightShade = THREE.MathUtils.clamp(p.y * 0.28 + 0.58, 0, 1);
        const shade = THREE.MathUtils.clamp(lambert * 0.72 + heightShade * 0.28, 0, 1);

        const r = lo[0] + (hi[0] - lo[0]) * shade;
        const g = lo[1] + (hi[1] - lo[1]) * shade;
        const b = lo[2] + (hi[2] - lo[2]) * shade;
        const noise = hash(px * 12.9898 + py * 78.233) * 0.07;
        const idx = (py * size + px) * 4;
        data[idx] = Math.round(THREE.MathUtils.clamp((r + noise) * 255, 0, 255));
        data[idx + 1] = Math.round(THREE.MathUtils.clamp((g + noise) * 255, 0, 255));
        data[idx + 2] = Math.round(THREE.MathUtils.clamp((b + noise * 0.5) * 255, 0, 255));
        data[idx + 3] = 255;
      }
    }
  }

  return data;
}

export function encodeIglooGeometryToDrc(geometry, encoderModule) {
  const required = ["position", "normal", "uv", "centr", "rand", "emission", "batchId"];
  for (const name of required) {
    if (!geometry.attributes[name]) throw new Error(`Missing attribute: ${name}`);
  }

  const pos = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  const uv = geometry.attributes.uv;
  const centr = geometry.attributes.centr;
  const rand = geometry.attributes.rand;
  const emission = geometry.attributes.emission;
  const batchId = geometry.attributes.batchId;
  const index = geometry.index;

  const encoder = new encoderModule.Encoder();
  const meshBuilder = new encoderModule.MeshBuilder();
  const mesh = new encoderModule.Mesh();
  const n = pos.count;

  meshBuilder.AddFloatAttributeToMesh(mesh, encoderModule.POSITION, n, 3, pos.array);
  meshBuilder.AddFloatAttributeToMesh(mesh, encoderModule.NORMAL, n, 3, normal.array);
  meshBuilder.AddFloatAttributeToMesh(mesh, encoderModule.TEX_COORD, n, 2, uv.array);
  meshBuilder.AddFloatAttributeToMesh(mesh, encoderModule.GENERIC, n, 3, centr.array);
  meshBuilder.AddFloatAttributeToMesh(mesh, encoderModule.GENERIC, n, 3, rand.array);
  meshBuilder.AddFloatAttributeToMesh(mesh, encoderModule.GENERIC, n, 1, emission.array);
  const batchFloat = new Float32Array(batchId.array);
  meshBuilder.AddFloatAttributeToMesh(mesh, encoderModule.GENERIC, n, 1, batchFloat);

  if (index) {
    meshBuilder.AddFacesToMesh(mesh, index.count / 3, index.array);
  } else {
    const indices = new Uint32Array(n);
    for (let i = 0; i < n; i++) indices[i] = i;
    meshBuilder.AddFacesToMesh(mesh, Math.floor(n / 3), indices.subarray(0, Math.floor(n / 3) * 3));
  }

  const metadataBuilder = new encoderModule.MetadataBuilder();
  const metadata = new encoderModule.Metadata();
  metadataBuilder.AddStringEntry(metadata, "info", JSON.stringify(IGLOO_INFO));
  meshBuilder.AddMetadataToMesh(mesh, metadata);

  encoder.SetSpeedOptions(5, 5);
  encoder.SetAttributeQuantization(encoderModule.POSITION, 14);
  encoder.SetAttributeQuantization(encoderModule.NORMAL, 10);
  encoder.SetAttributeQuantization(encoderModule.TEX_COORD, 12);
  encoder.SetAttributeQuantization(encoderModule.GENERIC, 12);
  encoder.SetEncodingMethod(encoderModule.MESH_EDGEBREAKER_ENCODING);

  const encoded = new encoderModule.DracoInt8Array();
  const len = encoder.EncodeMeshToDracoBuffer(mesh, encoded);
  if (len <= 0) throw new Error("Draco encoding failed");

  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) out[i] = encoded.GetValue(i);

  encoderModule.destroy(encoded);
  encoderModule.destroy(mesh);
  encoderModule.destroy(encoder);
  encoderModule.destroy(meshBuilder);
  encoderModule.destroy(metadata);
  encoderModule.destroy(metadataBuilder);

  return out;
}

export async function exportPiecesToGlb(pieces, outPath) {
  if (typeof globalThis.FileReader === "undefined") {
    globalThis.FileReader = class {
      constructor() {
        this.result = null;
        this.onloadend = null;
      }
      readAsArrayBuffer(blob) {
        Promise.resolve(blob.arrayBuffer()).then((buf) => {
          this.result = buf;
          if (this.onloadend) this.onloadend();
        });
      }
    };
  }

  const group = new THREE.Group();
  for (const piece of pieces) {
    const mesh = new THREE.Mesh(
      piece.geometry,
      new THREE.MeshStandardMaterial({ color: 0x00e5ff }),
    );
    mesh.name = piece.name;
    group.add(mesh);
  }

  const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");
  const exporter = new GLTFExporter();
  const buffer = await exporter.parseAsync(group, { binary: true });
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, Buffer.from(buffer));
}

export async function generateFundingTextGlb(outPath = FUNDING_GLB) {
  const font = await loadFont();
  const iglooBounds = await getIglooBounds();
  const pieces = buildFundingTextPieces(font);
  fitPiecesToIgloo(pieces, iglooBounds);
  await exportPiecesToGlb(pieces, outPath);
  return pieces;
}

export async function bakeAndEncodeFundingText(pieces) {
  const geometry = piecesToBatchedGeometry(pieces);
  const iglooBounds = await getIglooBounds();
  geometry.computeBoundingBox();
  console.log("Funding text bounds:", geometry.boundingBox.min, geometry.boundingBox.max);
  console.log("Igloo reference bounds:", iglooBounds.min, iglooBounds.max);

  const size = 1024;
  const colorData = bakeCyanIceTexture(geometry, size, { dark: false });
  const darkData = bakeCyanIceTexture(geometry, size, { dark: true });

  await mkdir(MODEL_DIR, { recursive: true });
  const colorPng = join(MODEL_DIR, "funding_text_color.png");
  const darkPng = join(MODEL_DIR, "funding_text_exploded_color.png");
  await sharp(colorData, { raw: { width: size, height: size, channels: 4 } }).png().toFile(colorPng);
  await sharp(darkData, { raw: { width: size, height: size, channels: 4 } }).png().toFile(darkPng);

  const encoderModule = await draco3d.createEncoderModule({});
  const drc = encodeIglooGeometryToDrc(geometry, encoderModule);

  const ASSETS = join(ROOT, "assets");
  await mkdir(join(ASSETS, "geometries"), { recursive: true });
  await mkdir(join(ASSETS, "images", "igloo"), { recursive: true });

  await writeFile(join(ASSETS, "geometries", "funding_text.drc"), drc);
  await toKtx2(colorPng, join(ASSETS, "images", "igloo", "funding_text_color.ktx2"));
  await toKtx2(darkPng, join(ASSETS, "images", "igloo", "funding_text_exploded_color.ktx2"));

  console.log(`OK geometries/funding_text.drc (${drc.byteLength} bytes)`);
  console.log("OK images/igloo/funding_text_color.ktx2");
  console.log("OK images/igloo/funding_text_exploded_color.ktx2");

  return { geometry, pieceCount: pieces.length };
}
