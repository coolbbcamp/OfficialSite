/**
 * Patch music-bg / room-bg in App3D u3 audio init.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { backgroundMusic, roomAmbient } from "./content/audio.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const bundlePath = join(ROOT, "assets", "App3D-f554a111.js");

let s = readFileSync(bundlePath, "utf8");

const musicRe =
  /addAudio\(\{name:"music-bg",url:"[^"]+",volume:[\d.]+,autoPlay:!0,loop:!0\}\)/;
const roomRe =
  /addAudio\(\{name:"room-bg",url:"room\.ogg",volume:[\d.]+,autoPlay:!0,loop:!0\}\)/;

if (!musicRe.test(s)) {
  throw new Error("Could not find music-bg addAudio in App3D bundle");
}
if (!roomRe.test(s)) {
  throw new Error("Could not find room-bg addAudio in App3D bundle");
}

s = s.replace(
  musicRe,
  `addAudio({name:"music-bg",url:"${backgroundMusic.url}",volume:${backgroundMusic.volume},autoPlay:!0,loop:!0})`,
);
s = s.replace(
  roomRe,
  `addAudio({name:"room-bg",url:"room.ogg",volume:${roomAmbient.volume},autoPlay:!0,loop:!0})`,
);

writeFileSync(bundlePath, s);
console.log(
  `Patched audio: music-bg → ${backgroundMusic.url} (vol ${backgroundMusic.volume}), room-bg vol ${roomAmbient.volume}`,
);
