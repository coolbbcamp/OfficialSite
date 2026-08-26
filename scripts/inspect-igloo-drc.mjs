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
  const ok = decoder.DecodeBufferToMesh(buffer, mesh);
  if (!ok.ok()) throw new Error(`decode failed: ${path}`);
  const types = ["INVALID", "POSITION", "NORMAL", "COLOR", "TEX_COORD", "GENERIC"];
  console.log(path, "points", mesh.num_points(), "faces", mesh.num_faces());
  for (let i = 0; i < mesh.num_attributes(); i++) {
    const a = decoder.GetAttribute(mesh, i);
    console.log("  attr", types[a.attribute_type()] || a.attribute_type(), "components", a.num_components());
  }
}

inspect(join(ROOT, "assets/geometries/igloo.drc"));
