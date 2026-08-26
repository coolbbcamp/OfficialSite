/**
 * Generate assets/images/social.jpg for og/twitter previews (1200×630).
 */
import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "assets", "images", "social.jpg");

async function main() {
  await mkdir(join(ROOT, "assets", "images"), { recursive: true });

  const svg = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#05080A"/>
          <stop offset="45%" style="stop-color:#0A2234"/>
          <stop offset="100%" style="stop-color:#241508"/>
        </linearGradient>
        <linearGradient id="cyan" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#00E5FF;stop-opacity:0.9"/>
          <stop offset="100%" style="stop-color:#00E5FF;stop-opacity:0"/>
        </linearGradient>
        <linearGradient id="amber" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" style="stop-color:#FFB300;stop-opacity:0.85"/>
          <stop offset="100%" style="stop-color:#FFB300;stop-opacity:0"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <rect width="60%" height="100%" fill="url(#cyan)" opacity="0.35"/>
      <rect x="40%" width="60%" height="100%" fill="url(#amber)" opacity="0.3"/>
      <text x="80" y="280" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="96" fill="#FFFFFF">CoolBB</text>
      <text x="80" y="360" font-family="Arial, sans-serif" font-size="36" fill="#00E5FF">AI • Web3 • Game • Design</text>
      <text x="80" y="420" font-family="Arial, sans-serif" font-size="28" fill="#9AB0C4">Base camp for builders in hard markets.</text>
      <text x="80" y="520" font-family="Arial, sans-serif" font-size="24" fill="#FFB300">t.me/@C00LBB</text>
    </svg>
  `;

  await sharp(Buffer.from(svg)).jpeg({ quality: 92 }).toFile(OUT);
  console.log("Wrote", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
