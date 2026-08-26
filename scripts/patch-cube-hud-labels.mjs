/**
 * Cube HUD label hierarchy: cyan hero service title vs muted TEMP/date metadata.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const bundlePath = join(ROOT, "assets", "App3D-f554a111.js");

function patchBetween(s, start, end, fn) {
  const i = s.indexOf(start);
  if (i < 0) throw new Error(`Could not find ${start}`);
  const j = s.indexOf(end, i + start.length);
  if (j < 0) throw new Error(`Could not find ${end} after ${start}`);
  const block = s.slice(i, j);
  const patched = fn(block);
  if (patched === block) {
    console.warn(`No changes in block ${start} … ${end}`);
  }
  return s.slice(0, i) + patched + s.slice(j);
}

let s = readFileSync(bundlePath, "utf8");

if (s.includes("class YL") && s.includes("uColor:{value:new Z(Be.colorTitle)}")) {
  const ylBlock = s.slice(s.indexOf("class YL"), s.indexOf("class qL"));
  if (ylBlock.includes("uColor:{value:new Z(Be.colorTitle)}")) {
    console.log("Cube HUD labels already patched");
    process.exit(0);
  }
}

s = patchBetween(s, "class YL{", "class qL{", (block) => {
  let b = block;
  b = b.replace(
    "new ga({color:\"#ffffff\",opacity:1,transparent:!0})",
    "new ga({color:\"#00D4EE\",opacity:1,transparent:!0})",
  );
  b = b.replace(
    "text:this.parent.options.title.toUpperCase(),width:1,align:\"left\",lineHeight:.8,size:.13},{uniforms:{tMap:{value:le.load(\"../fonts/IBMPlexMono-Medium-datatexture.ktx2\",\"data\")},uColor:{value:new Z(\"#ffffff\")}",
    "text:this.parent.options.title.toUpperCase(),width:1,align:\"left\",lineHeight:.8,size:.17},{uniforms:{tMap:{value:le.load(\"../fonts/IBMPlexMono-Medium-datatexture.ktx2\",\"data\")},uColor:{value:new Z(Be.colorTitle)}",
  );
  b = b.replace(
    "alpha *= msdf(tMap, uv);\n                    gl_FragColor = vec4(uColor, alpha);",
    "alpha *= msdf(tMap, uv);\n                    vec3 color = uColor + uColor * alpha * 0.35;\n                    gl_FragColor = vec4(color, alpha);",
  );
  b = b.replace(
    "Math.min(.8,.5/(q.screen.h/1300))",
    "Math.min(.95,.6/(q.screen.h/1300))",
  );
  return b;
});

s = patchBetween(s, "class qL{", "class XL{", (block) => {
  let b = block;
  b = b.replace(
    "new ga({color:\"#ffffff\",opacity:1,transparent:!0})",
    "new ga({color:\"#5A6A7A\",opacity:1,transparent:!0})",
  );
  b = b.replace(
    "lineHeight:.8,size:.115},{uniforms:{tMap:{value:le.load(\"../fonts/IBMPlexMono-Medium-datatexture.ktx2\",\"data\")},uColor:{value:new Z(\"#ffffff\")}",
    "lineHeight:.8,size:.1},{uniforms:{tMap:{value:le.load(\"../fonts/IBMPlexMono-Medium-datatexture.ktx2\",\"data\")},uColor:{value:new Z(Be.colorProjectText)}",
  );
  b = b.replace(
    "Math.min(.8,.5/(q.screen.h/1300))",
    "Math.min(.7,.45/(q.screen.h/1300))",
  );
  return b;
});

s = patchBetween(s, "class XL{", "class KL{", (block) => {
  let b = block;
  b = b.replace(
    /text:"TEMP",width:\.75,align:"left",lineHeight:.8,size:\.1/g,
    "text:\"TEMP\",width:.75,align:\"left\",lineHeight:.8,size:.09",
  );
  b = b.replace(
    "text:\".\",width:.75,align:\"left\",lineHeight:.8,size:.1",
    "text:\".\",width:.75,align:\"left\",lineHeight:.8,size:.09",
  );
  b = b.replace(
    "uColor:{value:new Z(\"#ffffff\")}",
    "uColor:{value:new Z(Be.colorProjectText)}",
  );
  b = b.replace(
    "Math.min(.8,.5/(q.screen.h/1300))",
    "Math.min(.7,.45/(q.screen.h/1300))",
  );
  return b;
});

writeFileSync(bundlePath, s);

const yl = s.slice(s.indexOf("class YL"), s.indexOf("class qL"));
const ql = s.slice(s.indexOf("class qL"), s.indexOf("class XL"));
const xl = s.slice(s.indexOf("class XL"), s.indexOf("class KL"));

const checks = [
  ["YL Be.colorTitle", yl.includes("uColor:{value:new Z(Be.colorTitle)}")],
  ["YL size .17", yl.includes("size:.17")],
  ["YL cyan line", yl.includes("color:\"#00D4EE\"")],
  ["YL glow", yl.includes("uColor * alpha * 0.35")],
  ["qL Be.colorProjectText", ql.includes("uColor:{value:new Z(Be.colorProjectText)}")],
  ["qL dim line", ql.includes("color:\"#5A6A7A\"")],
  ["XL Be.colorProjectText", xl.includes("uColor:{value:new Z(Be.colorProjectText)}")],
  ["XL size .09", xl.includes("text:\"TEMP\",width:.75,align:\"left\",lineHeight:.8,size:.09")],
];

for (const [name, ok] of checks) {
  if (!ok) throw new Error(`Cube HUD patch failed — missing: ${name}`);
}

console.log("OK patched cube HUD service label hierarchy (YL / qL / XL)");
