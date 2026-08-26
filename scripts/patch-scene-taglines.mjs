/**
 * Inject igloo scene ground tagline: load camp.glb directly in the scene.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const bundlePath = join(ROOT, "assets", "App3D-f554a111.js");

const GROUND_CLASS =
  'class _CoolBBGroundCamp{constructor(e){this.scene=e,this.ready=new Promise(t=>{this.isReady=t}),this.init()}async init(){try{const e=await zt.load("ground_camp_text.drc"),t=new fe({uniformsGroups:[he.UBO],uniforms:{tMap:{value:le.load("igloo/ground_camp_text_color.ktx2","srgb")},uAlpha:{value:1}},vertexShader:`\n                ${ae}\n\n                varying vec2 vUv;\n\n                void main() {\n                    vUv = uv;\n                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n                }\n            `,fragmentShader:`\n                ${ae}\n                ${Ue}\n\n                uniform sampler2D tMap;\n                uniform float uAlpha;\n\n                varying vec2 vUv;\n\n                void main() {\n                    vec3 c = texture2D(tMap, vUv).rgb;\n                    c += vec3(0.12, 0.28, 0.45);\n                    gl_FragColor = vec4(c, uAlpha);\n                }\n            `,side:ei,depthWrite:!0,depthTest:!0}),s=new Ce(e,t);s.name="ground_camp_text",s.visible=!0,s.renderOrder=12,s.frustumCulled=!1,s.rotation.y=-Math.PI*.35,s.position.set(0,.08,2),s.updateMatrixWorld(!0);const n=new wo();n.setFromObject(s),s.position.y-=n.min.y,s.position.y+=.08,s.matrixAutoUpdate=!1,s.updateMatrixWorld(!0),this.mesh=s,this.scene.add(s)}catch(e){console.warn("ground camp text failed",e)}this.isReady()}update(){}}';

const INIT_MARKER =
  "await Promise.all([this.createMountains(),this.createSmoke(),this.createIglooBase(),this.createIglooCage(),this.createIglooOutline(),this.createIgloo(),this.createTerrain(),this.createTerrainPatches(),this.createSky(),this.createManifesto(),this.createIntroParticles(),this.createSnowParticles()])";

const INIT_REPLACEMENT =
  "await Promise.all([this.createMountains(),this.createSmoke(),this.createIglooBase(),this.createIglooCage(),this.createIglooOutline(),this.createIgloo(),this.createTerrain(),this.createTerrainPatches(),this.createSky(),this.createManifesto(),this.createGroundCampText(),this.createIntroParticles(),this.createSnowParticles()])";

const CREATE_METHODS =
  "async createGroundCampText(){this.groundCampText=new _CoolBBGroundCamp(this),await this.groundCampText.ready}";

const UPDATE_MARKER =
  "(e=this.manifesto)==null||e.update(this.progress,this._needsReset),this._windVolume=ie.fit(this.progress";

const UPDATE_REPLACEMENT =
  "(e=this.groundCampText)==null||e.update(),(e=this.manifesto)==null||e.update(this.progress,this._needsReset),this._windVolume=ie.fit(this.progress";

let s = readFileSync(bundlePath, "utf8");

const skyStart = s.indexOf("class _CoolBBSkyMarkets");
const f3Start = s.indexOf("class F3 extends Jo");
if (skyStart >= 0 && f3Start > skyStart) {
  s = s.slice(0, skyStart) + s.slice(f3Start);
}
s = s.replace(
  "this.createGroundCampText(),this.createSkyMarketsText(),",
  "this.createGroundCampText(),",
);
s = s.replace(
  "async createSkyMarketsText(){this.skyMarketsText=new _CoolBBSkyMarkets(this),await this.skyMarketsText.ready}",
  "",
);
s = s.replace(
  "(e=this.groundCampText)==null||e.update(),(e=this.skyMarketsText)==null||e.update(),",
  "(e=this.groundCampText)==null||e.update(),",
);

if (!s.includes("class _CoolBBGroundCamp")) {
  const anchor = "class F3 extends Jo";
  if (!s.includes(anchor)) throw new Error("Could not find F3 class anchor");
  s = s.replace(anchor, GROUND_CLASS + anchor);
} else {
  s = s.replace(/class _CoolBBGroundCamp\{[\s\S]*?update\(\)\{[\s\S]*?\}\}/, GROUND_CLASS);
}

if (!s.includes("createGroundCampText")) {
  s = s.replace(
    "async createManifesto(){this.manifesto=new L3(this),await this.manifesto.ready}createIntroTimeline()",
    `async createManifesto(){this.manifesto=new L3(this),await this.manifesto.ready}${CREATE_METHODS}createIntroTimeline()`,
  );
}

if (!s.includes("this.createGroundCampText()")) {
  if (!s.includes(INIT_MARKER)) throw new Error("Could not find F3 init Promise.all block");
  s = s.replace(INIT_MARKER, INIT_REPLACEMENT);
}

if (!s.includes("(e=this.groundCampText)")) {
  if (!s.includes(UPDATE_MARKER)) throw new Error("Could not find F3 update hook");
  s = s.replace(UPDATE_MARKER, UPDATE_REPLACEMENT);
}

s = s.replace("vec2(Fe.time*0.02,0)).r", "vec2(time*0.02,0)).r");
s = s.replace(
  /fragmentShader:`\s*\$\{ii\}\s*uniform sampler2D tMap;\s*uniform sampler2D tWind;/,
  "fragmentShader:`\n                ${ae}\n                ${Ue}\n                uniform sampler2D tMap;\n                uniform sampler2D tWind;",
);

const MANIFESTO_SHOW =
  "(t||e<.15)&&this.hide(),this.canBeShown&&e>.25&&e<.8&&this.show()";
const MANIFESTO_HIDE_ONLY = "(t||e<.15)&&this.hide()";
const MANIFESTO_BROKEN =
  "(t||e<.15)&&this.hide(),/* manifesto panel hidden — scene taglines */";

if (s.includes(MANIFESTO_BROKEN)) {
  s = s.replace(MANIFESTO_BROKEN, MANIFESTO_HIDE_ONLY);
} else if (s.includes(MANIFESTO_SHOW)) {
  s = s.replace(MANIFESTO_SHOW, MANIFESTO_HIDE_ONLY);
}

writeFileSync(bundlePath, s);

const checks = [
  "class _CoolBBGroundCamp",
  "zt.load(\"ground_camp_text.drc\")",
  "createGroundCampText",
];
const bans = ["class _CoolBBSkyMarkets", "createSkyMarketsText", "HARD MARKETS", "_g.loadAsync(\"camp.glb\")"];
for (const c of checks) {
  if (!s.includes(c)) throw new Error(`Scene taglines patch failed — missing: ${c}`);
}
for (const b of bans) {
  if (s.includes(b)) throw new Error(`Scene taglines patch failed — still has: ${b}`);
}

console.log("OK patched igloo ground camp tagline (ground_camp_text.drc)");
