/**
 * Shared monkey mesh utilities: GLB load, normalize, texture bake, Draco encode.
 */
import { readFileSync, existsSync } from "node:fs";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import sharp from "sharp";
import { NodeIO } from "@gltf-transform/core";
import { MeshoptSimplifier } from "meshoptimizer";

const require = createRequire(import.meta.url);
const draco3d = require("draco3d");
const basis = require("@gpu-tex-enc/basis");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const MODEL_DIR = join(ROOT, "models", "monkey");
export const PUDGY_DRC = join(ROOT, "assets", "geometries", "pudgy.drc");
export const DISPLAY_GLB = join(MODEL_DIR, "monkey_display.glb");
export const VOLUME_GLB = join(MODEL_DIR, "monkey_volume.glb");
export const MONKEY_GLB = join(MODEL_DIR, "monkey.glb");

/** Prefer monkey.glb (Blender export), then legacy split files. */
export function resolveDisplayGlb() {
  if (existsSync(MONKEY_GLB)) return MONKEY_GLB;
  if (existsSync(DISPLAY_GLB)) return DISPLAY_GLB;
  throw new Error(`No display GLB — add models/monkey/monkey.glb or monkey_display.glb`);
}

export function resolveVolumeGlb() {
  if (existsSync(MONKEY_GLB)) return MONKEY_GLB;
  if (existsSync(VOLUME_GLB)) return VOLUME_GLB;
  throw new Error(`No volume GLB — add models/monkey/monkey.glb or monkey_volume.glb`);
}

export async function decodeDracoBounds(drcPath) {
  const decoderModule = await draco3d.createDecoderModule({});
  const raw = readFileSync(drcPath);
  const buffer = new decoderModule.DecoderBuffer();
  buffer.Init(new Int8Array(raw), raw.byteLength);
  const decoder = new decoderModule.Decoder();
  const mesh = new decoderModule.Mesh();
  const ok = decoder.DecodeBufferToMesh(buffer, mesh);
  if (!ok.ok()) throw new Error("Failed to decode reference drc");

  const posAttr = decoder.GetAttributeByUniqueId(mesh, decoderModule.POSITION);
  const posData = new decoderModule.DracoFloat32Array();
  decoder.GetAttributeFloatForAllPoints(mesh, posAttr, posData);
  const n = mesh.num_points();
  let minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < n; i++) {
    const y = posData.GetValue(i * 3 + 1);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  decoderModule.destroy(posData);
  decoderModule.destroy(mesh);
  decoderModule.destroy(buffer);
  decoderModule.destroy(decoder);
  return { minY, maxY, height: maxY - minY, vertices: n };
}

export async function getPudgyHeight() {
  const ref = await decodeDracoBounds(PUDGY_DRC);
  return ref.height;
}

export function centerAndScale(geometry, targetHeight) {
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox;
  const size = new THREE.Vector3();
  bb.getSize(size);
  const center = new THREE.Vector3();
  bb.getCenter(center);
  geometry.translate(-center.x, -bb.min.y, -center.z);
  const scale = targetHeight / size.y;
  geometry.scale(scale, scale, scale);
  geometry.computeVertexNormals();
  return scale;
}

/** Match MSDF logo plane: 1×1 unit, top-left anchor, Y downward (PlaneGeometry + translate(.5,-.5)). */
export function normalizeLogoForUiSlot(geometry) {
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox;
  const size = new THREE.Vector3();
  bb.getSize(size);
  geometry.translate(size.x / 2, -size.y, 0);
  const sx = 1 / size.x;
  const sy = 1 / size.y;
  geometry.scale(sx, sy, sy);
  geometry.computeBoundingBox();
  geometry.computeVertexNormals();
  return { wordLength: 1, letterHeight: 1, depth: size.z * sy };
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

export function generatePlanarUVs(geometry) {
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox;
  const pos = geometry.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  const sx = bb.max.x - bb.min.x || 1;
  const sy = bb.max.y - bb.min.y || 1;
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) - bb.min.x) / sx;
    uv[i * 2 + 1] = (pos.getY(i) - bb.min.y) / sy;
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

