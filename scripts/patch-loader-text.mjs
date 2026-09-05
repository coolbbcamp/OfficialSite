/**
 * Replace igloo ASCII boot loader with flowing CoolBB text.
 * Run after download / patch-index-bundle / patch-coolbb-theme.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { LOADER_TEXT } from "./content/loader.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = join(ROOT, "assets", "index-2eb69c09.js");

let s = readFileSync(indexPath, "utf8");

if (s.includes("coolbb-flow")) {
  console.log("Loader text patch: already applied");
  process.exit(0);
}

const loopText = `${LOADER_TEXT}    ${LOADER_TEXT}    `;
const escaped = loopText.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

const newBlock = `.ascii {
                position: relative;
                overflow: hidden;
                width: min(92vw, 24em);
                height: 1.5em;
            }

            .ascii:before {
                display: inline-block;
                white-space: nowrap;
                color: #00E5FF;
                content: '${escaped}';
                font-size: 15px;
                font-family: IBMPlexMono-Medium, IBMPlexMono, monospace;
                font-weight: 500;
                letter-spacing: 0.1em;
                text-shadow: 0px 0px 10px rgba(0,229,255,0.55), 0px 0px 20px rgba(0,229,255,0.2);
                animation: coolbb-flow 3.2s linear infinite;
                will-change: transform;
            }

            @keyframes coolbb-flow {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
            }`;

const start = s.indexOf(".ascii:before {");
const endMarker = '}`,U(e,"class","ascii")';
const end = s.indexOf(endMarker);

if (start === -1 || end === -1 || end <= start) {
  throw new Error(
    "Loader block not found in index bundle — bundle layout may have changed",
  );
}

// Walk back to include any preceding .ascii { rule if present (theme re-run)
let replaceStart = start;
const priorAscii = s.lastIndexOf(".ascii {", start);
if (priorAscii !== -1 && start - priorAscii < 80) {
  replaceStart = priorAscii;
}

s = s.slice(0, replaceStart) + newBlock + s.slice(end);

if (!s.includes(LOADER_TEXT) || !s.includes("coolbb-flow")) {
  throw new Error("Loader text patch verification failed");
}

writeFileSync(indexPath, s);
console.log(`Loader text patch: "${LOADER_TEXT}" flowing animation applied`);
