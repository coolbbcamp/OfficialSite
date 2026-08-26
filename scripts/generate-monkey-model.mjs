/**
 * Procedural stylized monkey mesh + gray holographic UV textures for CoolBB.
 * Outputs models/monkey/monkey.glb, monkey_color.png, monkey_dark.png
 */
import { mkdir, writeFile } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const draco3d = require("draco3d");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "models", "monkey");
const PUDGY_DRC = join(ROOT, "assets", "geometries", "pudgy.drc");

function mesh(geometry, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
  geometry.translate(position[0], position[1], position[2]);
  if (rotation[0]) geometry.rotateX(rotation[0]);
  if (rotation[1]) geometry.rotateY(rotation[1]);
  if (rotation[2]) geometry.rotateZ(rotation[2]);
  if (scale[0] !== 1 || scale[1] !== 1 || scale[2] !== 1) {
    geometry.scale(scale[0], scale[1], scale[2]);
  }
  return geometry;
}

export function buildMonkeyParts() {
  const parts = [];

  // Head — large round chimp head
  parts.push(mesh(new THREE.SphereGeometry(0.42, 28, 28), [0, 0.88, 0]));

  // Muzzle / jaw
  parts.push(mesh(new THREE.SphereGeometry(0.2, 20, 20), [0, 0.72, 0.28], [0.15, 0, 0], [1.1, 0.75, 0.9]));

  // Brow ridge
  parts.push(mesh(new THREE.SphereGeometry(0.12, 16, 16), [0, 1.02, 0.18], [-0.35, 0, 0], [1.6, 0.5, 0.7]));

  // Ears
  parts.push(mesh(new THREE.SphereGeometry(0.11, 14, 14), [-0.36, 0.95, 0.02], [0, 0, 0.25]));
  parts.push(mesh(new THREE.SphereGeometry(0.11, 14, 14), [0.36, 0.95, 0.02], [0, 0, -0.25]));

  // Torso
  parts.push(mesh(new THREE.SphereGeometry(0.36, 24, 24), [0, 0.38, 0], [0, 0, 0], [1, 1.15, 0.82]));

  // Crossed arms (confident pose)
  parts.push(mesh(new THREE.CapsuleGeometry(0.09, 0.38, 8, 12), [-0.22, 0.42, 0.18], [0.9, 0.55, -0.35]));
  parts.push(mesh(new THREE.CapsuleGeometry(0.09, 0.38, 8, 12), [0.22, 0.42, 0.18], [0.9, -0.55, 0.35]));
  parts.push(mesh(new THREE.SphereGeometry(0.1, 12, 12), [-0.38, 0.28, 0.32]));
  parts.push(mesh(new THREE.SphereGeometry(0.1, 12, 12), [0.38, 0.28, 0.32]));

  // Legs / feet
  parts.push(mesh(new THREE.CapsuleGeometry(0.1, 0.28, 8, 10), [-0.16, 0.08, 0.05]));
  parts.push(mesh(new THREE.CapsuleGeometry(0.1, 0.28, 8, 10), [0.16, 0.08, 0.05]));
  parts.push(mesh(new THREE.SphereGeometry(0.11, 12, 12), [-0.16, -0.08, 0.1], [0, 0, 0], [1.1, 0.55, 1.3]));
  parts.push(mesh(new THREE.SphereGeometry(0.11, 12, 12), [0.16, -0.08, 0.1], [0, 0, 0], [1.1, 0.55, 1.3]));

  // Headphones band
  parts.push(mesh(new THREE.TorusGeometry(0.46, 0.035, 8, 32), [0, 1.02, 0], [1.2, 0, 0]));
  // Ear cups
  parts.push(mesh(new THREE.SphereGeometry(0.11, 14, 14), [-0.44, 0.9, 0], [0, 0, 0], [0.55, 1, 1]));
  parts.push(mesh(new THREE.SphereGeometry(0.11, 14, 14), [0.44, 0.9, 0], [0, 0, 0], [0.55, 1, 1]));

  // Antenna tuft
  parts.push(mesh(new THREE.CylinderGeometry(0.015, 0.01, 0.22, 8), [-0.2, 1.18, 0.05], [0.3, 0.4, 0.2]));
  parts.push(mesh(new THREE.SphereGeometry(0.04, 8, 8), [-0.24, 1.32, 0.12]));

  return mergeGeometries(parts, false);
}