export function bakeTexture(geometry, size, { dark = false, hi, lo } = {}) {
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
  const normal = new THREE.Vector3();
  const edge1 = new THREE.Vector3();
  const edge2 = new THREE.Vector3();

  const defaultHi = dark ? [0.32, 0.45, 0.62] : [0.75, 0.84, 0.96];
  const defaultLo = dark ? [0.06, 0.10, 0.18] : [0.28, 0.38, 0.55];
  const hiColor = hi ?? defaultHi;
  const loColor = lo ?? defaultLo;

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

        const n = normal.clone();
        const lambert = Math.max(0, n.dot(light)) * 0.65 + Math.max(0, n.dot(light2)) * 0.35;
        const heightShade = THREE.MathUtils.clamp(p.y * 0.35 + 0.55, 0, 1);
        const shade = THREE.MathUtils.clamp(lambert * 0.75 + heightShade * 0.25, 0, 1);

        const r = loColor[0] + (hiColor[0] - loColor[0]) * shade;
        const g = loColor[1] + (hiColor[1] - loColor[1]) * shade;
        const b = loColor[2] + (hiColor[2] - loColor[2]) * shade;

        const noise = hash(px * 12.9898 + py * 78.233) * 0.06;
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

function sampleRgba(source, texW, texH, u, v) {
  const fu = Math.max(0, Math.min(0.999999, u));
  const fv = Math.max(0, Math.min(0.999999, 1 - v));
  const x = Math.min(texW - 1, Math.floor(fu * texW));
  const y = Math.min(texH - 1, Math.floor(fv * texH));
  const i = (y * texW + x) * 4;
  return [source[i], source[i + 1], source[i + 2], source[i + 3]];
}

/** Reproject GLB atlas colors onto planar UV layout (for holo/detail with planar mesh UVs). */
export function bakeTextureFromAtlas(geometry, atlasUvArray, source, texW, texH, outSize) {
  const pos = geometry.attributes.position;
  const planarUv = geometry.attributes.uv;
  const index = geometry.index;
  const data = new Uint8Array(outSize * outSize * 4);

  const uvA = new THREE.Vector2();
  const uvB = new THREE.Vector2();
  const uvC = new THREE.Vector2();
  const atlasA = new THREE.Vector2();
  const atlasB = new THREE.Vector2();
  const atlasC = new THREE.Vector2();

  const triCount = index ? index.count / 3 : pos.count / 3;

  for (let t = 0; t < triCount; t++) {
    const i0 = index ? index.getX(t * 3) : t * 3;
    const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;

    uvA.fromBufferAttribute(planarUv, i0);
    uvB.fromBufferAttribute(planarUv, i1);
    uvC.fromBufferAttribute(planarUv, i2);
    atlasA.set(atlasUvArray[i0 * 2], atlasUvArray[i0 * 2 + 1]);
    atlasB.set(atlasUvArray[i1 * 2], atlasUvArray[i1 * 2 + 1]);
    atlasC.set(atlasUvArray[i2 * 2], atlasUvArray[i2 * 2 + 1]);

    const minU = Math.min(uvA.x, uvB.x, uvC.x);
    const maxU = Math.max(uvA.x, uvB.x, uvC.x);
    const minV = Math.min(uvA.y, uvB.y, uvC.y);
    const maxV = Math.max(uvA.y, uvB.y, uvC.y);

    const x0 = Math.max(0, Math.floor(minU * outSize));
    const x1 = Math.min(outSize - 1, Math.ceil(maxU * outSize));
    const y0 = Math.max(0, Math.floor((1 - maxV) * outSize));
    const y1 = Math.min(outSize - 1, Math.ceil((1 - minV) * outSize));

    for (let py = y0; py <= y1; py++) {
      for (let px = x0; px <= x1; px++) {
        const u = (px + 0.5) / outSize;
        const v = 1 - (py + 0.5) / outSize;
        const w = barycentric(u, v, uvA, uvB, uvC);
        if (w.x < 0 || w.y < 0 || w.z < 0) continue;

        const au = atlasA.x * w.x + atlasB.x * w.y + atlasC.x * w.z;
        const av = atlasA.y * w.x + atlasB.y * w.y + atlasC.y * w.z;
        const [r, g, b, a] = sampleRgba(source, texW, texH, au, av);
        const idx = (py * outSize + px) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = a;
      }
    }
  }

  return data;
}

export async function extractGlbBaseColor(glbPath) {
  const io = new NodeIO();
  const doc = await io.read(glbPath);
  const textures = doc.getRoot().listTextures();
  const base =
    textures.find((t) => t.getName() === "base_color") ??
    textures.find((t) => (t.getMimeType() || "").startsWith("image/"));
  if (!base) throw new Error(`No base color texture in ${glbPath}`);
  const image = base.getImage();
  if (!image?.byteLength) throw new Error("Base color texture has no image bytes");
  const { data, info } = await sharp(image).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, name: base.getName() || "(unnamed)" };
}

