/**
 * Verify CoolBB logo texture loads and MSDF renders in top-left UI.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { read } from "ktx-parse";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const CHROME =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = Number(process.env.CDP_PORT || 9350);
const SCREENSHOT_PATH = join(ROOT, "tmp-logo-check.png");

const logoKtx = read(readFileSync(join(ROOT, "assets/images/ui/logo-datatexture.ktx2")));
if (logoKtx.pixelWidth !== 512 || logoKtx.pixelHeight !== 128) {
  throw new Error(
    `Expected 512×128 logo KTX2, got ${logoKtx.pixelWidth}×${logoKtx.pixelHeight}`,
  );
}
console.log(`OK logo KTX2 ${logoKtx.pixelWidth}×${logoKtx.pixelHeight}`);

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--disable-cache",
    "--disk-cache-size=0",
    "--no-sandbox",
    `--remote-debugging-port=${PORT}`,
    "--remote-allow-origins=*",
    `${BASE}/?logoVerify=${Date.now()}`,
  ],
  { stdio: "ignore" },
);

await sleep(22000);

const tabs = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) =>
  r.json(),
);
const page = tabs.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));

let id = 0;
const pending = new Map();
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    if (m.error) reject(new Error(JSON.stringify(m.error)));
    else resolve(m.result);
  }
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });

await send("Runtime.enable");
await send("Page.enable");

const info = await send("Runtime.evaluate", {
  expression: `(() => {
    const resources = performance.getEntriesByType('resource')
      .filter((e) => e.name.includes('logo-datatexture'))
      .map((e) => ({ name: e.name, size: e.transferSize || e.encodedBodySize }));
    let logo = null;
    const canvases = [...document.querySelectorAll('canvas')];
    return { resources, canvasCount: canvases.length, loader: !!document.getElementById('loader') };
  })()`,
  returnByValue: true,
});
console.log("page:", JSON.stringify(info.result?.value, null, 2));

const shot = await send("Page.captureScreenshot", {
  format: "png",
  clip: { x: 0, y: 0, width: 360, height: 120, scale: 1 },
});
writeFileSync(SCREENSHOT_PATH, Buffer.from(shot.data, "base64"));
chrome.kill();
console.log(`OK ${SCREENSHOT_PATH}`);
