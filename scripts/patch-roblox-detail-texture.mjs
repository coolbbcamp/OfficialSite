/**
 * Portfolio detail: roblox uses the same holographic fe shader as monkey (no color texture).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const bundlePath = join(ROOT, "assets", "App3D-f554a111.js");

const READY_FIX = '}));this.mesh.name="object"';
const HOLO_START =
  "this.mesh=new Ce(e,new fe({uniformsGroups:[he.UBO],uniforms:{tMap:{value:le.load(`${this.options.obj}_dark_color.ktx2`)";

const ROBLOX_COLOR_BRANCH =
  'if("roblox"===this.options.obj){const t=le.load("cubes/roblox_color.ktx2","srgb");await t._loaded,this.mesh=new Ce(e,new or({map:t})),window.__coolbbRobloxDetail={materialType:this.mesh.material.type,textureReady:!0}}else this.mesh=new Ce(e,new fe({uniformsGroups:[he.UBO],uniforms:{tMap:{value:le.load(`${this.options.obj}_dark_color.ktx2`)';

const ROBLOX_SOLID_BRANCH =
  'if("roblox"===this.options.obj){this.mesh=new Ce(e,new or({color:11053256})),window.__coolbbRobloxDetail={materialType:this.mesh.material.type,textureReady:!0}}else ';

function syntaxCheck() {
  const r = spawnSync(process.execPath, ["--check", bundlePath], { encoding: "utf8" });
  if (r.status !== 0) {
    throw new Error(`App3D syntax check failed:\n${r.stderr || r.stdout}`);
  }
}

function fixReadyTail(s) {
  const vfStart = s.indexOf("class VF");
  const vfEnd = s.indexOf("class WF", vfStart);
  if (vfStart < 0 || vfEnd < 0) return s;
  const vf = s.slice(vfStart, vfEnd);
  if (vf.includes(READY_FIX)) return s;
  const broken = '`})),this.mesh.name="object"';
  if (!vf.includes(broken)) return s;
  return s.slice(0, vfStart) + vf.replace(broken, READY_FIX) + s.slice(vfEnd);
}

function fixDuplicateInit(s) {
  const dup =
    "async init(){const e=await zt.load(`${this.options.obj}.drc`);async init(){const e=await zt.load(`${this.options.obj}.drc`);";
  if (!s.includes(dup)) return s;
  return s.replace(
    dup,
    "async init(){const e=await zt.load(`${this.options.obj}.drc`);",
  );
}

function alreadyHolo(s) {
  const vfStart = s.indexOf("class VF");
  const vfEnd = s.indexOf("class WF", vfStart);
  const vf = s.slice(vfStart, vfEnd);
  return (
    !vf.includes('le.load("cubes/roblox_color.ktx2","srgb")') &&
    !vf.includes("new or({color:") &&
    vf.includes(HOLO_START)
  );
}

let s = readFileSync(bundlePath, "utf8");
s = fixDuplicateInit(s);

if (alreadyHolo(s)) {
  writeFileSync(bundlePath, fixReadyTail(s));
  syntaxCheck();
  console.log("Roblox detail material: holo shader (like monkey)");
  process.exit(0);
}

const loadPrefix = "async init(){const e=await zt.load(`${this.options.obj}.drc`);";

if (s.includes(ROBLOX_COLOR_BRANCH)) {
  s = s.replace(ROBLOX_COLOR_BRANCH, HOLO_START);
} else if (s.includes(ROBLOX_SOLID_BRANCH)) {
  s = s.replace(ROBLOX_SOLID_BRANCH, "");
} else if (s.includes(loadPrefix + HOLO_START)) {
  // already holo
} else {
  throw new Error("VF roblox init block not recognized");
}

s = fixReadyTail(s);
s = s.replace(
  'this.mesh.name="object",this.mesh.frustumCulled=!1',
  'this.mesh.name="object","roblox"===this.options.obj&&(window.__coolbbRobloxDetail={materialType:this.mesh.material.type,textureReady:!0}),this.mesh.frustumCulled=!1',
);
writeFileSync(bundlePath, fixDuplicateInit(s));
syntaxCheck();
console.log("Roblox detail material: holo shader (like monkey)");
