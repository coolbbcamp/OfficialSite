/**
 * Inject CoolBB agency content into App3D Be config + monkey/logo branding patches.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  manifesto,
  scroll,
  follow,
  copyright,
  rights,
  social,
  links,
  cubes,
} from "./content/agency.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const bundlePath = join(ROOT, "assets", "App3D-f554a111.js");

function jsStr(s) {
  return JSON.stringify(s);
}

function serializeSocialItem({ name, link }) {
  return `{name:${jsStr(name)},link:${jsStr(link)}}`;
}

function serializeLinkItem({ title, url, vdb, scale }) {
  return `{title:${jsStr(title)},url:${jsStr(url)},vdb:${jsStr(vdb)},scale:${scale}}`;
}

function serializeInterior(interior) {
  const social = interior.social.map(serializeSocialItem).join(",");
  const links = interior.links
    .map((l) => `{name:${jsStr(l.name)},link:${jsStr(l.link)}}`)
    .join(",");
  const content = interior.content.replace(/\\/g, "\\\\").replace(/`/g, "\\`");
  return `{enabled:!0,title:${jsStr(interior.title)},content:` +
    "`" + content + "`" +
    `,socialTitle:${jsStr(interior.socialTitle)},social:[${social}],linkTitle:${jsStr(interior.linkTitle)},links:[${links}],obj:${jsStr(interior.obj)},objScale:${interior.objScale}}`;
}

function serializeCube(c) {
  return `{title:${jsStr(c.title)},hash:${jsStr(c.hash)},date:${jsStr(c.date)},temp:${c.temp},obj:${jsStr(c.obj)},innerobject:${jsStr(c.innerobject)},interior:${serializeInterior(c.interior)}}`;
}

function serializeCubes(arr) {
  return "[" + arr.map(serializeCube).join(",") + "]";
}

function serializeLinks(arr) {
  return "[" + arr.map(serializeLinkItem).join(",") + "]";
}

function serializeSocial(arr) {
  return "[" + arr.map(serializeSocialItem).join(",") + "]";
}

function replaceCubesAndLinks(s, cubesJs, linksJs) {
  const cubesStart = s.indexOf("cubes:[");
  if (cubesStart < 0) throw new Error("Could not find cubes:[ in App3D bundle");

  const linksMarker = s.indexOf("],links:[", cubesStart);
  if (linksMarker < 0) throw new Error("Could not find ],links:[ after cubes");

  const volumeMarker = s.indexOf("],volume:", linksMarker);
  if (volumeMarker < 0) throw new Error("Could not find ],volume: after links");

  const before = s.slice(0, cubesStart + "cubes:".length);
  const after = s.slice(volumeMarker + 1); // starts with ],volume:...
  return before + cubesJs + ",links:" + linksJs + after;
}

function patchManifestoAndMeta(s) {
  // Replace manifesto block (title + text may vary from prior patches)
  s = s.replace(
    /manifesto:\{title:[^,]+,text:"[^"]*(?:\\.[^"]*)*"\}/,
    `manifesto:{title:${jsStr(manifesto.title)},text:${jsStr(manifesto.text)}}`,
  );

  s = s.replace(/scroll:"[^"]*"/, `scroll:${jsStr(scroll)}`);
  s = s.replace(/follow:"[^"]*"/, `follow:${jsStr(follow)}`);
  s = s.replace(/copyright:"[^"]*"/, `copyright:${jsStr(copyright)}`);

  s = s.replace(
    /rights:`[^`]*`|rights:"[^"]*"/,
    `rights:\`${rights.replace(/\n/g, "\\n")}\``,
  );

  s = s.replace(
    /social:\[[^\]]*\]/,
    `social:${serializeSocial(social)}`,
  );

  return s;
}

function patchBranding(s) {
  s = s.replace(
    /rights:`Igloo, Inc\.\nAll Rights Reserved\.`/,
    `rights:\`${rights.replace(/\n/g, "\\n")}\``,
  );

  // Entry particle hologram colors (before theme patch may also apply)
  s = s.replace(`uColorInitial:{value:new Z("#c5ccd8")}`, `uColorInitial:{value:new Z("#66E8FF")}`);
  s = s.replace(`uColorLight:{value:new Z("#d8dde6")}`, `uColorLight:{value:new Z("#B8F5FF")}`);
  s = s.replace(`uColorDark:{value:new Z("#3a424f")}`, `uColorDark:{value:new Z("#081828")}`);
  s = s.replace(`uColorFast:{value:new Z("#e8edf4")}`, `uColorFast:{value:new Z("#FFD966")}`);

  s = s.replace(/vdb:"monkey_64",scale:1\.\d+/, `vdb:"monkey_64",scale:1.28`);

  return s;
}

let s = readFileSync(bundlePath, "utf8");
const cubesJs = serializeCubes(cubes);
const linksJs = serializeLinks(links);

s = replaceCubesAndLinks(s, cubesJs, linksJs);
s = patchManifestoAndMeta(s);
s = patchBranding(s);

writeFileSync(bundlePath, s);

const checks = [
  "SERVICE_01 AI",
  "hash:\"ai\"",
  "hash:\"gamedev\"",
  "hash:\"memecoin\"",
  "hash:\"web3\"",
  "t.me/C00LBB",
  "coolBilliBigBoy",
  "rights:`CoolBB\\nAll Rights Reserved.`",
  "innerobject:\"trump\"",
  "vdb:\"monkey_64\"",
];
for (const c of checks) {
  if (!s.includes(c)) throw new Error(`Agency patch failed — missing: ${c}`);
}

console.log(
  `Patched App3D: ${cubes.length} service cubes, agency copy, Telegram CTAs`,
);
