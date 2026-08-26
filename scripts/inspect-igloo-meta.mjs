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
const ok = decoder.DecodeBufferToMesh(buffer, mesh);

// Try metadata
try {
  const metadata = decoder.GetMetadata(mesh);
  if (metadata) {
    const n = metadata.num_entries();
    console.log("metadata entries:", n);
    for (let i = 0; i < n; i++) {
      const entry = metadata.GetEntry(i);
      console.log("  key:", entry.key(), "value:", entry.value());
    }
  }
} catch (e) {
  console.log("metadata error:", e.message);
}

// Attribute unique ids and names from metadata
for (let i = 0; i < mesh.num_attributes(); i++) {
  const attr = decoder.GetAttribute(mesh, i);
  const uid = attr.unique_id();
  const type = attr.attribute_type();
  const comps = attr.num_components();
  let name = "?";
  try {
    const meta = decoder.GetAttributeMetadata(mesh, uid);
    if (meta) {
      const ne = meta.num_entries();
      for (let j = 0; j < ne; j++) {
        const e = meta.GetEntry(j);
        if (e.key() === "name") name = e.value();
      }
    }
  } catch {}
  console.log(`attr ${i}: type=${type} comps=${comps} uid=${uid} name=${name}`);
}

// Sample first vertex of each attr
const posAttr = decoder.GetAttributeByUniqueId(mesh, decoderModule.POSITION);
const posData = new decoderModule.DracoFloat32Array();
decoder.GetAttributeFloatForAllPoints(mesh, posAttr, posData);
console.log("pos[0]:", posData.GetValue(0), posData.GetValue(1), posData.GetValue(2));

// Count unique batchIds if we find it
for (let i = 0; i < mesh.num_attributes(); i++) {
  const attr = decoder.GetAttribute(mesh, i);
  if (attr.num_components() === 1) {
    const data = new decoderModule.DracoFloat32Array();
    decoder.GetAttributeFloatForAllPoints(mesh, attr, data);
    const set = new Set();
    for (let p = 0; p < mesh.num_points(); p++) {
      set.add(data.GetValue(p));
    }
    console.log(`1-comp attr ${i} unique values:`, set.size, [...set].slice(0, 20));
  }
}

// Bounding box
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (let p = 0; p < mesh.num_points(); p++) {
  const x = posData.GetValue(p * 3);
  const y = posData.GetValue(p * 3 + 1);
  const z = posData.GetValue(p * 3 + 2);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
console.log("bounds:", { minX, maxX, minY, maxY, minZ, maxZ });
console.log("size:", maxX - minX, maxY - minY, maxZ - minZ);
