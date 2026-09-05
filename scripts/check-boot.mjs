import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const CHROME =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = Number(process.env.CDP_PORT || 9345);
const URL = `${process.env.BASE_URL || "http://127.0.0.1:3000"}/`;

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
  if (m.method === "Runtime.consoleAPICalled") {
    const text = m.params.args.map((a) => a.value ?? "").join(" ");
    console.log(`[console ${m.params.type}]`, text);
  }
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });

await send("Runtime.enable");
const res = await send("Runtime.evaluate", {
  expression: `({
    loader: !!document.getElementById('loader'),
    canvas: !!document.querySelector('canvas'),
    title: document.title
  })`,
  returnByValue: true,
});
console.log("state:", res.result?.value);
chrome.kill();