/** Solid body for entry-scene volume — no headphones/torus (torus creates a hollow ring in SDF). */
/** Simplified chimp silhouette for entry particles — no headphones, short limbs, thick neck. */
export function buildMonkeyVolumeParts() {
  const parts = [];

  parts.push(mesh(new THREE.SphereGeometry(0.38, 28, 28), [0, 0.42, 0], [0, 0, 0], [0.95, 1.28, 0.9]));
  parts.push(mesh(new THREE.CapsuleGeometry(0.22, 0.38, 10, 20), [0, 0.64, 0]));
  parts.push(mesh(new THREE.SphereGeometry(0.4, 28, 28), [0, 0.84, 0]));
  parts.push(mesh(new THREE.SphereGeometry(0.16, 16, 16), [0, 0.7, 0.16], [0.1, 0, 0], [1, 0.72, 0.85]));
  parts.push(mesh(new THREE.SphereGeometry(0.09, 12, 12), [-0.3, 0.86, 0], [0, 0, 0.15]));
  parts.push(mesh(new THREE.SphereGeometry(0.09, 12, 12), [0.3, 0.86, 0], [0, 0, -0.15]));
  parts.push(mesh(new THREE.SphereGeometry(0.2, 14, 14), [-0.14, 0.1, 0.02], [0, 0, 0], [0.85, 1.1, 0.9]));
  parts.push(mesh(new THREE.SphereGeometry(0.2, 14, 14), [0.14, 0.1, 0.02], [0, 0, 0], [0.85, 1.1, 0.9]));
  parts.push(mesh(new THREE.CapsuleGeometry(0.07, 0.16, 6, 10), [-0.26, 0.44, 0.02], [0.35, 0.15, 0]));
  parts.push(mesh(new THREE.CapsuleGeometry(0.07, 0.16, 6, 10), [0.26, 0.44, 0.02], [0.35, -0.15, 0]));

  return mergeGeometries(parts, false);
}

async function decodeDracoBounds(drcPath) {
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

function centerAndScale(geometry, targetHeight) {
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

function bakeTexture(geometry, size, { dark = false } = {}) {
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

  const base = dark ? [0.18, 0.26, 0.42] : [0.55, 0.68, 0.88];
  const hi = dark ? [0.32, 0.45, 0.62] : [0.75, 0.84, 0.96];
  const lo = dark ? [0.06, 0.10, 0.18] : [0.28, 0.38, 0.55];

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

        const r = lo[0] + (hi[0] - lo[0]) * shade;
        const g = lo[1] + (hi[1] - lo[1]) * shade;
        const b = lo[2] + (hi[2] - lo[2]) * shade;

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

async function exportGlb(mesh) {
  const exporter = new GLTFExporter();
  const buffer = await exporter.parseAsync(mesh, { binary: true });
  return buffer;
}

export async function generateMonkeyVolumeGeometry() {
  const ref = await decodeDracoBounds(PUDGY_DRC);
  const geometry = buildMonkeyVolumeParts();
  centerAndScale(geometry, ref.height);
  return geometry;
}

export async function generateMonkeyModel() {
  await mkdir(OUT_DIR, { recursive: true });

  const ref = await decodeDracoBounds(PUDGY_DRC);
  console.log(`Reference pudgy: height=${ref.height.toFixed(3)} vertices=${ref.vertices}`);

  const geometry = buildMonkeyParts();
  centerAndScale(geometry, ref.height);

  const size = 1024;
  const colorData = bakeTexture(geometry, size, { dark: false });
  const darkData = bakeTexture(geometry, size, { dark: true });

  await sharp(colorData, { raw: { width: size, height: size, channels: 4 } })
    .png()
    .toFile(join(OUT_DIR, "monkey_color.png"));
  await sharp(darkData, { raw: { width: size, height: size, channels: 4 } })
    .png()
    .toFile(join(OUT_DIR, "monkey_dark.png"));

  const monkeyMesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xa8b4c8 }));
  monkeyMesh.name = "monkey";

  try {
    const glb = await exportGlb(monkeyMesh);
    await writeFile(join(OUT_DIR, "monkey.glb"), Buffer.from(glb));
  } catch (e) {
    console.warn("GLB export skipped (Node lacks FileReader):", e.message);
  }

  geometry.computeBoundingBox();
  console.log("Monkey bounds:", geometry.boundingBox.min, geometry.boundingBox.max);
  console.log(`Written ${OUT_DIR}`);
  return { outDir: OUT_DIR, geometry };
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}` || process.argv[1]?.endsWith("generate-monkey-model.mjs")) {
  generateMonkeyModel().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
