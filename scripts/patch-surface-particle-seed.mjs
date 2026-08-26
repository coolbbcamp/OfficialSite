/**
 * Load surface-seeded particle positions from models/monkey/particle_seed.bin
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const path = join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "App3D-f554a111.js");
let s = readFileSync(path, "utf8");

const old =
  "const t=ie.getTextureSizeParticles(this.particles),s=new Float32Array(t*t*4);for(let l=0;l<this.particles;l++)s[l*4+0]=ie.fit(Math.random(),0,1,-this.cubeSize*.5,this.cubeSize*.5),s[l*4+1]=ie.fit(Math.random(),0,1,-this.cubeSize*.5,this.cubeSize*.5),s[l*4+2]=ie.fit(Math.random(),0,1,-this.cubeSize*.5,this.cubeSize*.5),s[l*4+3]=Math.random();";

const neu =
  "const t=ie.getTextureSizeParticles(this.particles),s=new Float32Array(t*t*4);let _surf=!1;try{const _r=await fetch(\"/models/monkey/particle_seed.bin\");if(_r.ok){s.set(new Float32Array(await _r.arrayBuffer()).subarray(0,s.length));_surf=!0;}}catch(_e){}if(!_surf)for(let l=0;l<this.particles;l++)s[l*4+0]=ie.fit(Math.random(),0,1,-this.cubeSize*.5,this.cubeSize*.5),s[l*4+1]=ie.fit(Math.random(),0,1,-this.cubeSize*.5,this.cubeSize*.5),s[l*4+2]=ie.fit(Math.random(),0,1,-this.cubeSize*.5,this.cubeSize*.5),s[l*4+3]=Math.random();";

if (s.includes("_surf=!1;try{const _r=await fetch(\"/models/monkey/particle_seed.bin\")")) {
  console.log("Surface particle seed patch already applied");
} else if (!s.includes(old)) {
  console.log("Particle init block not found — skipping surface seed patch");
} else {
  s = s.replace(old, neu);
  writeFileSync(path, s);
  console.log("Patched wF: load surface-seeded particles from /models/monkey/particle_seed.bin");
}