export function darkenTextureData(data, factor = 0.38) {
  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i += 4) {
    out[i] = Math.round(data[i] * factor);
    out[i + 1] = Math.round(data[i + 1] * factor);
    out[i + 2] = Math.round(data[i + 2] * factor);
    out[i + 3] = data[i + 3];
  }
  return out;
}

export async function loadGlbGeometry(glbPath) {
  if (typeof globalThis.self === "undefined") globalThis.self = globalThis;
  if (!existsSync(glbPath)) {
    throw new Error(`GLB not found: ${glbPath}`);
  }
  const buf = readFileSync(glbPath);
  const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const loader = new GLTFLoader();
  const gltf = await loader.parseAsync(arrayBuffer, glbPath);
  gltf.scene.updateMatrixWorld(true);

  const geometries = [];
  gltf.scene.traverse((child) => {
    if (child.isMesh) {
      const g = child.geometry.clone();
      g.applyMatrix4(child.matrixWorld);
      geometries.push(g);
    }
  });

  if (geometries.length === 0) {
    throw new Error(`No meshes in GLB: ${glbPath}`);
  }

  const merged = mergeGeometries(geometries, false);
  if (!merged.attributes.normal) merged.computeVertexNormals();
  return merged;
}

/** Reduce triangle count so browser Draco can decode the logo mesh reliably. */
export async function simplifyGeometry(geometry, targetTriangles = 10000) {
  if (!geometry.index) return geometry;
  await MeshoptSimplifier.ready;

  const index = geometry.index.array;
  const positions = geometry.attributes.position.array;
  const targetIndexCount = Math.min(index.length, targetTriangles * 3);
  if (targetIndexCount >= index.length - 3) return geometry;

  const [newIndices] = MeshoptSimplifier.simplify(
    new Uint32Array(index),
    new Float32Array(positions),
    3,
    targetIndexCount,
    0.05,
  );

  if (!newIndices.length) return geometry;

  const simplified = geometry.clone();
  simplified.setIndex(new THREE.BufferAttribute(newIndices, 1));
  simplified.computeVertexNormals();
  return simplified;
}

export function encodeGeometryToDrc(geometry, encoderModule) {
  if (!geometry.attributes.normal) geometry.computeVertexNormals();

  const pos = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  const uv = geometry.attributes.uv;
  const index = geometry.index;
  const encoder = new encoderModule.Encoder();
  const meshBuilder = new encoderModule.MeshBuilder();
  const mesh = new encoderModule.Mesh();

  const numPoints = pos.count;
  meshBuilder.AddFloatAttributeToMesh(mesh, encoderModule.POSITION, numPoints, 3, pos.array);

  if (normal) {
    meshBuilder.AddFloatAttributeToMesh(mesh, encoderModule.NORMAL, numPoints, 3, normal.array);
  }
  if (uv) {
    meshBuilder.AddFloatAttributeToMesh(mesh, encoderModule.TEX_COORD, numPoints, 2, uv.array);
  }

  if (index) {
    meshBuilder.AddFacesToMesh(mesh, index.count / 3, index.array);
  } else {
    const indices = new Uint32Array(numPoints);
    for (let i = 0; i < numPoints; i++) indices[i] = i;
    const faceCount = Math.floor(numPoints / 3);
    meshBuilder.AddFacesToMesh(mesh, faceCount, indices.subarray(0, faceCount * 3));
  }

  encoder.SetSpeedOptions(5, 5);
  encoder.SetAttributeQuantization(encoderModule.POSITION, 14);
  if (normal) encoder.SetAttributeQuantization(encoderModule.NORMAL, 10);
  if (uv) encoder.SetAttributeQuantization(encoderModule.TEX_COORD, 12);
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

  return out;
}

export async function toKtx2(inputPng, outputKtx2) {
  const basisPkgDir = dirname(require.resolve("@gpu-tex-enc/basis/package.json"));
  const out = basis.generate(inputPng, "ETC1S", true, ["-q", "200", "-mipmap"]);
  await copyFile(out, outputKtx2);
}

export async function exportGeometryToGlb(geometry, outPath, name = "monkey") {
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

  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xa8b4c8 }));
  mesh.name = name;
  const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");
  const exporter = new GLTFExporter();
  const buffer = await exporter.parseAsync(mesh, { binary: true });
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, Buffer.from(buffer));
}
