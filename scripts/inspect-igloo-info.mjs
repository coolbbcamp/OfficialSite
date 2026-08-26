import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const draco3d = require("draco3d");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const decoderModule = await draco3d.createDecoderModule({});

const raw = readFileSync(join(ROOT, "assets/geometries/igloo.drc"));
console.log("first 5 bytes:", new TextDecoder().decode(raw.slice(0, 5)));

const buffer = new decoderModule.DecoderBuffer();
buffer.Init(new Int8Array(raw), raw.byteLength);
const decoder = new decoderModule.Decoder();
const mesh = new decoderModule.Mesh();
const ok = decoder.DecodeBufferToMesh(buffer, mesh);

const querier = new decoderModule.MetadataQuerier();
const metadata = decoder.GetMetadata(mesh);
if (metadata) {
  console.log("has metadata object");
  try {
    const hasInfo = querier.HasEntry(metadata, "info");
    console.log("has info:", hasInfo);
    if (hasInfo) {
      const info = querier.GetStringEntry(metadata, "info");
      console.log("info JSON:", info);
      const parsed = JSON.parse(info);
      console.log("attributes:", parsed.attributes);
    }
  } catch (e) {
    console.log("metadata read error:", e.message);
  }
} else {
  console.log("no metadata");
}

// Also check monkey.drc for comparison
const monkeyRaw = readFileSync(join(ROOT, "assets/geometries/monkey.drc"));
console.log("\nmonkey first 5:", new TextDecoder().decode(monkeyRaw.slice(0, 5)));
