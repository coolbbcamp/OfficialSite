/**
 * Fix missing hologram link titles (CoolBB Agency / X / Contact) on entry scene.
 * vF used alpha-channel sampling + horizontal fade that zeroed label alpha at screen center.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const bundlePath = join(ROOT, "assets", "App3D-f554a111.js");

const FIXED =
  "alpha *= msdf(tMap, uv);\n\n                            gl_FragColor = vec4(uColor, alpha);";

const BROKEN_PATTERNS = [
  // Original igloo shader: alpha smoothstep + horizontal screen fade (zeros center labels).
  "alpha *= smoothstep(0.42, 0.58, texture2D(tMap, uv).a);\n\n                            alpha *= smoothstep(resolution.x * 0.5 + uFadePosition + uFadeMargin, resolution.x * 0.5 + uFadePosition, gl_FragCoord.x);\n                            alpha *= smoothstep(resolution.x * 0.5 - uFadePosition - uFadeMargin, resolution.x * 0.5 - uFadePosition, gl_FragCoord.x);\n\n                            gl_FragColor = vec4(uColor, alpha);",
  // Agency patch accidentally reverts msdf elsewhere; entry vF labels end up as smoothstep-only.
  "alpha *= smoothstep(0.42, 0.58, texture2D(tMap, uv).a);\n\n                            gl_FragColor = vec4(uColor, alpha);",
];

let s = readFileSync(bundlePath, "utf8");

if (s.includes(FIXED)) {
  const stillBroken = BROKEN_PATTERNS.some((p) => s.includes(p));
  if (!stillBroken) {
    console.log("Entry link text shader already fixed — no changes.");
    process.exit(0);
  }
}

let patched = false;
for (const broken of BROKEN_PATTERNS) {
  if (s.includes(broken)) {
    s = s.replace(broken, FIXED);
    patched = true;
  }
}

if (!patched) {
  throw new Error("Could not find entry link text shader block to patch");
}
writeFileSync(bundlePath, s);
console.log("OK fixed entry hologram link title text (msdf shader)");
