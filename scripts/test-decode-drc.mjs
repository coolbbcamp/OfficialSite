import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const draco3d = require("draco3d");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const decoderModule = await draco3d.createDecoderModule({});

function decode(path) {
  const raw = readFileSync(path);
  const buffer = new decoderModule.DecoderBuffer();
  buffer.Init(new Int8Array(raw), raw.byteLength);
  const decoder = new decoderModule.Decoder();
  const mesh = new decoderModule.Mesh();
  const ok = decoder.DecodeBufferToMesh(buffer, mesh);
  if (!ok.ok()) throw new Error(`decode failed ${path}: ${decoder.GetErrorString(ok).code()}`);
  const attrs = [];
  for (let i = 0; i < mesh.num_attributes(); i++) {
    const a = decoder.GetAttribute(mesh, i);
    attrs.push(a.attribute_type());
  }
  console.log(path, "points", mesh.num_points(), "faces", mesh.num_faces(), "attrs", attrs);
}

decode(join(ROOT, "assets/geometries/pudgy.drc"));
decode(join(ROOT, "assets/geometries/monkey.drc"));
