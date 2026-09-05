import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

const CHROME =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9341;
const URL = "http://127.0.0.1:3000/tmp-roblox-test.html";

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

await sleep(6000);

const tabs = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json());
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
await sleep(3000);
const evalRes = await send("Runtime.evaluate", {
  expression: "({ done: window.__done, err: window.__err })",
  returnByValue: true,
});
console.log("page state:", evalRes.result?.value);

const shot = await send("Page.captureScreenshot", { format: "png" });
writeFileSync("tmp-roblox-isolated.png", Buffer.from(shot.data, "base64"));
chrome.kill();
console.log("OK tmp-roblox-isolated.png");
