/**
 * Headless Chrome CDP boot test — logs [boot] console lines.
 */
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { setTimeout as sleep } from "node:timers/promises";

const CHROME =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const URL = process.env.BOOT_URL || "http://127.0.0.1:3000/";
const PORT = Number(process.env.CDP_PORT || 9333);
const WAIT_MS = Number(process.env.BOOT_WAIT_MS || 120000);

async function cdp(wsUrl, method, params = {}) {
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => {
    ws.addEventListener("open", res);
    ws.addEventListener("error", rej);
  });
  const id = 1;
  ws.send(JSON.stringify({ id, method, params }));
  const msg = await new Promise((res) => {
    ws.addEventListener("message", (ev) => res(JSON.parse(ev.data)));
  });
  ws.close();
  if (msg.error) throw new Error(JSON.stringify(msg.error));
  return msg.result;
}

async function main() {
  const userDataDir = mkdtempSync(join(tmpdir(), "coolbb-cdp-"));
  const chrome = spawn(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      `--remote-debugging-port=${PORT}`,
      "--remote-allow-origins=*",
      `--user-data-dir=${userDataDir}`,
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  await sleep(2500);
  const tabs = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) =>
    r.json(),
  );
  const page = tabs.find((t) => t.type === "page");
  if (!page?.webSocketDebuggerUrl) throw new Error("No CDP page");

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  const bootLogs = [];
  const errors = [];

  await new Promise((res, rej) => {
    ws.addEventListener("open", res);
    ws.addEventListener("error", rej);
  });

  let id = 0;
  const send = (method, params = {}) => {
    const msgId = ++id;
    ws.send(JSON.stringify({ id: msgId, method, params }));
    return msgId;
  };

  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.method === "Runtime.consoleAPICalled") {
      const text = msg.params.args
        .map((a) => a.value ?? a.description ?? "")
        .join(" ");
      if (text.includes("[boot]")) bootLogs.push(text);
      if (msg.params.type === "error") errors.push(text);
    }
    if (msg.method === "Runtime.exceptionThrown") {
      errors.push(msg.params.exceptionDetails.text);
    }
  });

  send("Runtime.enable");
  send("Page.enable");
  send("Page.navigate", { url: URL });

  const start = Date.now();
  let done = false;
  while (Date.now() - start < WAIT_MS) {
    if (bootLogs.some((l) => l.includes("createScenes done") || l.includes("jF.ready"))) {
      done = true;
      break;
    }
    if (bootLogs.some((l) => l.includes("App3D.ready done"))) {
      done = true;
      break;
    }
    await sleep(2000);
  }

  chrome.kill();
  ws.close();

  console.log("boot_logs:", bootLogs);
  console.log("errors:", errors.slice(0, 20));
  if (!done) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
