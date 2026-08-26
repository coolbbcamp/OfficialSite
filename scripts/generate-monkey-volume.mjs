/**
 * Voxelize monkey mesh into 64³ signed-distance volume → monkey_64.ktx2
 */
import { mkdir, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import * as THREE from "three";
import sharp from "sharp";
import { generateMonkeyModel } from "./generate-monkey-model.mjs";

const require = createRequire(import.meta.url);
const basisPkgDir = dirname(require.resolve("@gpu-tex-enc/basis/package.json"));
const basisBins = require("@gpu-tex-enc/basis/package.json").bin;
const basisu = join(basisPkgDir, basisBins[`basisu-${process.platform}-${process.arch}`]);

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SLICE_DIR = join(ROOT, "models", "monkey", "volume_slices");
const OUT_KTX2 = join(ROOT, "assets", "images", "volumes", "monkey_64.ktx2");
const RES = 64;

function idx(x, y, z) {
  return x + y * RES + z * RES * RES;
}

function chamferEdt(inside) {
  const INF = 1e6;
  const dist = new Float32Array(RES * RES * RES);
  for (let i = 0; i < dist.length; i++) {
    dist[i] = inside[i] ? 0 : INF;
  }

  const w1 = 1;
  const w2 = 1.4;

  for (let z = 0; z < RES; z++) {
    for (let y = 0; y < RES; y++) {
      for (let x = 0; x < RES; x++) {
        const i = idx(x, y, z);
        if (x > 0) dist[i] = Math.min(dist[i], dist[idx(x - 1, y, z)] + w1);
        if (y > 0) dist[i] = Math.min(dist[i], dist[idx(x, y - 1, z)] + w1);
        if (z > 0) dist[i] = Math.min(dist[i], dist[idx(x, y, z - 1)] + w1);
        if (x > 0 && y > 0) dist[i] = Math.min(dist[i], dist[idx(x - 1, y - 1, z)] + w2);
        if (x > 0 && z > 0) dist[i] = Math.min(dist[i], dist[idx(x - 1, y, z - 1)] + w2);
        if (y > 0 && z > 0) dist[i] = Math.min(dist[i], dist[idx(x, y - 1, z - 1)] + w2);
      }
    }
  }

  for (let z = RES - 1; z >= 0; z--) {
    for (let y = RES - 1; y >= 0; y--) {
      for (let x = RES - 1; x >= 0; x--) {
        const i = idx(x, y, z);
        if (x < RES - 1) dist[i] = Math.min(dist[i], dist[idx(x + 1, y, z)] + w1);
        if (y < RES - 1) dist[i] = Math.min(dist[i], dist[idx(x, y + 1, z)] + w1);
        if (z < RES - 1) dist[i] = Math.min(dist[i], dist[idx(x, y, z + 1)] + w1);
        if (x < RES - 1 && y < RES - 1) dist[i] = Math.min(dist[i], dist[idx(x + 1, y + 1, z)] + w2);
        if (x < RES - 1 && z < RES - 1) dist[i] = Math.min(dist[i], dist[idx(x + 1, y, z + 1)] + w2);
        if (y < RES - 1 && z < RES - 1) dist[i] = Math.min(dist[i], dist[idx(x, y + 1, z + 1)] + w2);
      }
    }
  }

  const outside = new Float32Array(RES * RES * RES);
  for (let i = 0; i < outside.length; i++) {
    outside[i] = inside[i] ? INF : 0;
  }

  for (let z = 0; z < RES; z++) {
    for (let y = 0; y < RES; y++) {
      for (let x = 0; x < RES; x++) {
        const i = idx(x, y, z);
        if (x > 0) outside[i] = Math.min(outside[i], outside[idx(x - 1, y, z)] + w1);
        if (y > 0) outside[i] = Math.min(outside[i], outside[idx(x, y - 1, z)] + w1);
        if (z > 0) outside[i] = Math.min(outside[i], outside[idx(x, y, z - 1)] + w1);
        if (x > 0 && y > 0) outside[i] = Math.min(outside[i], outside[idx(x - 1, y - 1, z)] + w2);
        if (x > 0 && z > 0) outside[i] = Math.min(outside[i], outside[idx(x - 1, y, z - 1)] + w2);
        if (y > 0 && z > 0) outside[i] = Math.min(outside[i], outside[idx(x, y - 1, z - 1)] + w2);
      }
    }
  }

  for (let z = RES - 1; z >= 0; z--) {
    for (let y = RES - 1; y >= 0; y--) {
      for (let x = RES - 1; x >= 0; x--) {
        const i = idx(x, y, z);
        if (x < RES - 1) outside[i] = Math.min(outside[i], outside[idx(x + 1, y, z)] + w1);
        if (y < RES - 1) outside[i] = Math.min(outside[i], outside[idx(x, y + 1, z)] + w1);
        if (z < RES - 1) outside[i] = Math.min(outside[i], outside[idx(x, y, z + 1)] + w1);
        if (x < RES - 1 && y < RES - 1) outside[i] = Math.min(outside[i], outside[idx(x + 1, y + 1, z)] + w2);
        if (x < RES - 1 && z < RES - 1) outside[i] = Math.min(outside[i], outside[idx(x + 1, y, z + 1)] + w2);
        if (y < RES - 1 && z < RES - 1) outside[i] = Math.min(outside[i], outside[idx(x, y + 1, z + 1)] + w2);
      }
    }
  }

  const sdf = new Float32Array(RES * RES * RES);
  const cell = 1 / RES;
  for (let i = 0; i < sdf.length; i++) {
    sdf[i] = inside[i] ? -dist[i] * cell : outside[i] * cell;
  }
  return sdf;
}

function buildVolume(geometry) {
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox;
  const size = new THREE.Vector3();
  bb.getSize(size);

  const mesh = new THREE.Mesh(geometry);
  const raycaster = new THREE.Raycaster();
  const dirs = [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(1, 0.15, 0.08).normalize(),
  ];
  const p = new THREE.Vector3();
  const inside = new Uint8Array(RES * RES * RES);

  for (let z = 0; z < RES; z++) {
    for (let y = 0; y < RES; y++) {
      for (let x = 0; x < RES; x++) {
        const u = 0.04 + (x / (RES - 1)) * 0.92;
        const v = 0.04 + (y / (RES - 1)) * 0.92;
        const w = 0.04 + (z / (RES - 1)) * 0.92;
        p.set(bb.min.x + u * size.x, bb.min.y + v * size.y, bb.min.z + w * size.z);

        let votes = 0;
        for (const dir of dirs) {
          raycaster.set(p, dir);
          const hits = raycaster.intersectObject(mesh, false);
          if (hits.length % 2 === 1) votes++;
        }
        inside[idx(x, y, z)] = votes >= 2 ? 1 : 0;
      }
    }
  }

  const sdf = chamferEdt(inside);

  const gradX = new Float32Array(sdf.length);
  const gradY = new Float32Array(sdf.length);
  const gradZ = new Float32Array(sdf.length);

  for (let z = 0; z < RES; z++) {
    for (let y = 0; y < RES; y++) {
      for (let x = 0; x < RES; x++) {
        const i = idx(x, y, z);
        gradX[i] = (sdf[idx(Math.min(RES - 1, x + 1), y, z)] - sdf[idx(Math.max(0, x - 1), y, z)]) * 0.5;
        gradY[i] = (sdf[idx(x, Math.min(RES - 1, y + 1), z)] - sdf[idx(x, Math.max(0, y - 1), z)]) * 0.5;
        gradZ[i] = (sdf[idx(x, y, Math.min(RES - 1, z + 1))] - sdf[idx(x, y, Math.max(0, z - 1))]) * 0.5;
      }
    }
  }

  const maxDist = 0.35;
  const slices = [];

  for (let z = 0; z < RES; z++) {
    const rgba = new Uint8Array(RES * RES * 4);
    for (let y = 0; y < RES; y++) {
      for (let x = 0; x < RES; x++) {
        const i = idx(x, y, z);
        const gx = gradX[i];
        const gy = gradY[i];
        const gz = gradZ[i];
        const len = Math.hypot(gx, gy, gz) || 1;
        const nx = gx / len;
        const ny = gy / len;
        const nz = gz / len;
        const dist = sdf[i];
        const o = (x + y * RES) * 4;
        rgba[o] = Math.round(THREE.MathUtils.clamp((nx * 0.5 + 0.5) * 255, 0, 255));
        rgba[o + 1] = Math.round(THREE.MathUtils.clamp((ny * 0.5 + 0.5) * 255, 0, 255));
        rgba[o + 2] = Math.round(THREE.MathUtils.clamp((nz * 0.5 + 0.5) * 255, 0, 255));
        rgba[o + 3] = Math.round(
          THREE.MathUtils.clamp(((dist / maxDist) * 0.5 + 0.5) * 255, 0, 255)
        );
      }
    }
    slices.push(rgba);
  }

  return slices;
}

async function main() {
  console.log("Building monkey signed-distance volume...");
  const { geometry } = await generateMonkeyModel();
  const slices = buildVolume(geometry);

  await rm(SLICE_DIR, { recursive: true, force: true });
  await mkdir(SLICE_DIR, { recursive: true });
  await mkdir(join(ROOT, "assets", "images", "volumes"), { recursive: true });

  for (let z = 0; z < RES; z++) {
    const path = join(SLICE_DIR, `slice_${String(z).padStart(2, "0")}.png`);
    await sharp(slices[z], { raw: { width: RES, height: RES, channels: 4 } }).png().toFile(path);
  }

  const slicePattern = join(SLICE_DIR, "slice_%02u.png");
  const args = [
    "-ktx2",
    "-tex_type",
    "3d",
    "-linear",
    "-q",
    "200",
    "-multifile_printf",
    slicePattern,
    "-multifile_first",
    "0",
    "-multifile_num",
    String(RES),
    "-output_file",
    OUT_KTX2,
  ];

  console.log("Encoding 3D KTX2 volume...");
  execFileSync(basisu, args, { stdio: "inherit" });
  console.log(`OK images/volumes/monkey_64.ktx2`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
