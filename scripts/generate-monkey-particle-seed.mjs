/**
 * Sample surface points from monkey.glb → particle_seed.bin for entry hologram.
 * Usage: node scripts/generate-monkey-particle-seed.mjs
 */
import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import {
  centerAndScale,
  getPudgyHeight,
  loadGlbGeometry,
  resolveDisplayGlb,
  MODEL_DIR,
} from "./monkey-utils.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_BIN = join(MODEL_DIR, "particle_seed.bin");
const PARTICLE_COUNT = 150 * 1000;
const CUBE_SIZE = 0.65;

function textureSize(count) {
  return Math.max(Math.ceil(Math.sqrt(count) / 4) * 4, 4);
}

function meshToParticleTransform(geometry) {
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox;
  const cx = (bb.min.x + bb.max.x) * 0.5;
  const cy = (bb.min.y + bb.max.y) * 0.5;
  const cz = (bb.min.z + bb.max.z) * 0.5;
  const half = CUBE_SIZE * 0.5;
  const extX = (bb.max.x - bb.min.x) * 0.5;
  const extY = (bb.max.y - bb.min.y) * 0.5;
  const extZ = (bb.max.z - bb.min.z) * 0.5;
  const maxExt = Math.max(extX, extY, extZ);
  const scale = (half * 0.94) / maxExt;
  return { cx, cy, cz, scale };
}

async function main() {
  const glbPath = resolveDisplayGlb();
  console.log(`Sampling surface from ${glbPath}...`);

  const geometry = await loadGlbGeometry(glbPath);
  const targetHeight = await getPudgyHeight();
  centerAndScale(geometry, targetHeight);

  const xf = meshToParticleTransform(geometry);
  const mesh = new THREE.Mesh(geometry);
  const sampler = new MeshSurfaceSampler(mesh).build();

  const texSize = textureSize(PARTICLE_COUNT);
  const total = texSize * texSize * 4;
  const data = new Float32Array(total);

  const pos = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const jitter = 0.004;

  for (let i = 0; i < texSize * texSize; i++) {
    sampler.sample(pos, normal);
    pos.addScaledVector(normal, (Math.random() - 0.5) * jitter);

    const px = (pos.x - xf.cx) * xf.scale;
    const py = (pos.y - xf.cy) * xf.scale;
    const pz = (pos.z - xf.cz) * xf.scale;

    const o = i * 4;
    data[o] = px;
    data[o + 1] = py;
    data[o + 2] = pz;
    // Bright surface bias for hologram rim lighting (written to pos.w channel).
    data[o + 3] = 0.75 + Math.random() * 0.25;
  }

  await mkdir(MODEL_DIR, { recursive: true });
  await writeFile(OUT_BIN, Buffer.from(data.buffer));

  console.log(`OK ${OUT_BIN}`);
  console.log(`Texture ${texSize}x${texSize}, ${PARTICLE_COUNT} particles, ${total} floats`);
  console.log(`Particle space scale: ${xf.scale.toFixed(4)}, half-cube: ${(CUBE_SIZE * 0.5).toFixed(3)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
