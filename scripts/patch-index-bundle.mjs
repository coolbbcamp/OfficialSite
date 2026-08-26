import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = join(ROOT, "assets", "index-2eb69c09.js");

let s = readFileSync(indexPath, "utf8");
const before = s;
s = s.replaceAll("https://www.igloo.inc/", "/");
// Guard: index must not boot twice (happens if index.html uses ?v= but App3D imports ./index without query).
if (!s.includes("window.__coolbbBoot")) {
  s = s.replace(
    "(async t=>{let n=null",
    "(async t=>{if(window.__coolbbBoot)return;window.__coolbbBoot=1;let n=null"
  );
}
if (!s.includes("[boot] waiting App3D")) {
  s = s.replace(
    "const o=(await mt(()=>import(\"./App3D-f554a111.js\"),[])).default,i=await new o({target:n,props:{interactionNode:t==null?void 0:t.interactionNode,relativePath:t==null?void 0:t.relativePath},...e?{anchor:e.getEl()}:{}}).ready",
    "const o=(await mt(()=>import(\"./App3D-f554a111.js\"),[])).default;console.log(\"[boot] waiting App3D.ready\");const i=await new o({target:n,props:{interactionNode:t==null?void 0:t.interactionNode,relativePath:t==null?void 0:t.relativePath},...e?{anchor:e.getEl()}:{}}).ready;console.log(\"[boot] App3D.ready done\",i)"
  );
}
if (!s.includes("loader hide timeout")) {
  s = s.replace(
    "return e&&await new Promise(c=>{e.$on(\"hidden\",()=>{e.$destroy(),c()}),e.hide()})",
    "return e&&await new Promise(c=>{const h=setTimeout(()=>{console.warn(\"[boot] loader hide timeout — forcing\");e.$destroy();c()},3000);e.$on(\"hidden\",()=>{clearTimeout(h);e.$destroy();c()}),e.hide()})"
  );
}
if (s === before) {
  console.log("index bundle already patched");
} else {
  writeFileSync(indexPath, s);
  console.log("Patched index bundle: igloo.inc URLs → local paths");
}
