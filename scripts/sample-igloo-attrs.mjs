import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const draco3d = require("draco3d");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const decoderModule = await draco3d.createDecoderModule({});

const raw = readFileSync(join(ROOT, "assets/geometries/igloo.drc"));
const buffer = new decoderModule.DecoderBuffer();
buffer.Init(new Int8Array(raw), raw.byteLength);
const decoder = new decoderModule.Decoder();
const mesh = new decoderModule.Mesh();
decoder.DecodeBufferToMesh(buffer, mesh);

const names = ["centr?", "position", "uv?", "rand?", "?", "emission?", "batchId?"];
for (let i = 0; i < mesh.num_attributes(); i++) {
  const attr = decoder.GetAttribute(mesh, i);
  const data = new decoderModule.DracoFloat32Array();
  decoder.GetAttributeFloatForAllPoints(mesh, attr, data);
  const comps = attr.num_components();
  const vals = [];
  for (let c = 0; c < comps; c++) vals.push(data.GetValue(c));
  console.log(`attr ${i}:`, vals);
}

// Check if attr0 equals attr1 for first few points
const a0 = decoder.GetAttribute(mesh, 0);
const a1 = decoder.GetAttribute(mesh, 1);
const d0 = new decoderModule.DracoFloat32Array();
const d1 = new decoderModule.DracoFloat32Array();
decoder.GetAttributeFloatForAllPoints(mesh, a0, d0);
decoder.GetAttributeFloatForAllPoints(mesh, a1, d1);
let same = 0;
for (let p = 0; p < 100; p++) {
  if (d0.GetValue(p*3) === d1.GetValue(p*3)) same++;
}
console.log("attr0==attr1 first 100 verts:", same);

// batchId attr 6 - sample
const a6 = decoder.GetAttribute(mesh, 6);
const d6 = new decoderModule.DracoFloat32Array();
decoder.GetAttributeFloatForAllPoints(mesh, a6, d6);
console.log("batchId samples:", d6.GetValue(0), d6.GetValue(1), d6.GetValue(2));
