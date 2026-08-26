/**
 * Trim a long Ogg Vorbis source to a site-friendly background loop (Opus in Ogg,
 * like the original music-highq.ogg). The Igloo audioworker chokes on very long
 * decoded buffers (~7+ min stereo ≈ 160 MB).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { OggVorbisDecoder } from "@wasm-audio-decoders/ogg-vorbis";
import opus from "@audio/encode-opus";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "assets/audio/children.ogg");
const OUT = join(ROOT, "assets/audio/children-loop.ogg");
/** Trim length for children-loop.ogg (full children.ogg ≈ 455s). Re-run this script after changing. */
const MAX_SECONDS = Number(process.env.MUSIC_TRIM_SECONDS || 210);
const BITRATE = 96;

const decoder = new OggVorbisDecoder();
await decoder.ready;

const decoded = await decoder.decode(readFileSync(SRC));
const maxSamples = Math.min(
  decoded.channelData[0].length,
  Math.floor(decoded.sampleRate * MAX_SECONDS),
);

const channelData = decoded.channelData.map((ch) => ch.slice(0, maxSamples));
const duration = maxSamples / decoded.sampleRate;
console.log(
  `Trimming to ${duration.toFixed(1)}s (${maxSamples} samples @ ${decoded.sampleRate} Hz)`,
);

const encoder = await opus({
  sampleRate: decoded.sampleRate,
  channels: channelData.length,
  bitrate: BITRATE,
});

const pages = [
  encoder.encode(channelData),
  encoder.flush(),
].filter(Boolean);

const total = pages.reduce((n, p) => n + p.length, 0);
const out = new Uint8Array(total);
let offset = 0;
for (const page of pages) {
  out.set(page, offset);
  offset += page.length;
}
encoder.free();

writeFileSync(OUT, out);
console.log(`Wrote ${OUT} (${out.length} bytes)`);
