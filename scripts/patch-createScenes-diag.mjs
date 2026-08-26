import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(ROOT, "assets", "App3D-f554a111.js");

let s = readFileSync(path, "utf8");
if (s.includes("[boot] createScenes ui")) {
  console.log("createScenes diagnostics already present");
} else {

const old =
  "async createScenes(){this.uiScene=new GF({mainController:this}),this.uiPass=new h3(this.uiScene,this.uiScene.camera,void 0,!1,!1),this.uiPass.clear=!1,he.composer.addPass(this.uiPass),Object.keys(ty).forEach(e=>{this.scrollComposers.push(new tA({scene:new ty[e]({mainController:this})}))}),this.detailScene=new JF({mainController:this}),this.detailComposer=new tA({scene:this.detailScene}),await Promise.all([this.uiScene.uploaded,...this.scrollComposers.map(e=>e.passes[0].scene.uploaded),this.detailComposer.passes[0].scene.uploaded]),this.uiScene.projects.setMouseSim(this.detailScene.mouseSim)}";

const neu =
  "async createScenes(){console.log(\"[boot] createScenes start\");this.uiScene=new GF({mainController:this}),this.uiPass=new h3(this.uiScene,this.uiScene.camera,void 0,!1,!1),this.uiPass.clear=!1,he.composer.addPass(this.uiPass),Object.keys(ty).forEach(e=>{this.scrollComposers.push(new tA({scene:new ty[e]({mainController:this})}))}),this.detailScene=new JF({mainController:this}),this.detailComposer=new tA({scene:this.detailScene}),console.log(\"[boot] awaiting ui.uploaded\"),await this.uiScene.uploaded,console.log(\"[boot] ui.uploaded ok\");for(let e=0;e<this.scrollComposers.length;e++){const t=this.scrollComposers[e].passes[0].scene;console.log(\"[boot] awaiting scene\",e,t.constructor.name),await t.uploaded,console.log(\"[boot] scene uploaded\",e)}console.log(\"[boot] awaiting detail.uploaded\"),await this.detailComposer.passes[0].scene.uploaded,console.log(\"[boot] createScenes done\"),this.uiScene.projects.setMouseSim(this.detailScene.mouseSim)}";

if (!s.includes(old)) {
  console.log("createScenes block mismatch — skipping boot diagnostics (already patched or bundle changed)");
} else {
  s = s.replace(old, neu);
  writeFileSync(path, s);
  console.log("Patched createScenes boot diagnostics");
}
}
