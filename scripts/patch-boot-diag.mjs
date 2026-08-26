import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = join(ROOT, "assets", "index-2eb69c09.js");

let s = readFileSync(indexPath, "utf8");

// Boot diagnostics in index IIFE
if (!s.includes("[boot] waiting App3D")) {
  s = s.replace(
    "const i=await new o({target:n,props:{interactionNode:t==null?void 0:t.interactionNode,relativePath:t==null?void 0:t.relativePath},...e?{anchor:e.getEl()}:{}}).ready",
    "console.log(\"[boot] waiting App3D.ready\");const i=await new o({target:n,props:{interactionNode:t==null?void 0:t.interactionNode,relativePath:t==null?void 0:t.relativePath},...e?{anchor:e.getEl()}:{}}).ready;console.log(\"[boot] App3D.ready done\",i)"
  );
}

writeFileSync(indexPath, s);
console.log("Added boot diagnostics to index bundle");
