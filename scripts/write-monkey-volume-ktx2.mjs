/**
 * Write monkey_64.ktx2 matching peachesbody format: RGBA8 + ZSTD, pixelDepth 64
 */
import { readFileSync, writeFileSync, existsSync, mkdtempSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { read, write } from "ktx-parse";
import * as THREE from "three";
import {
  centerAndScale,
  getPudgyHeight,
  loadGlbGeometry,
  resolveVolumeGlb,
} from "./monkey-utils.mjs";
import { generateMonkeyVolumeGeometry } from "./generate-monkey-model.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "assets", "images", "volumes", "monkey_64.ktx2");
const TEMPLATE = join(ROOT, "assets", "images", "volumes", "peachesbody_64.ktx2");
const CACHE_RGBA = join(ROOT, "models", "monkey", "volume_rgba.bin");
const RES = 64;

function idx(x, y, z) {
  return x + y * RES + z * RES * RES;
}

function isBoundaryInside(x, y, z, inside) {
  if (!inside[idx(x, y, z)]) return false;
  for (let dz = -1; dz <= 1; dz++)
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy && !dz) continue;
        const nx = x + dx, ny = y + dy, nz = z + dz;
        if (nx < 0 || ny < 0 || nz < 0 || nx >= RES || ny >= RES || nz >= RES) return true;
        if (!inside[idx(nx, ny, nz)]) return true;
      }
  return false;
}

function chamferPass(field) {
  const w1 = 1, w2 = 1.4;
  for (let z = 0; z < RES; z++)
    for (let y = 0; y < RES; y++)
      for (let x = 0; x < RES; x++) {
        const i = idx(x, y, z);
        if (x > 0) field[i] = Math.min(field[i], field[idx(x - 1, y, z)] + w1);
        if (y > 0) field[i] = Math.min(field[i], field[idx(x, y - 1, z)] + w1);
        if (z > 0) field[i] = Math.min(field[i], field[idx(x, y, z - 1)] + w1);
        if (x > 0 && y > 0) field[i] = Math.min(field[i], field[idx(x - 1, y - 1, z)] + w2);
        if (x > 0 && z > 0) field[i] = Math.min(field[i], field[idx(x - 1, y, z - 1)] + w2);
        if (y > 0 && z > 0) field[i] = Math.min(field[i], field[idx(x, y - 1, z - 1)] + w2);
      }
  for (let z = RES - 1; z >= 0; z--)
    for (let y = RES - 1; y >= 0; y--)
      for (let x = RES - 1; x >= 0; x--) {
        const i = idx(x, y, z);
        if (x < RES - 1) field[i] = Math.min(field[i], field[idx(x + 1, y, z)] + w1);
        if (y < RES - 1) field[i] = Math.min(field[i], field[idx(x, y + 1, z)] + w1);
        if (z < RES - 1) field[i] = Math.min(field[i], field[idx(x, y, z + 1)] + w1);
        if (x < RES - 1 && y < RES - 1) field[i] = Math.min(field[i], field[idx(x + 1, y + 1, z)] + w2);
        if (x < RES - 1 && z < RES - 1) field[i] = Math.min(field[i], field[idx(x + 1, y, z + 1)] + w2);
        if (y < RES - 1 && z < RES - 1) field[i] = Math.min(field[i], field[idx(x, y + 1, z + 1)] + w2);
      }
}

function chamferEdt(inside) {
  const INF = 1e6;
  const distToOutside = new Float32Array(RES * RES * RES);
  const distToInside = new Float32Array(RES * RES * RES);

  for (let z = 0; z < RES; z++) {
    for (let y = 0; y < RES; y++) {
      for (let x = 0; x < RES; x++) {
        const i = idx(x, y, z);
        distToOutside[i] = inside[i] ? INF : 0;
        distToInside[i] = isBoundaryInside(x, y, z, inside) ? 0 : INF;
      }
    }
  }

  chamferPass(distToOutside);
  chamferPass(distToInside);

  const cell = 1 / RES;
  const sdf = new Float32Array(RES * RES * RES);
  for (let i = 0; i < sdf.length; i++) {
    sdf[i] = (distToInside[i] - distToOutside[i]) * cell;
  }
  return sdf;
}

function trianglePlaneSegment(vA, vB, vC, planeZ) {
  const verts = [vA, vB, vC];
  const hits = [];
  for (let i = 0; i < 3; i++) {
    const a = verts[i];
    const b = verts[(i + 1) % 3];
    const az = a.z;
    const bz = b.z;
    if ((az <= planeZ && bz >= planeZ) || (bz <= planeZ && az >= planeZ)) {
      if (Math.abs(bz - az) < 1e-8) continue;
      const t = (planeZ - az) / (bz - az);
      hits.push(new THREE.Vector2(a.x + t * (b.x - a.x), a.y + t * (b.y - a.y)));
    }
  }
  if (hits.length < 2) return null;
  if (hits.length > 2) hits.length = 2;
  return [hits[0], hits[1]];
}

