/**
 * Entry particles: use full cube bounds (not Igloo penguin cylinder) so monkey GLB shape isn't crushed.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const path = join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "App3D-f554a111.js");
let s = readFileSync(path, "utf8");

const old =
  "currentPos.y = clamp(currentPos.y, -0.34, 0.35);\n                        currentPos.xz = normalize(currentPos.xz) * clamp(length(currentPos.xz), 0.0, 0.275);";

const neu =
  "currentPos.xyz = clamp(currentPos.xyz, vec3(-positionLimit), vec3(positionLimit));";

if (s.includes(neu)) {
  console.log("Particle cube clamp already patched");
} else if (!s.includes(old)) {
  console.log("Particle clamp block not found — skipping");
} else {
  s = s.replace(old, neu);
  writeFileSync(path, s);
  console.log("Patched entry particles: cylinder clamp → cube clamp (full GLB silhouette)");
}

const noiseOld =
  "float force1 = 0.0002 * (0.7 + 0.3 * vRand.z) + 0.0004 * additionalNoise;";
const noiseNeu =
  "float force1 = 0.00008 * (0.7 + 0.3 * vRand.z) + 0.00015 * additionalNoise;";

if (s.includes(noiseNeu)) {
  console.log("Particle curl noise already reduced");
} else if (s.includes(noiseOld)) {
  s = s.replace(noiseOld, noiseNeu);
  writeFileSync(path, s);
  console.log("Reduced entry particle curl noise");
} else if (s.includes("float force1 = 0.0001 *")) {
  s = s.replace(
    "float force1 = 0.0001 * (0.7 + 0.3 * vRand.z) + 0.0002 * additionalNoise;",
    noiseNeu,
  );
  writeFileSync(path, s);
  console.log("Reduced entry particle curl noise (v2)");
}

const forceOld = "float signForce = mix(0.0, -0.3, sign(dist) + 1.0);";
const forceNeu = "float signForce = dist < 0.0 ? 0.35 : -0.3;";

if (s.includes(forceNeu)) {
  console.log("Particle surface attraction already patched");
} else if (s.includes(forceOld)) {
  s = s.replace(forceOld, forceNeu);
  writeFileSync(path, s);
  console.log("Patched particles to hug volume surface (less interior fuzz)");
}
