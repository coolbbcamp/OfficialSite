/**
 * Sanity-check models/roblox.glb before import.
 * Usage: node scripts/validate-roblox-glb.mjs
 */
import { readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { NodeIO } from "@gltf-transform/core";
import { loadGlbGeometry } from "./monkey-utils.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const GLB = join(ROOT, "models", "roblox.glb");

function fail(msg) {
  console.error(`FAIL ${msg}`);
  process.exit(1);
}

async function main() {
  let stat;
  try {
    stat = statSync(GLB);
  } catch {
    fail(`missing ${GLB}`);
  }

  if (stat.size < 10_000) fail(`file too small (${stat.size} bytes) — likely truncated`);
  console.log(`OK file size ${stat.size} bytes`);

  const raw = readFileSync(GLB);
  if (raw[0] !== 0x67 || raw[1] !== 0x6c || raw[2] !== 0x54 || raw[3] !== 0x46) {
    fail("not a valid GLB (bad magic header)");
  }
  console.log("OK GLB magic header");

  const io = new NodeIO();
  let doc;
  try {
    doc = await io.read(GLB);
  } catch (e) {
    fail(`gltf-transform parse error: ${e.message}`);
  }
  console.log("OK gltf-transform parse");

  const meshes = doc.getRoot().listMeshes();
  const textures = doc.getRoot().listTextures();
  const nodes = doc.getRoot().listNodes();

  if (!meshes.length) fail("no meshes");
  console.log(`OK meshes: ${meshes.length}, nodes: ${nodes.length}, textures: ${textures.length}`);

  const base =
    textures.find((t) => t.getName() === "base_color") ??
    textures.find((t) => (t.getMimeType() || "").startsWith("image/"));
  if (!base) fail("no base color texture");
  const image = base.getImage();
  if (!image?.byteLength) fail("base color texture has no image bytes");
  console.log(`OK base color texture: ${base.getName() || "(unnamed)"} ${image.byteLength} bytes`);

  let geometry;
  try {
    geometry = await loadGlbGeometry(GLB);
  } catch (e) {
    fail(`Three.js GLTFLoader error: ${e.message}`);
  }

  const verts = geometry.attributes.position?.count ?? 0;
  const tris = geometry.index ? geometry.index.count / 3 : verts / 3;
  const hasUv = !!geometry.attributes.uv;

  if (verts < 100) fail(`too few vertices (${verts})`);
  if (tris < 100) fail(`too few triangles (${tris})`);
  console.log(`OK geometry: ${verts} verts, ~${Math.floor(tris)} tris, UVs: ${hasUv}`);

  geometry.computeBoundingBox();
  const bb = geometry.boundingBox;
  const h = bb.max.y - bb.min.y;
  if (!Number.isFinite(h) || h <= 0) fail("invalid bounding box height");
  console.log(`OK bounds height ${h.toFixed(3)}`);

  console.log("\nroblox.glb looks valid — safe to import.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