function voxelizeRayParity(geometry) {
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

  return inside;
}

function voxelizeScanline(geometry) {
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox;
  const size = new THREE.Vector3();
  bb.getSize(size);
  const pos = geometry.attributes.position;
  const index = geometry.index;
  const triCount = index ? index.count / 3 : pos.count / 3;

  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();
  const inside = new Uint8Array(RES * RES * RES);

  for (let z = 0; z < RES; z++) {
    const w = 0.04 + (z / (RES - 1)) * 0.92;
    const planeZ = bb.min.z + w * size.z;
    const sliceSegments = [];

    for (let t = 0; t < triCount; t++) {
      const i0 = index ? index.getX(t * 3) : t * 3;
      const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
      const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;
      vA.fromBufferAttribute(pos, i0);
      vB.fromBufferAttribute(pos, i1);
      vC.fromBufferAttribute(pos, i2);

      const seg = trianglePlaneSegment(vA, vB, vC, planeZ);
      if (seg) sliceSegments.push(seg);
    }

    for (let y = 0; y < RES; y++) {
      const v = 0.04 + (y / (RES - 1)) * 0.92;
      const py = bb.min.y + v * size.y;
      const xs = [];

      for (const [p1, p2] of sliceSegments) {
        const y1 = p1.y, y2 = p2.y;
        if ((y1 <= py && y2 >= py) || (y2 <= py && y1 >= py)) {
          if (Math.abs(y2 - y1) < 1e-8) continue;
          const t = (py - y1) / (y2 - y1);
          xs.push(p1.x + t * (p2.x - p1.x));
        }
      }

      if (xs.length < 2) continue;
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        const x0 = xs[i];
        const x1 = xs[i + 1];
        for (let x = 0; x < RES; x++) {
          const u = 0.04 + (x / (RES - 1)) * 0.92;
          const px = bb.min.x + u * size.x;
          if (px >= x0 && px <= x1) inside[idx(x, y, z)] = 1;
        }
      }
    }
  }

  return inside;
}

/** Keep only a thin surface shell so particles trace the mesh silhouette (not a solid interior blob). */
function shellifyInside(inside, shellDepthVoxels = 2) {
  const INF = 1e6;
  const distToOutside = new Float32Array(inside.length);
  for (let z = 0; z < RES; z++) {
    for (let y = 0; y < RES; y++) {
      for (let x = 0; x < RES; x++) {
        const i = idx(x, y, z);
        distToOutside[i] = inside[i] ? INF : 0;
      }
    }
  }
  chamferPass(distToOutside);

  const shelled = new Uint8Array(inside.length);
  let count = 0;
  for (let i = 0; i < inside.length; i++) {
    if (inside[i] && distToOutside[i] <= shellDepthVoxels) {
      shelled[i] = 1;
      count++;
    }
  }
  console.log(`Surface shell (depth ${shellDepthVoxels}): ${count} voxels`);
  return shelled;
}

async function buildRgbaVolume(geometry, { method = "ray", shellDepth = 2 } = {}) {
  let inside =
    method === "scanline" ? voxelizeScanline(geometry) : voxelizeRayParity(geometry);

  const solidCount = inside.reduce((a, b) => a + b, 0);
  console.log(`Solid inside voxels: ${solidCount} / ${inside.length} (${method})`);

  if (shellDepth > 0) {
    inside = shellifyInside(inside, shellDepth);
  }

  // Neck bridge in mesh keeps waist connected.
  const insideCount = inside.reduce((a, b) => a + b, 0);
  console.log(`Volume inside voxels: ${insideCount} / ${inside.length} (${method})`);
  if (insideCount < 500 || insideCount > inside.length - 500) {
    throw new Error("Monkey volume inside/outside mask looks invalid — regenerate mesh");
  }

  const sdf = chamferEdt(inside);
  const gradX = new Float32Array(sdf.length);
  const gradY = new Float32Array(sdf.length);
  const gradZ = new Float32Array(sdf.length);
  for (let z = 0; z < RES; z++)
    for (let y = 0; y < RES; y++)
      for (let x = 0; x < RES; x++) {
        const i = idx(x, y, z);
        gradX[i] = (sdf[idx(Math.min(RES - 1, x + 1), y, z)] - sdf[idx(Math.max(0, x - 1), y, z)]) * 0.5;
        gradY[i] = (sdf[idx(x, Math.min(RES - 1, y + 1), z)] - sdf[idx(x, Math.max(0, y - 1), z)]) * 0.5;
        gradZ[i] = (sdf[idx(x, y, Math.min(RES - 1, z + 1))] - sdf[idx(x, y, Math.max(0, z - 1))]) * 0.5;
      }
  const maxDist = shellDepth > 0 ? 0.12 : 0.35;
  let minSdf = Infinity, maxSdf = -Infinity;
  const rgba = new Uint8Array(RES * RES * RES * 4);
  for (let z = 0; z < RES; z++) {
    for (let y = 0; y < RES; y++) {
      for (let x = 0; x < RES; x++) {
        const i = idx(x, y, z);
        minSdf = Math.min(minSdf, sdf[i]);
        maxSdf = Math.max(maxSdf, sdf[i]);
        const gx = gradX[i], gy = gradY[i], gz = gradZ[i];
        const len = Math.hypot(gx, gy, gz) || 1;
        const o = i * 4;
        rgba[o] = Math.round(THREE.MathUtils.clamp((gx / len * 0.5 + 0.5) * 255, 0, 255));
        rgba[o + 1] = Math.round(THREE.MathUtils.clamp((gy / len * 0.5 + 0.5) * 255, 0, 255));
        rgba[o + 2] = Math.round(THREE.MathUtils.clamp((gz / len * 0.5 + 0.5) * 255, 0, 255));
        rgba[o + 3] = Math.round(THREE.MathUtils.clamp(((sdf[i] / maxDist) * 0.5 + 0.5) * 255, 0, 255));
      }
    }
  }
  console.log(`SDF range: ${minSdf.toFixed(4)} .. ${maxSdf.toFixed(4)}`);
  return rgba;
}

