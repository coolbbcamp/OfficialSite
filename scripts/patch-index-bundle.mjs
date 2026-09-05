import { readFileSync, writeFileSync, statSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = join(ROOT, "assets", "index-2eb69c09.js");
const app3dSource = join(ROOT, "assets", "App3D-f554a111.js");
const app3dRuntime = join(ROOT, "assets", "App3D-coolbb.js");
const htmlPath = join(ROOT, "index.html");

copyFileSync(app3dSource, app3dRuntime);

let s = readFileSync(indexPath, "utf8");
const before = s;
s = s.replaceAll("https://www.igloo.inc/", "/");

if (!s.includes("window.__coolbbBoot")) {
  s = s.replace(
    "(async t=>{let n=null",
    "(async t=>{if(window.__coolbbBoot)return;window.__coolbbBoot=1;let n=null",
  );
}
if (!s.includes("[boot] waiting App3D")) {
  s = s.replace(
    /const o=\(await mt\(\(\)=>import\("\.\/App3D-[^"]+"\),\[\]\)\)\.default,i=await new o\(/,
    'const o=(await mt(()=>import("./App3D-coolbb.js"),[])).default;console.log("[boot] waiting App3D.ready");const i=await new o(',
  );
}
if (!s.includes("loader hide timeout")) {
  s = s.replace(
    "return e&&await new Promise(c=>{e.$on(\"hidden\",()=>{e.$destroy(),c()}),e.hide()})",
    'return e&&await new Promise(c=>{const h=setTimeout(()=>{console.warn("[boot] loader hide timeout — forcing");e.$destroy();c()},3000);e.$on("hidden",()=>{clearTimeout(h);e.$destroy();c()}),e.hide()})',
  );
}

const app3dMtime = Math.floor(statSync(app3dRuntime).mtimeMs);
const importBusted = `./App3D-coolbb.js?v=${app3dMtime}`;
s = s.replace(/import\("\.\/App3D-(?:f554a111|coolbb)\.js(?:\?v=\d+)?"\)/g, `import("${importBusted}")`);

if (s !== before || !s.includes(importBusted)) {
  writeFileSync(indexPath, s);
  console.log(`Patched index bundle: App3D cache-bust ${importBusted}`);
} else {
  console.log(`index bundle already patched (App3D ${importBusted})`);
}

// Cache-bust index.html entry script so browsers reload the index bundle (and new App3D import).
const indexScriptBusted = `/assets/index-2eb69c09.js?v=${Date.now()}`;
let html = readFileSync(htmlPath, "utf8");
html = html.replace(
  /\/assets\/index-2eb69c09\.js(?:\?v=\d+)?/g,
  indexScriptBusted,
);
if (!html.includes('http-equiv="Cache-Control"')) {
  html = html.replace(
    "<head>",
    '<head>\n  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />',
  );
}
writeFileSync(htmlPath, html);
console.log(`Patched index.html: ${indexScriptBusted}`);
