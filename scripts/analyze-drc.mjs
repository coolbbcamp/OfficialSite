import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const dracoPath = join(ROOT, "assets/libs/draco/");

const loader = new DRACOLoader();
loader.setDecoderPath(pathToFileURL(join(dracoPath, "/")).href);

const buf = readFileSync(join(ROOT, "assets/geometries/pudgy.drc"));
const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const geometry = await new Promise((resolve, reject) => {
  loader.decodeDracoFile(arrayBuffer, resolve, null, null, undefined, reject);
});
geometry.computeBoundingBox();
const bb = geometry.boundingBox;
console.log("pudgy bounds:", bb.min, bb.max);
console.log("size:", {
  x: bb.max.x - bb.min.x,
  y: bb.max.y - bb.min.y,
  z: bb.max.z - bb.min.z,
});
console.log("vertices:", geometry.attributes.position.count);
loader.dispose();
