/**
 * Bake crisp CoolBB wordmark → ui/logo-datatexture.ktx2 (RGBA, no MSDF).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { copyFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import opentype from "opentype.js";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const basis = require("@gpu-tex-enc/basis");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MODEL_DIR = join(ROOT, "models", "coolbb");
const OUT_KTX2 = join(ROOT, "assets", "images", "ui", "logo-datatexture.ktx2");
const OUT_PNG = join(MODEL_DIR, "logo-composed.png");
const SVG_PATH = join(MODEL_DIR, "logo-word.svg");
const TEXT = "CoolBB";
const TEX_W = 512;
const TEX_H = 128;
const FONT_SIZE = 72;
const FONT_FILE =
  process.env.COOLBB_LOGO_FONT ||
  (process.platform === "win32"
    ? "C:\\Windows\\Fonts\\ariblk.ttf"
    : "/usr/share/fonts/truetype/msttcorefonts/Arial_Black.ttf");

function buildWordSvg() {
  const font = opentype.parse(readFileSync(FONT_FILE));
  const path = font.getPath(TEXT, 0, 0, FONT_SIZE);
  const bbox = path.getBoundingBox();
  const padX = 16;
  const padY = 12;
  const scale = Math.min(
    (TEX_W - padX * 2) / (bbox.x2 - bbox.x1),
    (TEX_H - padY * 2) / (bbox.y2 - bbox.y1),
  );
  const tx =
    padX -
    bbox.x1 * scale +
    (TEX_W - padX * 2 - (bbox.x2 - bbox.x1) * scale) / 2;
  const ty =
    padY +
    bbox.y2 * scale +
    (TEX_H - padY * 2 - (bbox.y2 - bbox.y1) * scale) / 2;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${TEX_W}" height="${TEX_H}" viewBox="0 0 ${TEX_W} ${TEX_H}">
  <rect width="100%" height="100%" fill="none"/>
  <g transform="translate(${tx},${ty}) scale(${scale},${-scale})">
    <path d="${path.toPathData(2)}" fill="#ffffff"/>
  </g>
</svg>`;
  writeFileSync(SVG_PATH, svg);
}

async function bakeLogoPng() {
  await sharp(Buffer.from(readFileSync(SVG_PATH)))
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(OUT_PNG);
}

async function main() {
  await mkdir(join(ROOT, "assets", "images", "ui"), { recursive: true });
  await mkdir(MODEL_DIR, { recursive: true });

  if (!existsSync(FONT_FILE)) {
    throw new Error(`Logo font not found: ${FONT_FILE}`);
  }

  buildWordSvg();
  await bakeLogoPng();

  const tmp = basis.generate(OUT_PNG, "ETC1S", true, ["-q", "255"]);
  await copyFile(tmp, OUT_KTX2);

  const bundlePath = join(ROOT, "assets", "App3D-f554a111.js");
  const bust = Date.now();
  let bundle = readFileSync(bundlePath, "utf8");
  bundle = bundle.replace(
    /le\.load\("ui\/logo-datatexture\.ktx2(?:\?v=\d+)?","(?:datatexture|srgb)"\)/,
    `le.load("ui/logo-datatexture.ktx2?v=${bust}","srgb")`,
  );
  writeFileSync(bundlePath, bundle);

  console.log(`OK images/ui/logo-datatexture.ktx2 (${TEX_W}×${TEX_H} crisp RGBA)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
