/**
 * Restore original Igloo entry-particle simulation (X icon, link carousel, etc.).
 * Reverts monkey-only clarity/constraint/surface-seed patches that broke x_64.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const path = join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "App3D-f554a111.js");
let s = readFileSync(path, "utf8");
let changed = 0;

const pairs = [
  // surface seed → random cube spawn (required for X / Medium link morph)
  [
    "let _surf=!1;try{const _r=await fetch(\"/models/monkey/particle_seed.bin\");if(_r.ok){s.set(new Float32Array(await _r.arrayBuffer()).subarray(0,s.length));_surf=!0;}}catch(_e){}if(!_surf)for(let l=0;l<this.particles;l++)s[l*4+0]=ie.fit(Math.random(),0,1,-this.cubeSize*.5,this.cubeSize*.5),s[l*4+1]=ie.fit(Math.random(),0,1,-this.cubeSize*.5,this.cubeSize*.5),s[l*4+2]=ie.fit(Math.random(),0,1,-this.cubeSize*.5,this.cubeSize*.5),s[l*4+3]=Math.random();",
    "for(let l=0;l<this.particles;l++)s[l*4+0]=ie.fit(Math.random(),0,1,-this.cubeSize*.5,this.cubeSize*.5),s[l*4+1]=ie.fit(Math.random(),0,1,-this.cubeSize*.5,this.cubeSize*.5),s[l*4+2]=ie.fit(Math.random(),0,1,-this.cubeSize*.5,this.cubeSize*.5),s[l*4+3]=Math.random();",
  ],
  // point size
  ["uColorFast:{value:new Z(\"#eef6ff\")},uSize:{value:6.5}", "uColorFast:{value:new Z(\"#eef6ff\")},uSize:{value:10}"],
  ["uColorFast:{value:new Z(\"#d7ebfa\")},uSize:{value:6.5}", "uColorFast:{value:new Z(\"#d7ebfa\")},uSize:{value:10}"],
  ["uColorFast:{value:new Z(\"#e8edf4\")},uSize:{value:6.5}", "uColorFast:{value:new Z(\"#e8edf4\")},uSize:{value:10}"],
  // curl noise
  [
    "float force1 = 0.0 * (0.7 + 0.3 * vRand.z) + 0.0 * additionalNoise;",
    "float force1 = 0.0002 * (0.7 + 0.3 * vRand.z) + 0.0004 * additionalNoise;",
  ],
  [
    "float force1 = 0.00008 * (0.7 + 0.3 * vRand.z) + 0.00015 * additionalNoise;",
    "float force1 = 0.0002 * (0.7 + 0.3 * vRand.z) + 0.0004 * additionalNoise;",
  ],
  [
    "float force1 = 0.0001 * (0.7 + 0.3 * vRand.z) + 0.0002 * additionalNoise;",
    "float force1 = 0.0002 * (0.7 + 0.3 * vRand.z) + 0.0004 * additionalNoise;",
  ],
  // surface snap
  [
    "float force2 = 0.0035 * (0.7 + 0.3 * vRand.w);",
    "float force2 = 0.0015 * (0.7 + 0.3 * vRand.w);",
  ],
  [
    "float signForce = dist < 0.0 ? 0.85 : -0.45;",
    "float signForce = mix(0.0, -0.3, sign(dist) + 1.0);",
  ],
  [
    "float signForce = dist < 0.0 ? 0.35 : -0.3;",
    "float signForce = mix(0.0, -0.3, sign(dist) + 1.0);",
  ],
  // bounds: Igloo cylinder (not full cube)
  [
    "currentPos.xyz = clamp(currentPos.xyz, vec3(-positionLimit), vec3(positionLimit));",
    "currentPos.y = clamp(currentPos.y, -0.34, 0.35);\n                        currentPos.xz = normalize(currentPos.xz) * clamp(length(currentPos.xz), 0.0, 0.275);",
  ],
  // motion blur
  [
    "alpha *= max(uInitialGlow, pow(fit(vVel, 0.004, 0.012, 1.0, 0.0), 2.0) * 0.35 + 0.65);",
    "alpha *= max(uInitialGlow, pow(fit(vVel, 0.002, 0.007, 1.0, 0.0), 2.0) * 0.5 + 0.5);",
  ],
  // interior shading
  [
    "float targetShadow = mix(wrapDiffuse * 0.45, wrapDiffuse, smoothstep(-0.012, 0.0, dist));",
    "float targetShadow = mix(wrapDiffuse * 0.2, wrapDiffuse, smoothstep(-0.05, -0.001, dist));",
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
  console.log(`Restored original Igloo particle params (${changed} updates)`);
} else {
  console.log("Original particle params already in place");
}

const markers = [
  "uSize:{value:10}",
  "float force1 = 0.0002 * (0.7 + 0.3 * vRand.z) + 0.0004 * additionalNoise;",
  "float signForce = mix(0.0, -0.3, sign(dist) + 1.0);",
  "currentPos.y = clamp(currentPos.y, -0.34, 0.35);",
];
for (const m of markers) {
  if (!s.includes(m)) {
    throw new Error(`Revert incomplete — missing: ${m}`);
  }
}
if (s.includes("particle_seed.bin")) {
  throw new Error("Revert incomplete — surface seed still present");
}
