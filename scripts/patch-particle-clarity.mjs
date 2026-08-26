/**
 * Sharper entry hologram: smaller points, no curl jitter, stronger surface snap, less motion blur.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const path = join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "App3D-f554a111.js");
let s = readFileSync(path, "utf8");
let changed = 0;

const pairs = [
  ["uSize:{value:10}", "uSize:{value:6.5}"],
  [
    "float force1 = 0.00008 * (0.7 + 0.3 * vRand.z) + 0.00015 * additionalNoise;",
    "float force1 = 0.0 * (0.7 + 0.3 * vRand.z) + 0.0 * additionalNoise;",
  ],
  [
    "float force1 = 0.0001 * (0.7 + 0.3 * vRand.z) + 0.0002 * additionalNoise;",
    "float force1 = 0.0 * (0.7 + 0.3 * vRand.z) + 0.0 * additionalNoise;",
  ],
  [
    "float force2 = 0.0015 * (0.7 + 0.3 * vRand.w);",
    "float force2 = 0.0035 * (0.7 + 0.3 * vRand.w);",
  ],
  [
    "float signForce = dist < 0.0 ? 0.35 : -0.3;",
    "float signForce = dist < 0.0 ? 0.85 : -0.45;",
  ],
  [
    "float signForce = mix(0.0, -0.3, sign(dist) + 1.0);",
    "float signForce = dist < 0.0 ? 0.85 : -0.45;",
  ],
  [
    "alpha *= max(uInitialGlow, pow(fit(vVel, 0.002, 0.007, 1.0, 0.0), 2.0) * 0.5 + 0.5);",
    "alpha *= max(uInitialGlow, pow(fit(vVel, 0.004, 0.012, 1.0, 0.0), 2.0) * 0.35 + 0.65);",
  ],
  [
    "float targetShadow = mix(wrapDiffuse * 0.2, wrapDiffuse, smoothstep(-0.05, -0.001, dist));",
    "float targetShadow = mix(wrapDiffuse * 0.45, wrapDiffuse, smoothstep(-0.012, 0.0, dist));",
  ],
];

for (const [from, to] of pairs) {
  if (s.includes(from) && from !== to) {
    s = s.split(from).join(to);
    changed++;
  }
}

if (changed) {
  writeFileSync(path, s);
  console.log(`Particle clarity patch: ${changed} updates`);
} else {
  console.log("Particle clarity patch: already applied or patterns missing");
}
