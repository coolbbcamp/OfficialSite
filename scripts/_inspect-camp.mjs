import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

if (typeof globalThis.self === "undefined") globalThis.self = globalThis;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(ROOT, "models", "scene-text", "camp.glb");
const buf = readFileSync(path);
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const gltf = await new GLTFLoader().parseAsync(ab, path);

function walk(o, depth = 0) {
  const info = {
    name: o.name || o.type,
    type: o.type,
    children: o.children?.length ?? 0,
  };
  if (o.isMesh) {
    o.geometry.computeBoundingBox();
    info.verts = o.geometry.attributes.position.count;
    info.bb = [
      o.geometry.boundingBox.min.toArray().map((v) => +v.toFixed(2)),
      o.geometry.boundingBox.max.toArray().map((v) => +v.toFixed(2)),
    ];
  }
  console.log("  ".repeat(depth) + JSON.stringify(info));
  o.children?.forEach((c) => walk(c, depth + 1));
}
walk(gltf.scene);

const json = JSON.parse(
  new TextDecoder().decode(
    ab.slice(
      12 + 8,
      12 + 8 + new DataView(ab).getUint32(12, true),
    ),
  ),
);
console.log("materials", json.materials?.map((m) => ({ name: m.name, ...m.pbrMetallicRoughness })));
console.log("nodes", json.nodes?.map((n) => ({ name: n.name, mesh: n.mesh })));
