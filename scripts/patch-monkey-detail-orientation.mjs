/**
 * Portfolio detail scene: stand monkey interior mesh upright (face toward camera).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const bundlePath = join(ROOT, "assets", "App3D-f554a111.js");

const MARKER = 'this._baseRot="monkey"===this.options.obj?{x:Math.PI/2,y:0,z:Math.PI}:{x:0,y:0,z:0}';

const MARKER_WITH_ROBLOX =
  'this._baseRot="monkey"===this.options.obj?{x:Math.PI/2,y:0,z:Math.PI}:"roblox"===this.options.obj?{x:Math.PI,y:Math.PI,z:0}:{x:0,y:0,z:0}';

const MARKER_FULL =
  'this._baseRot="monkey"===this.options.obj?{x:Math.PI/2,y:0,z:Math.PI}:"roblox"===this.options.obj?{x:Math.PI,y:Math.PI,z:0}:"solana"===this.options.obj?{x:0,y:Math.PI,z:0}:{x:0,y:0,z:0}';

const MARKER_WITH_BULL =
  'this._baseRot="monkey"===this.options.obj?{x:Math.PI/2,y:0,z:Math.PI}:"roblox"===this.options.obj?{x:Math.PI,y:Math.PI,z:0}:"solana"===this.options.obj?{x:0,y:Math.PI,z:0}:"bull"===this.options.obj?{x:Math.PI,y:Math.PI/2,z:0}:{x:0,y:0,z:0}';

const MARKER_WITH_BULL_Y270 =
  'this._baseRot="monkey"===this.options.obj?{x:Math.PI/2,y:0,z:Math.PI}:"roblox"===this.options.obj?{x:Math.PI,y:Math.PI,z:0}:"solana"===this.options.obj?{x:0,y:Math.PI,z:0}:"bull"===this.options.obj?{x:Math.PI,y:Math.PI+Math.PI/2,z:0}:{x:0,y:0,z:0}';

const MARKER_WITH_BULL_Y180 =
  'this._baseRot="monkey"===this.options.obj?{x:Math.PI/2,y:0,z:Math.PI}:"roblox"===this.options.obj?{x:Math.PI,y:Math.PI,z:0}:"solana"===this.options.obj?{x:0,y:Math.PI,z:0}:"bull"===this.options.obj?{x:Math.PI,y:Math.PI,z:0}:{x:0,y:0,z:0}';

const MARKER_WITH_BULL_OLD =
  'this._baseRot="monkey"===this.options.obj?{x:Math.PI/2,y:0,z:Math.PI}:"roblox"===this.options.obj?{x:Math.PI,y:Math.PI,z:0}:"solana"===this.options.obj?{x:0,y:Math.PI,z:0}:"bull"===this.options.obj?{x:Math.PI,y:0,z:0}:{x:0,y:0,z:0}';

const MARKER_WITH_ROBLOX_OLD =
  'this._baseRot="monkey"===this.options.obj?{x:Math.PI/2,y:0,z:Math.PI}:"roblox"===this.options.obj?{x:0,y:Math.PI,z:0}:{x:0,y:0,z:0}';

const USE_ROBLOX_ROT = process.env.ROBLOX_DETAIL_ROT === "1";
const ACTIVE_MARKER = USE_ROBLOX_ROT ? MARKER_WITH_ROBLOX : MARKER;

const LEGACY_MARKERS = [
  'this._baseRotX="monkey"===this.options.obj?-Math.PI/2:0',
  'this._baseRotX="monkey"===this.options.obj?Math.PI/2:0',
];

const OLD_UNPATCHED =
  '})),this.mesh.name="object",this.mesh.frustumCulled=!1,this.mesh.scale.setScalar(this.options.scale),q.devScene&&(this.mesh.visible=this.index===0),this.mesh.onBeforeRender=()=>{const s=.035*this.additionalRotationAmount.value,n=Math.sin(Fe.time*.3+this.options.rand*12.423)*s*Math.sign(this.options.rand-.5),r=Math.sin(Fe.time*.3+this.options.rand*42.987)*s*Math.sign(this.options.rand-.5),a=Math.sin(Fe.time*.3+this.options.rand*2.53)*s*Math.sign(this.options.rand-.5);this.mesh.rotation.set(n,r,a)},this.scene.add(this.mesh),this.isReady()}}class WF{';

const PATCHED_TAIL =
  ',q.devScene&&(this.mesh.visible=this.index===0),this.mesh.onBeforeRender=()=>{const s=.035*this.additionalRotationAmount.value,n=Math.sin(Fe.time*.3+this.options.rand*12.423)*s*Math.sign(this.options.rand-.5),r=Math.sin(Fe.time*.3+this.options.rand*42.987)*s*Math.sign(this.options.rand-.5),a=Math.sin(Fe.time*.3+this.options.rand*2.53)*s*Math.sign(this.options.rand-.5);this.mesh.rotation.set(n+this._baseRot.x,r+this._baseRot.y,a+this._baseRot.z)},this.scene.add(this.mesh),this.isReady()}}class WF{';

const NEW =
  '})),this.mesh.name="object",this.mesh.frustumCulled=!1,this.mesh.scale.setScalar(this.options.scale),' +
  MARKER +
  PATCHED_TAIL;

const NEW_WITH_ROBLOX =
  '})),this.mesh.name="object",this.mesh.frustumCulled=!1,this.mesh.scale.setScalar(this.options.scale),' +
  MARKER_WITH_ROBLOX +
  PATCHED_TAIL;

let s = readFileSync(bundlePath, "utf8");

if (s.includes(MARKER_WITH_BULL_Y270)) {
  s = s.replace(MARKER_WITH_BULL_Y270, MARKER_WITH_BULL);
  writeFileSync(bundlePath, s);
  console.log("Bull detail orientation: Y+90° side profile");
  process.exit(0);
}

if (s.includes(MARKER_WITH_BULL)) {
  console.log("Detail orientation: monkey + roblox + solana + bull");
  process.exit(0);
}

if (s.includes(MARKER_WITH_BULL_Y180)) {
  s = s.replace(MARKER_WITH_BULL_Y180, MARKER_WITH_BULL);
  writeFileSync(bundlePath, s);
  console.log("Bull detail orientation: Y+90°");
  process.exit(0);
}

if (s.includes(MARKER_WITH_BULL_OLD)) {
  s = s.replace(MARKER_WITH_BULL_OLD, MARKER_WITH_BULL_Y180);
  writeFileSync(bundlePath, s);
  console.log("Bull detail orientation: Y+180° (face forward)");
  process.exit(0);
}

if (s.includes(MARKER_FULL)) {
  s = s.replace(MARKER_FULL, MARKER_WITH_BULL_Y180);
  writeFileSync(bundlePath, s);
  console.log("Bull detail orientation: X+180° (upright)");
  process.exit(0);
}

if (s.includes(MARKER_WITH_ROBLOX)) {
  s = s.replace(MARKER_WITH_ROBLOX, MARKER_FULL);
  writeFileSync(bundlePath, s);
  console.log("Solana detail orientation: Y+180° applied");
  process.exit(0);
}

if (s.includes(MARKER_WITH_ROBLOX_OLD)) {
  s = s.replace(MARKER_WITH_ROBLOX_OLD, MARKER_WITH_ROBLOX);
  writeFileSync(bundlePath, s);
  console.log("Roblox detail orientation: X+180° (upright)");
  process.exit(0);
}

if (s.includes(ACTIVE_MARKER)) {
  console.log(
    USE_ROBLOX_ROT
      ? "Monkey + roblox detail orientation: already correct"
      : "Monkey detail orientation: already correct (X+90°, Z+180°)",
  );
  process.exit(0);
}

if (USE_ROBLOX_ROT && s.includes(MARKER) && !s.includes(MARKER_WITH_ROBLOX)) {
  s = s.replace(MARKER, MARKER_WITH_ROBLOX);
  writeFileSync(bundlePath, s);
  console.log("Roblox detail orientation: Y+180° applied");
  process.exit(0);
}

for (const legacy of LEGACY_MARKERS) {
  if (s.includes(legacy)) {
    s = s
      .replace(legacy, MARKER)
      .replace(
        "this.mesh.rotation.set(n+this._baseRotX,r,a)",
        "this.mesh.rotation.set(n+this._baseRot.x,r+this._baseRot.y,a+this._baseRot.z)",
      );
    writeFileSync(bundlePath, s);
    console.log("Monkey detail orientation: X+90° + Z+180° (upright)");
    process.exit(0);
  }
}

if (!s.includes(OLD_UNPATCHED)) {
  throw new Error("VF detail object block not found — bundle may have changed");
}

s = s.replace(OLD_UNPATCHED, USE_ROBLOX_ROT ? NEW_WITH_ROBLOX : NEW);
writeFileSync(bundlePath, s);
console.log("Monkey detail orientation: X+90° + Z+180° applied for interior monkey");
