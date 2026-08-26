/**
 * CoolBB cyberpunk theme — deep navy base, electric cyan (left), warm amber (right).
 * Matches monkey banner: #05080A / #00E5FF / #FFB300
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const app3dPath = join(ROOT, "assets", "App3D-f554a111.js");
const indexPath = join(ROOT, "assets", "index-2eb69c09.js");

let s = readFileSync(app3dPath, "utf8");
let changed = 0;

const pairs = [
  // Be UI text palette
  [`colorTitle:"#5A6A8A"`, `colorTitle:"#00D4EE"`],
  [`colorTitle:"#4A5568"`, `colorTitle:"#00D4EE"`],
  [`colorProjectTitle:"#7A8FAE"`, `colorProjectTitle:"#FFB300"`],
  [`colorProjectTitle:"#6B7280"`, `colorProjectTitle:"#FFB300"`],
  [`colorProjectText:"#B8C5DA"`, `colorProjectText:"#9AB0C4"`],
  [`colorProjectText:"#A1AAB7"`, `colorProjectText:"#9AB0C4"`],

  // Entry hologram particles — cyan core, amber velocity streaks
  [`uColorInitial:{value:new Z("#c8e4ff")}`, `uColorInitial:{value:new Z("#66E8FF")}`],
  [`uColorInitial:{value:new Z("#b5d5ff")}`, `uColorInitial:{value:new Z("#66E8FF")}`],
  [`uColorLight:{value:new Z("#dce8f5")}`, `uColorLight:{value:new Z("#B8F5FF")}`],
  [`uColorLight:{value:new Z("#c5d4e8")}`, `uColorLight:{value:new Z("#B8F5FF")}`],
  [`uColorLight:{value:new Z("#d8dde6")}`, `uColorLight:{value:new Z("#B8F5FF")}`],
  [`uColorDark:{value:new Z("#4a6080")}`, `uColorDark:{value:new Z("#081828")}`],
  [`uColorDark:{value:new Z("#1e2a42")}`, `uColorDark:{value:new Z("#081828")}`],
  [`uColorDark:{value:new Z("#3a424f")}`, `uColorDark:{value:new Z("#081828")}`],
  [`uColorFast:{value:new Z("#eef6ff")}`, `uColorFast:{value:new Z("#FFD966")}`],
  [`uColorFast:{value:new Z("#d7ebfa")}`, `uColorFast:{value:new Z("#FFD966")}`],
  [`uColorFast:{value:new Z("#e8edf4")}`, `uColorFast:{value:new Z("#FFD966")}`],

  // Intro / portfolio room gradients (cyan ↔ amber)
  [`uColor1:{value:new Z("#c8d4e8")}`, `uColor1:{value:new Z("#0A2234")}`],
  [`uColor1:{value:new Z("#b8c8de")}`, `uColor1:{value:new Z("#0A2234")}`],
  [`uColor1:{value:new Z("#b8c8e0")}`, `uColor1:{value:new Z("#0A2234")}`],
  [`uColor1:{value:new Z("#c9d0df")}`, `uColor1:{value:new Z("#0A2234")}`],
  [`uColor1:{value:new Z("#d1d6e3")}`, `uColor1:{value:new Z("#0A2234")}`],
  [`uColor2:{value:new Z("#8fa3be")}`, `uColor2:{value:new Z("#241508")}`],
  [`uColor2:{value:new Z("#3d4a62")}`, `uColor2:{value:new Z("#241508")}`],
  [`uColor2:{value:new Z("#545b6b")}`, `uColor2:{value:new Z("#241508")}`],
  [`uColor2:{value:new Z("#afb6c7")}`, `uColor2:{value:new Z("#241508")}`],
  [`uIntroColor:{value:new Z("#b8c8e0")}`, `uIntroColor:{value:new Z("#5CE8FF")}`],
  [`uIntroColor:{value:new Z("#b3bac9")}`, `uIntroColor:{value:new Z("#5CE8FF")}`],

  // Loader + portfolio section tints
  [`uColor:{value:new Z("#7a8faa")}`, `uColor:{value:new Z("#05080A")}`],
  [`uColor:{value:new Z("#8b909d")}`, `uColor:{value:new Z("#05080A")}`],

  // Floor / rings / plasma / forcefield — dark base + cyan highlight
  [`uColor1:{value:new Z("#6a6f7d")}`, `uColor1:{value:new Z("#0A1018")}`],
  [`uColor2:{value:new Z("#e1e6f1")}`, `uColor2:{value:new Z("#00C8E8")}`],

  // Portfolio cube glass
  [`s.material.color.setStyle("#d4e0f0")`, `s.material.color.setStyle("#A8E8FF")`],
  [`s.material.color.setStyle("#e0e8ef")`, `s.material.color.setStyle("#A8E8FF")`],

  // Wireframe outlines
  [`color:"#9eb4dc"`, `color:"#00D4EE"`],
  [`color:"#a7b2d6"`, `color:"#00D4EE"`],

  // Plexus lines default
  [`uColor:{value:new Z("#7f7f7f")}`, `uColor:{value:new Z("#3A5060")}`],

  // Cyan / amber glow accents in shaders
  [`vec3(0.5, 0.7, 1.0)`, `vec3(0.0, 0.92, 1.0)`],
  [`vec3(0.8, 0.9, 1.0)`, `mix(vec3(0.0, 0.92, 1.0), vec3(1.0, 0.7, 0.0), vUv.x)`],

  // Portfolio floor shadow tint
  [`mix(vec3(0.5, 0.7, 1.0) * 0.1, vec3(1.0), shadow)`, `mix(vec3(0.0, 0.85, 1.0) * 0.12, vec3(1.0), shadow)`],
];

for (const [from, to] of pairs) {
  if (s.includes(from) && from !== to) {
    s = s.split(from).join(to);
    changed++;
  }
}

if (changed) {
  writeFileSync(app3dPath, s);
  console.log(`CoolBB cyber theme (App3D): ${changed} updates`);
} else {
  console.log("CoolBB cyber theme (App3D): already applied");
}

// HTML shell + loader background
let idx = readFileSync(indexPath, "utf8");
let idxChanged = 0;

const indexPairs = [
  [`--bgColor: #A0A5B1`, `--bgColor: #05080A`],
  [
    `text-shadow: 0px 0px 5px rgba(255,255,255,0.4);`,
    `text-shadow: 0px 0px 10px rgba(0,229,255,0.55), 0px 0px 20px rgba(0,229,255,0.2);`,
  ],
  [`color: #ffffff;`, `color: #00E5FF;`],
];

for (const [from, to] of indexPairs) {
  if (idx.includes(from) && from !== to) {
    idx = idx.split(from).join(to);
    idxChanged++;
  }
}

if (idxChanged) {
  writeFileSync(indexPath, idx);
  console.log(`CoolBB cyber theme (index): ${idxChanged} updates`);
} else {
  console.log("CoolBB cyber theme (index): already applied");
}
