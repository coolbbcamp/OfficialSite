/**
 * Offline render roblox.drc + texture to verify UV mapping.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import * as THREE from "three";

const require = createRequire(import.meta.url);
const draco3d = require("draco3d");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "tmp-roblox-offline.png");

async function loadDrc(path) {
  const decoderModule = await draco3d.createDecoderModule({});
  const raw = readFileSync(path);
  const buffer = new decoderModule.DecoderBuffer();
  buffer.Init(new Int8Array(raw), raw.byteLength);
  const decoder = new decoderModule.Decoder();
  const dracoMesh = new decoderModule.Mesh();
  if (!decoder.DecodeBufferToMesh(buffer, dracoMesh).ok()) {
    throw new Error(`Draco decode failed: ${path}`);
  }

  const geometry = new THREE.BufferGeometry();
  const posAttr = decoder.GetAttributeByUniqueId(dracoMesh, decoderModule.POSITION);
  const posData = new decoderModule.DracoFloat32Array();
  decoder.GetAttributeFloatForAllPoints(dracoMesh, posAttr, posData);
  const n = dracoMesh.num_points();
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n * 3; i++) pos[i] = posData.GetValue(i);
  geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));

  for (let id = 0; id < dracoMesh.num_attributes(); id++) {
    const attr = decoder.GetAttribute(dracoMesh, id);
    if (attr.attribute_type() === decoderModule.TEX_COORD) {
      const uvData = new decoderModule.DracoFloat32Array();
      decoder.GetAttributeFloatForAllPoints(dracoMesh, attr, uvData);
      const uv = new Float32Array(n * 2);
      for (let i = 0; i < n * 2; i++) uv[i] = uvData.GetValue(i);
      geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    }
  }

  const faces = dracoMesh.num_faces();
  const indices = new Uint32Array(faces * 3);
  const ia = new decoderModule.DracoInt32Array();
  for (let f = 0; f < faces; f++) {
    decoder.GetFaceFromMesh(dracoMesh, f, ia);
    indices[f * 3] = ia.GetValue(0);
    indices[f * 3 + 1] = ia.GetValue(1);
    indices[f * 3 + 2] = ia.GetValue(2);
  }
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  return geometry;
}

async function main() {
  const geometry = await loadDrc(join(ROOT, "assets/geometries/roblox.drc"));
  const tex = await new THREE.TextureLoader().loadAsync(
    join(ROOT, "assets/images/cubes/roblox_color.png"),
  );
  tex.colorSpace = THREE.SRGBColorSpace;

  const canvas = new (await import("canvas")).createCanvas(512, 512);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(512, 512);
  renderer.setClearColor(0x111111, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox;
  const center = new THREE.Vector3();
  bb.getCenter(center);
  const size = new THREE.Vector3();
  bb.getSize(size);
  const dist = Math.max(size.x, size.y, size.z) * 2.2;
  camera.position.set(center.x, center.y + size.y * 0.1, center.z + dist);
  camera.lookAt(center);

  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: tex }));
  scene.add(mesh);
  renderer.render(scene, camera);

  writeFileSync(OUT, canvas.toBuffer("image/png"));
  console.log("OK", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
