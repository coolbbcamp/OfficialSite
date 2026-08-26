/**
 * Render CoolBB wordmark and encode to ui/logo-datatexture.ktx2
 */
import { mkdir, copyFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const basis = require("@gpu-tex-enc/basis");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MODEL_DIR = join(ROOT, "models", "coolbb");
const OUT_KTX2 = join(ROOT, "assets", "images", "ui", "logo-datatexture.ktx2");

async function main() {
  await mkdir(MODEL_DIR, { recursive: true });
  await mkdir(join(ROOT, "assets", "images", "ui"), { recursive: true });

  const png = join(MODEL_DIR, "logo.png");
  const svg = `
    <svg width="512" height="128" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="transparent"/>
      <text
        x="50%"
        y="54%"
        text-anchor="middle"
        dominant-baseline="middle"
        font-family="Arial Black, Arial, Helvetica, sans-serif"
        font-weight="900"
        font-size="78"
        letter-spacing="4"
        fill="white"
      >CoolBB</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .resize(256, 64, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(png);

  const tmp = basis.generate(png, "ETC1S", true, ["-q", "200"]);
  await copyFile(tmp, OUT_KTX2);
  console.log(`OK images/ui/logo-datatexture.ktx2`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
