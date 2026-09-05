/**
 * CoolBB logo (LF): crisp white letters — no glitch shader, no 3D mesh.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const bundlePath = join(ROOT, "assets", "App3D-f554a111.js");

const LF_CLASS = `class LF{constructor(e){this.scene=e,this.ready=new Promise(t=>{this.isReady=t}),this.init()}init(){const e=new kt;e.translate(.5,-.5,0),this.mesh=new Ce(e,new fe({uniforms:{tMap:{value:le.load("ui/logo-datatexture.ktx2","srgb")},uColor:{value:new Z(Be.colorLogo)},uShow:{value:q.devScene?1:0}},vertexShader:\`
                \${Nt}

                varying vec2 vUv;
                flat varying vec2 vScale;

                void main() {
                    vUv = uv;
                    vScale = getMatrixScale(modelMatrix).xy;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            \`,fragmentShader:\`
                \${ii}
                \${Lc}

                uniform sampler2D tMap;
                uniform vec3 uColor;
                uniform float uShow;

                varying vec2 vUv;
                flat varying vec2 vScale;

                void main() {
                    vec2 uv = imagefitUV(vUv, vec2(textureSize(tMap, 0)), vScale, 1.0);
                    vec4 tex = texture2D(tMap, uv);
                    float a = tex.a * clamp(uShow, 0.0, 1.0);
                    gl_FragColor = vec4(uColor, a);
                }
            \`,depthWrite:!1,depthTest:!1,transparent:!0})),this.mesh.name="logo",this.mesh.frustumCulled=!1,this.mesh.renderOrder=10,this.scene.add(this.mesh),this.interaction=new Er({meshes:[this.mesh],camera:this.scene.camera,onHover:t=>{t.action==="hover_in"&&(this.show(.25,0),Q.emit("webgl_hover_logo"),Q.emit("webgl_play_audio","logo"))}}),Q.once("webgl_show_ui_intro",()=>{this.interaction.enable(),this.show(),Q.emit("webgl_play_audio","logo")}),q.devScene&&this.interaction.enable(),this.isReady()}show(e=.5,t=.75){re.fromTo(this.mesh.material.uniforms.uShow,{value:0},{delay:t,value:1,duration:e,ease:"sine.out",overwrite:!0})}resize(){const e=this.scene.mobile?140:this.scene.small?160:200,t=e*.21;this.mesh.scale.set(e,t,1),this.mesh.position.set(this.scene.meshMarginLeft,-this.scene.meshMarginTop,0)}}`;

let bundle = readFileSync(bundlePath, "utf8");
const start = bundle.indexOf("class LF{");
const end = bundle.indexOf("class FF{", start);
if (start < 0 || end < 0) {
  throw new Error("Could not find LF class in App3D bundle");
}

bundle = bundle.slice(0, start) + LF_CLASS + bundle.slice(end);
writeFileSync(bundlePath, bundle);

const check = spawnSync(process.execPath, ["--check", bundlePath], { encoding: "utf8" });
if (check.status !== 0) {
  throw new Error(`App3D syntax check failed:\n${check.stderr || check.stdout}`);
}

const lf = LF_CLASS;
if (!lf.includes('le.load("ui/logo-datatexture.ktx2')) {
  throw new Error("Logo patch failed — logo-datatexture.ktx2 load missing");
}
if (lf.includes("msdf(tMap, uv)")) {
  throw new Error("Logo patch failed — LF still uses msdf()");
}
if (lf.includes('zt.load("coolbb.drc")')) {
  throw new Error("Logo patch failed — coolbb.drc still referenced");
}

console.log("OK patched LF logo → clean CoolBB letters");
