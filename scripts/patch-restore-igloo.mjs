/**
 * Restore original igloo centerpiece in App3D (undo patch-funding-text.mjs).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const bundlePath = join(ROOT, "assets", "App3D-f554a111.js");

function restore(s) {
  if (!s.includes("funding_text.drc") && s.includes("zt.batched(\"igloo.drc\")")) {
    return s;
  }

  s = s.replace("zt.batched(\"funding_text.drc\")", "zt.batched(\"igloo.drc\")");

  const fundingTextures =
    'le.load("igloo/funding_text_color.ktx2","srgb"),s=le.load("igloo/funding_text_exploded_color.ktx2","srgb")';
  const iglooTextures =
    'le.load("igloo/igloo_color.ktx2","srgb"),s=le.load("igloo/igloo_exploded_color.ktx2","srgb")';
  if (s.includes(fundingTextures)) {
    s = s.replace(fundingTextures, iglooTextures);
  }

  s = s.replace(
    "this.mesh.visible=!1,this.mesh.name=\"igloo_cage\"",
    "this.mesh.visible=!q.devScene,this.mesh.name=\"igloo_cage\"",
  );
  s = s.replace(
    "this.mesh.visible=!1,this.mesh.name=\"igloo_outline\"",
    "this.mesh.visible=!0,this.mesh.name=\"igloo_outline\"",
  );
  s = s.replace("this.mesh.name=\"funding_text\"", "this.mesh.name=\"igloo\"");

  if (!s.includes("zt.batched(\"igloo.drc\")")) {
    throw new Error("Failed to restore igloo.drc load in App3D bundle");
  }
  if (s.includes("funding_text.drc")) {
    throw new Error("App3D bundle still references funding_text.drc");
  }

  return s;
}

const src = readFileSync(bundlePath, "utf8");
const out = restore(src);
if (out === src) {
  console.log("App3D bundle already uses igloo — no changes.");
} else {
  writeFileSync(bundlePath, out);
  console.log("OK restored igloo in App3D-f554a111.js");
}
