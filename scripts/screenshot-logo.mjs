import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHROME =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = Number(process.env.CDP_PORT || 9348);
const URL = `${process.env.BASE_URL || "http://127.0.0.1:3000"}/?v=${Date.now()}`;

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    `--remote-debugging-port=${PORT}`,
    "--remote-allow-origins=*",
    URL,
  ],
  { stdio: "ignore" },
);

await sleep(15000);

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

for (let i = 0; i < 40; i++) {
  const state = await send("Runtime.evaluate", {
    expression: `({
      loader: !!document.getElementById('loader'),
      canvas: !!document.querySelector('canvas'),
      title: document.title
    })`,
    returnByValue: true,
  });
  const v = state.result?.value;
  if (v?.canvas && !v?.loader) break;
  await sleep(1000);
}

await sleep(8000);

const shot = await send("Page.captureScreenshot", {
  format: "png",
  clip: { x: 0, y: 0, width: 420, height: 140, scale: 1 },
});
writeFileSync(join(ROOT, "tmp-logo-check.png"), Buffer.from(shot.data, "base64"));
chrome.kill();
console.log("OK tmp-logo-check.png");
