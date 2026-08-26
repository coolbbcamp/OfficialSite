import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const loader = new DRACOLoader();
loader.setDecoderPath(pathToFileURL(join(ROOT, "assets/libs/draco/")).href);

const url = pathToFileURL(join(ROOT, "assets/geometries/igloo.drc")).href;
const geometry = await loader.loadAsync(url);
console.log("attributes:", Object.keys(geometry.attributes));
for (const [name, attr] of Object.entries(geometry.attributes)) {
  console.log(name, attr.itemSize, attr.count, attr.array?.slice?.(0, 6));
}
console.log("groups", geometry.groups?.length);
