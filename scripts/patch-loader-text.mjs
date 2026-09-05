/**
 * Replace igloo ASCII boot loader with flowing CoolBB text.
 * Re-runnable: updates timing/CSS when loader patch is already present.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  LOADER_TEXT,
  LOADER_FLOW_DURATION_S,
  LOADER_TEXT_REPEATS,
  LOADER_HIDE_TIMEOUT_MS,
  LOADER_OUTRO_TEXT_MS,
  LOADER_OUTRO_FADE_MS,
} from "./content/loader.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = join(ROOT, "assets", "index-2eb69c09.js");

let s = readFileSync(indexPath, "utf8");

const loopText = Array.from({ length: LOADER_TEXT_REPEATS }, () => LOADER_TEXT).join(
  "    ",
);
const escaped = loopText.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

const newBlock = `.ascii {
                position: relative;
                overflow: hidden;
                width: min(94vw, 28em);
                height: 1.5em;
                -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 12%, #000 88%, transparent 100%);
                mask-image: linear-gradient(90deg, transparent 0%, #000 12%, #000 88%, transparent 100%);
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
                animation: coolbb-flow ${LOADER_FLOW_DURATION_S}s linear infinite, coolbb-breathe 5s ease-in-out infinite;
                will-change: transform, opacity;
            }

            @keyframes coolbb-flow {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
            }

            @keyframes coolbb-breathe {
                0%, 100% { opacity: 0.82; }
                50% { opacity: 1; }
            }`;

const endMarker = '}`,U(e,"class","ascii")';

function patchLoaderCss(source) {
  const coolbbStart = source.indexOf(".ascii {");
  const coolbbFlow = source.indexOf("coolbb-flow");
  const iglooStart = source.indexOf(".ascii:before {");

  let start = -1;
  if (coolbbStart !== -1 && coolbbFlow !== -1) {
    start = coolbbStart;
  } else if (iglooStart !== -1) {
    start = source.lastIndexOf(".ascii {", iglooStart);
    if (start === -1) start = iglooStart;
  } else {
    throw new Error(
      "Loader block not found in index bundle — bundle layout may have changed",
    );
  }

  const end = source.indexOf(endMarker, start);
  if (end === -1 || end <= start) {
    throw new Error("Loader block end marker not found in index bundle");
  }

  return source.slice(0, start) + newBlock + source.slice(end);
}

s = patchLoaderCss(s);

const outroFrom = "o=W(e,J,{duration:250,easing:G}),c=W(n,J,{duration:750,easing:G})";
const outroTo = `o=W(e,J,{duration:${LOADER_OUTRO_TEXT_MS},easing:G}),c=W(n,J,{duration:${LOADER_OUTRO_FADE_MS},easing:G})`;
if (s.includes(outroFrom)) {
  s = s.replace(outroFrom, outroTo);
} else if (!s.includes(outroTo)) {
  throw new Error("Loader outro timing block not found in index bundle");
}

const timeoutFrom = /setTimeout\(\(\)=>\{console\.warn\("\[boot\] loader hide timeout — forcing"\);e\.\$destroy\(\);c\(\)\},(\d+)\)/;
const timeoutMatch = s.match(timeoutFrom);
if (timeoutMatch) {
  if (timeoutMatch[1] !== String(LOADER_HIDE_TIMEOUT_MS)) {
    s = s.replace(
      timeoutFrom,
      `setTimeout(()=>{console.warn("[boot] loader hide timeout — forcing");e.$destroy();c()},${LOADER_HIDE_TIMEOUT_MS})`,
    );
  }
} else if (!s.includes("loader hide timeout")) {
  s = s.replace(
    "return e&&await new Promise(c=>{e.$on(\"hidden\",()=>{e.$destroy(),c()}),e.hide()})",
    `return e&&await new Promise(c=>{const h=setTimeout(()=>{console.warn("[boot] loader hide timeout — forcing");e.$destroy();c()},${LOADER_HIDE_TIMEOUT_MS});e.$on("hidden",()=>{clearTimeout(h);e.$destroy();c()}),e.hide()})`,
  );
}

if (!s.includes(LOADER_TEXT) || !s.includes("coolbb-flow")) {
  throw new Error("Loader text patch verification failed");
}

writeFileSync(indexPath, s);
console.log(
  `Loader patch: "${LOADER_TEXT}" marquee ${LOADER_FLOW_DURATION_S}s, hide timeout ${LOADER_HIDE_TIMEOUT_MS}ms`,
);
