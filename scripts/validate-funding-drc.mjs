import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const draco3d = require("draco3d");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const decoderModule = await draco3d.createDecoderModule({});

function inspect(path) {
  const raw = readFileSync(path);
  const buffer = new decoderModule.DecoderBuffer();
  buffer.Init(new Int8Array(raw), raw.byteLength);
  const decoder = new decoderModule.Decoder();
  const mesh = new decoderModule.Mesh();
  decoder.DecodeBufferToMesh(buffer, mesh);

  const querier = new decoderModule.MetadataQuerier();
  const metadata = decoder.GetMetadata(mesh);
  const info = JSON.parse(querier.GetStringEntry(metadata, "info"));
  console.log(path, "info:", info);

  const batchAttr = decoder.GetAttribute(mesh, 6);
  const data = new decoderModule.DracoFloat32Array();
  decoder.GetAttributeFloatForAllPoints(mesh, batchAttr, data);
  const set = new Set();
  for (let p = 0; p < mesh.num_points(); p++) set.add(data.GetValue(p));
  console.log("pieces:", set.size, "points:", mesh.num_points(), "faces:", mesh.num_faces());
}

inspect(join(ROOT, "assets/geometries/funding_text.drc"));
