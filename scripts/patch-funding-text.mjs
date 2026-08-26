/**
 * Patch App3D bundle: swap igloo centerpiece for funding text + hide cage/outline.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  geometryFile,
  colorTexture,
  explodedColorTexture,
} from "./content/funding-text.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const bundlePath = join(ROOT, "assets", "App3D-f554a111.js");

function patch(s) {
  if (!s.includes("zt.batched(\"igloo.drc\")")) {
    throw new Error("Could not find zt.batched(\"igloo.drc\") in App3D bundle");
  }
  s = s.replace("zt.batched(\"igloo.drc\")", `zt.batched("${geometryFile}")`);

  const textureLoad =
    'le.load("igloo/igloo_color.ktx2","srgb"),s=le.load("igloo/igloo_exploded_color.ktx2","srgb")';
  const textureReplacement =
    `le.load("${colorTexture}","srgb"),s=le.load("${explodedColorTexture}","srgb")`;
  if (!s.includes(textureLoad)) {
    throw new Error("Could not find igloo color texture load in U3 init");
  }
  s = s.replace(textureLoad, textureReplacement);

  s = s.replace(
    "this.mesh.visible=!q.devScene,this.mesh.name=\"igloo_cage\"",
    "this.mesh.visible=!1,this.mesh.name=\"igloo_cage\"",
  );
  s = s.replace(
    "this.mesh.visible=!0,this.mesh.name=\"igloo_outline\"",
    "this.mesh.visible=!1,this.mesh.name=\"igloo_outline\"",
  );

  if (s.includes("this.mesh.name=\"igloo\"")) {
    s = s.replace("this.mesh.name=\"igloo\"", "this.mesh.name=\"funding_text\"");
  }

  return s;
}

const src = readFileSync(bundlePath, "utf8");
const out = patch(src);
if (out === src) {
  console.log("App3D bundle already patched for funding text — no changes.");
} else {
  writeFileSync(bundlePath, out);
  console.log("OK patched App3D-f554a111.js for funding text");
}
