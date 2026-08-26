import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(ROOT, "assets", "App3D-f554a111.js");

let s = readFileSync(path, "utf8");
const marker = "RE(async()=>{if(!q.capabilities.webgl2)";
if (!s.includes(marker)) {
  console.log("App3D boot marker not found — skipping boot diagnostics");
} else if (s.includes("[boot] he.init")) {
  console.log("App3D boot diagnostics already present");
} else {

const oldBlock =
  "RE(async()=>{if(!q.capabilities.webgl2){s(()=>!1),t(2,c=!0);return}t(1,l=!0),await Promise.all([LE(),h()]),Ei.create(\"inOut5\",\"M0,0 C0.171,0 0.77,-0.013 0.842,0.272 0.972,0.794 0.972,0.85 1,1\"),Ei.create(\"entry_ease\",\"M0,0 C0.358,0 0.336,0.209 0.442,0.519 0.59,0.952 0.768,0.918 1,1\",{precision:2}),Ei.create(\"entry_ease_2\",\"M0,0 C0.388,0.082 0.924,0.862 1,1\",{precision:2}),Ei.create(\"entry_ease_3\",\"M0,0 C0.272,0 0.472,0.454 0.496,0.496 0.66,0.79 0.685,1 1,1\",{precision:2}),Ei.create(\"igloo_ease_1\",\"M0,0 C0.662,0.073 0.047,1 1,1\",{precision:2});const u=window.devicePixelRatio<=2?Math.min(window.devicePixelRatio,1.15):Math.min(window.devicePixelRatio,1.5);await he.init({canvasCnt:o,interactionNode:r,relativePath:a,fingers:2,audioContext:!0,contextMenu:!1,DPR:u||1,adaptiveDPR:!0,shadowMap:!0,shadowMapType:ly});{const f=new jF;await f.ready,f.start(),s(()=>!0)}});";

const newBlock =
  "RE(async()=>{try{if(!q.capabilities.webgl2){s(()=>!1),t(2,c=!0);return}t(1,l=!0),console.log(\"[boot] svelte flush\"),await Promise.all([LE(),h()]),console.log(\"[boot] eases\"),Ei.create(\"inOut5\",\"M0,0 C0.171,0 0.77,-0.013 0.842,0.272 0.972,0.794 0.972,0.85 1,1\"),Ei.create(\"entry_ease\",\"M0,0 C0.358,0 0.336,0.209 0.442,0.519 0.59,0.952 0.768,0.918 1,1\",{precision:2}),Ei.create(\"entry_ease_2\",\"M0,0 C0.388,0.082 0.924,0.862 1,1\",{precision:2}),Ei.create(\"entry_ease_3\",\"M0,0 C0.272,0 0.472,0.454 0.496,0.496 0.66,0.79 0.685,1 1,1\",{precision:2}),Ei.create(\"igloo_ease_1\",\"M0,0 C0.662,0.073 0.047,1 1,1\",{precision:2});const u=window.devicePixelRatio<=2?Math.min(window.devicePixelRatio,1.15):Math.min(window.devicePixelRatio,1.5);console.log(\"[boot] he.init\"),await he.init({canvasCnt:o,interactionNode:r,relativePath:a,fingers:2,audioContext:!0,contextMenu:!1,DPR:u||1,adaptiveDPR:!0,shadowMap:!0,shadowMapType:ly});console.log(\"[boot] jF\");{const f=new jF;await f.ready,console.log(\"[boot] jF.ready\"),f.start(),s(()=>!0)}}catch(err){console.error(\"[boot] App3D init failed\",err),s(()=>!1)}});";

if (!s.includes(oldBlock)) throw new Error("App3D boot block mismatch");
s = s.replace(oldBlock, newBlock);
writeFileSync(path, s);
console.log("Patched App3D boot diagnostics");
}