/** ZSTD-compress RGBA payload to match peachesbody KTX2 (ss:2). */
function zstdCompress(rgba) {
  const dir = mkdtempSync(join(tmpdir(), "coolbb-zstd-"));
  const inPath = join(dir, "in.bin");
  const outPath = join(dir, "out.zst");
  writeFileSync(inPath, rgba);
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
  const compressScript = join(dirname(fileURLToPath(import.meta.url)), "zstd-compress.cjs");
  const result = spawnSync(
    npmCmd,
    [
      "exec",
      "--yes",
      "--package=@mongodb-js/zstd",
      "--",
      "node",
      compressScript,
      inPath,
      outPath,
    ],
    { encoding: "utf8", timeout: 180000, shell: process.platform === "win32" },
  );
  try {
    unlinkSync(inPath);
  } catch {}
  if (result.status !== 0) {
    throw new Error(
      `ZSTD compress failed (install @mongodb-js/zstd via npm): ${result.stderr || result.stdout || result.error}`,
    );
  }
  const compressed = readFileSync(outPath);
  try {
    unlinkSync(outPath);
  } catch {}
  return compressed;
}

async function loadVolumeGeometry(fromGlb) {
  if (fromGlb) {
    const volumePath = resolveVolumeGlb();
    console.log(`Loading volume GLB: ${volumePath}`);
    const geometry = await loadGlbGeometry(volumePath);
    const targetHeight = await getPudgyHeight();
    centerAndScale(geometry, targetHeight);
    return geometry;
  }
  return await generateMonkeyVolumeGeometry();
}

async function main() {
  const force = process.argv.includes("--force");
  const fromGlb = process.argv.includes("--from-glb");
  if (force && existsSync(CACHE_RGBA)) {
    const { unlinkSync } = await import("node:fs");
    unlinkSync(CACHE_RGBA);
    console.log("Deleted cached volume RGBA");
  }

  let rgba;
  if (existsSync(CACHE_RGBA)) {
    console.log("Using cached volume RGBA...");
    rgba = new Uint8Array(readFileSync(CACHE_RGBA));
  } else {
    console.log("Building monkey RGBA volume...");
    const geometry = await loadVolumeGeometry(fromGlb);
    const shellArg = process.argv.find((a) => a.startsWith("--shell-depth="));
    const shellDepth = shellArg
      ? Math.max(0, parseInt(shellArg.split("=")[1], 10) || 0)
      : fromGlb
        ? 2
        : 0;
    const method = "scanline";
    rgba = await buildRgbaVolume(geometry, { method, shellDepth });
    writeFileSync(CACHE_RGBA, rgba);
  }

  const template = read(readFileSync(TEMPLATE));

  let levelData;
  let supercompressionScheme = 2;
  try {
    levelData = zstdCompress(rgba);
    console.log(`ZSTD level0: ${levelData.byteLength} bytes (from ${rgba.byteLength})`);
  } catch (err) {
    console.warn("ZSTD compress unavailable — writing uncompressed volume:", err.message);
    levelData = rgba;
    supercompressionScheme = 0;
  }

  template.levels[0].levelData = levelData;
  template.levels[0].uncompressedByteLength = rgba.byteLength;
  template.levelCount = 1;
  template.pixelWidth = RES;
  template.pixelHeight = RES;
  template.pixelDepth = RES;
  template.layerCount = 0;
  template.vkFormat = 37;
  template.supercompressionScheme = supercompressionScheme;

  const out = write(template, { keepWriter: true });
  writeFileSync(OUT, out);
  console.log(
    `OK images/volumes/monkey_64.ktx2 (${out.byteLength} bytes, ss:${supercompressionScheme}, RGBA8 64³)`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
