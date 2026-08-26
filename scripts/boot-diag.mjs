/**
 * Boot hang diagnostic — logs which App3D init stage completes.
 * Run: node scripts/boot-diag.mjs
 */
import { chromium } from "playwright";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const browser = await chromium.launch({
  headless: true,
  args: ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
});
const page = await browser.newPage();

const logs = [];
const failed = [];
page.on("console", (msg) => {
  const t = msg.text();
  logs.push(`[${msg.type()}] ${t}`);
});
page.on("pageerror", (err) => logs.push(`[pageerror] ${err.message}`));
page.on("requestfailed", (req) => {
  failed.push(`${req.url()} :: ${req.failure()?.errorText}`);
});

await page.goto("http://127.0.0.1:3000/?diag=1", { waitUntil: "domcontentloaded", timeout: 60000 });

for (let i = 0; i < 60; i++) {
  const loader = await page.$("#loader");
  const loaderVisible = loader
    ? await loader.evaluate((el) => {
        const s = getComputedStyle(el);
        return s.display !== "none" && s.opacity !== "0" && s.visibility !== "hidden";
      })
    : false;
  const webgl = await page.$("#webgl");
  if (!loaderVisible && webgl) {
    console.log("BOOT OK after", i + 1, "seconds");
    break;
  }
  if (i === 59) console.log("BOOT STILL HANGING after 60s");
  await page.waitForTimeout(1000);
}

const bootLogs = logs.filter((l) => l.includes("[boot]") || l.includes("error") || l.includes("Error"));
console.log("\n--- boot/error console ---");
bootLogs.slice(0, 30).forEach((l) => console.log(l));
console.log("\n--- failed requests ---");
failed.filter((u) => !u.includes("favicon")).slice(0, 25).forEach((u) => console.log(u));
console.log("\n--- last 15 console lines ---");
logs.slice(-15).forEach((l) => console.log(l));

await browser.close();
