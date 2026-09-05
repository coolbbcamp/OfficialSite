/**
 * Cube scroll inner mesh: standard KTX2 for all inner objects including roblox.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const bundlePath = join(ROOT, "assets", "App3D-f554a111.js");

const STANDARD =
  'this.mesh3=new Ce(t,new or({map:le.load(`cubes/${this.options.innerobject}_color.ktx2`)}))';

const LEGACY_SOLID =
  /this\.mesh3=new Ce\(t,new or\("roblox"===this\.options\.innerobject\?\{color:\d+\}:\{map:le\.load\(`cubes\/\$\{this\.options\.innerobject\}_color\.ktx2`\)\}\)\)/;

const LEGACY_FLIP =
  'this.mesh3=new Ce(t,new or({map:le.load("roblox"===this.options.innerobject?"cubes/roblox_color.png":`cubes/${this.options.innerobject}_color.ktx2`,"roblox"===this.options.innerobject?"srgb":"default")})),"roblox"===this.options.innerobject&&this.mesh3.material.map._loaded.then(()=>{this.mesh3.material.map.flipY=!1})';

function syntaxCheck() {
  const r = spawnSync(process.execPath, ["--check", bundlePath], { encoding: "utf8" });
  if (r.status !== 0) {
    throw new Error(`App3D syntax check failed:\n${r.stderr || r.stdout}`);
  }
}

let s = readFileSync(bundlePath, "utf8");

if (s.includes(STANDARD) && !s.includes("innerobject?{color:")) {
  syntaxCheck();
  console.log("Roblox cube texture: standard KTX2 load");
  process.exit(0);
}

if (LEGACY_SOLID.test(s)) {
  s = s.replace(LEGACY_SOLID, STANDARD);
} else if (s.includes(LEGACY_FLIP)) {
  s = s.replace(LEGACY_FLIP, STANDARD);
} else if (!s.includes(STANDARD)) {
  throw new Error("Cube mesh3 inner texture block not found");
}

writeFileSync(bundlePath, s);
syntaxCheck();
console.log("Roblox cube texture: standard KTX2 load applied");
