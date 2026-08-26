import { spawnSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const script = join(dirname(fileURLToPath(import.meta.url)), "browser-boot-puppeteer.mjs");
const code = `
import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({
  headless: true,
  executablePath: "C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe",
  args: ["--no-sandbox", "--disable-gpu"],
});
const page = await browser.newPage();
const errors = [];
const failed = [];
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
page.on("pageerror", (err) => errors.push(String(err)));
page.on("requestfailed", (req) => failed.push(req.url() + " " + req.failure()?.errorText));
await page.goto("http://127.0.0.1:3000/", { waitUntil: "networkidle0", timeout: 120000 });
let loaderHidden = false;
try {
  await page.waitForFunction(() => {
    const el = document.getElementById("loader");
    return !el || el.style.display === "none" || getComputedStyle(el).opacity === "0" || !document.body.contains(el);
  }, { timeout: 45000 });
  loaderHidden = true;
} catch {}
const webgl = await page.$("#webgl");
console.log(JSON.stringify({
  loaderHidden,
  webgl: !!webgl,
  errors: errors.slice(0, 15),
  failed: failed.filter(u => !u.includes("favicon")).slice(0, 20),
}, null, 2));
await browser.close();
`;
writeFileSync(script, code);
const r = spawnSync(
  "npx",
  ["--yes", "-p", "puppeteer-core", "node", script],
  { encoding: "utf8", shell: true, timeout: 180000 }
);
console.log(r.stdout);
if (r.stderr) console.error(r.stderr.slice(-2000));
unlinkSync(script);
process.exit(r.status ?? 1);
