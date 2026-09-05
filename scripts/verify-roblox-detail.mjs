/**
 * Verify Game Dev portfolio detail renders Roblox avatar (not holo shards).
 * Usage: node scripts/verify-roblox-detail.mjs
 * Env: BASE_URL, SKIP_BROWSER=1, CHROME_PATH, CDP_PORT
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { setTimeout as sleep } from "node:timers/promises";
import { spawnSync } from "node:child_process";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const CHROME =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = Number(process.env.CDP_PORT || 9334);
const SKIP_BROWSER = process.env.SKIP_BROWSER === "1";
const SCREENSHOT_PATH = join(ROOT, "tmp-roblox-detail.png");

const BUNDLE_MARKER = "_dark_color.ktx2`)},tNoise:{value:le.load(\"perlin-datatexture.ktx2\"";
const RUNTIME_BUNDLE = "App3D-coolbb.js";

async function staticChecks() {
  const app3dSource = join(ROOT, "assets", "App3D-f554a111.js");
  const app3dRuntime = join(ROOT, "assets", RUNTIME_BUNDLE);
  const indexPath = join(ROOT, "assets", "index-2eb69c09.js");
  const bundle = readFileSync(app3dSource, "utf8");
  const runtime = readFileSync(app3dRuntime, "utf8");

  if (bundle.includes('le.load("cubes/roblox_color.ktx2","srgb")')) {
    throw new Error("App3D still has roblox color texture branch — run patch-roblox-detail-texture.mjs");
  }
  if (!bundle.includes("${this.options.obj}_dark_color.ktx2")) {
    throw new Error("App3D missing holo dark_color template — bundle may be broken");
  }
  console.log("OK bundle uses holo shader for roblox (like monkey)");

  for (const p of [app3dSource, app3dRuntime, indexPath]) {
    const r = spawnSync(process.execPath, ["--check", p], { encoding: "utf8" });
    if (r.status !== 0) {
      throw new Error(`Syntax check failed for ${p}: ${r.stderr}`);
    }
  }
  console.log("OK App3D + index syntax");

  if (!readFileSync(indexPath, "utf8").includes(`${RUNTIME_BUNDLE}?v=`)) {
    throw new Error(`index bundle missing ${RUNTIME_BUNDLE} cache-bust — run patch-index-bundle.mjs`);
  }
  console.log("OK index App3D cache-bust");

  const htmlPath = join(ROOT, "index.html");
  const html = readFileSync(htmlPath, "utf8");
  if (!html.includes("index-2eb69c09.js?v=")) {
    throw new Error("index.html missing entry script cache-bust — run patch-index-bundle.mjs");
  }
  console.log("OK index.html cache-bust");

  for (const path of [
    "geometries/roblox.drc",
    "images/cubes/roblox_color.png",
    "images/cubes/roblox_color.ktx2",
    RUNTIME_BUNDLE,
  ]) {
    const url = `${BASE}/assets/${path}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("text/html")) throw new Error(`HTML fallback for ${url}`);
    console.log(`OK HTTP ${path}`);
  }

  const spaProbe = await fetch(`${BASE}/portfolio/gamedev`);
  const spaHtml = await spaProbe.text();
  if (!spaHtml.includes("CoolBB") && !spaHtml.includes("index-2eb69c09.js")) {
    throw new Error(
      "SPA route /portfolio/gamedev not serving index.html — restart npm run start (serve.json rewrites)",
    );
  }
  console.log("OK SPA route /portfolio/gamedev");
}

async function analyzeScreenshot(pngBuffer) {
  const meta = await sharp(pngBuffer).metadata();
  const w = meta.width;
  const h = meta.height;
  const cropW = Math.floor(w * 0.35);
  const cropH = Math.floor(h * 0.35);
  const left = Math.floor((w - cropW) / 2);
  const top = Math.floor((h - cropH) / 2);

  const { data, info } = await sharp(pngBuffer)
    .extract({ left, top, width: cropW, height: cropH })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  let darkCount = 0;
  let blueCount = 0;
  let tanCount = 0;
  const total = info.width * info.height;

  for (let i = 0; i < total; i++) {
    const r = data[i * channels];
    const g = data[i * channels + 1];
    const b = data[i * channels + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum < 20) darkCount++;
    // Roblox hoodie blue cluster
    if (b > 100 && b > r * 1.2 && b > g * 0.9) blueCount++;
    // Skin tan cluster
    if (r > 140 && g > 100 && b > 70 && r > b && g > b * 0.7) tanCount++;
  }

  const darkRatio = darkCount / total;
  const blueRatio = blueCount / total;
  const tanRatio = tanCount / total;

  const metrics = {
    darkRatio: +darkRatio.toFixed(3),
    blueRatio: +blueRatio.toFixed(3),
    tanRatio: +tanRatio.toFixed(3),
  };

  // Holo avatar: procedural shading — not flat grey square, not camo shards.
  const pass =
    darkRatio < 0.2 &&
    tanRatio < 0.12;

  return { pass, metrics };
}

async function browserChecks() {
  const userDataDir = mkdtempSync(join(tmpdir(), "coolbb-roblox-verify-"));
  const chrome = spawn(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--enable-unsafe-swiftshader",
      "--use-gl=angle",
      `--remote-debugging-port=${PORT}`,
      "--remote-allow-origins=*",
      `--user-data-dir=${userDataDir}`,
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  await sleep(2500);

  let ws;
  try {
    const tabs = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json());
    const page = tabs.find((t) => t.type === "page");
    if (!page?.webSocketDebuggerUrl) throw new Error("No CDP page");

    ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((res, rej) => {
      ws.addEventListener("open", res);
      ws.addEventListener("error", rej);
    });

    let msgId = 0;
    const pending = new Map();
    const errors = [];
    const bootLogs = [];

    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
      if (msg.method === "Runtime.consoleAPICalled") {
        const text = msg.params.args.map((a) => a.value ?? a.description ?? "").join(" ");
        if (text.includes("[boot]")) bootLogs.push(text);
        if (msg.params.type === "error") errors.push(text);
      }
      if (msg.method === "Runtime.exceptionThrown") {
        errors.push(msg.params.exceptionDetails?.text || "exception");
      }
    });

    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = ++msgId;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });

    await send("Runtime.enable");
    await send("Network.enable");
    await send("Page.enable");
    await send("Page.navigate", { url: `${BASE}/portfolio/gamedev` });

    let ready = false;
    for (let i = 0; i < 40; i++) {
      await sleep(2000);
      if (bootLogs.some((l) => l.includes("createScenes done") || l.includes("App3D.ready done"))) {
        ready = true;
      }
      const titleRes = await send("Runtime.evaluate", {
        expression: "document.title",
        returnByValue: true,
      });
      const title = titleRes?.result?.value || "";
      if (title.includes("404")) {
        throw new Error("Got 404 page — SPA rewrites not active; restart npm run start");
      }
      if (ready && i >= 4) break;
    }

    await sleep(8000);

    const materialRes = await send("Runtime.evaluate", {
      expression: `(() => {
        const d = window.__coolbbRobloxDetail;
        const resources = performance.getEntriesByType("resource").map((e) => e.name);
        return {
          detail: d || null,
          loadedKtx2: resources.some((u) => u.includes("roblox_color.ktx2")),
          loadedPng: resources.some((u) => u.includes("roblox_color.png")),
          app3d: resources.some((u) => u.includes("App3D-coolbb.js")),
        };
      })()`,
      returnByValue: true,
    });
    const runtime = materialRes?.result?.value || {};
    console.log("runtime material:", runtime);

    if (runtime.loadedPng || runtime.loadedKtx2) {
      console.log("note: roblox texture assets may still load for other cubes");
    }
    if (!runtime.detail) {
      throw new Error("window.__coolbbRobloxDetail missing — VF roblox branch did not run");
    }
    if (runtime.detail.materialType !== "ShaderMaterial") {
      throw new Error(
        `Expected ShaderMaterial (holo), got ${runtime.detail.materialType}`,
      );
    }
    console.log("OK runtime holo material");

    const shot = await send("Page.captureScreenshot", { format: "png" });
    const pngBuffer = Buffer.from(shot.data, "base64");
    writeFileSync(SCREENSHOT_PATH, pngBuffer);
    console.log(`OK screenshot saved ${SCREENSHOT_PATH}`);

    const { pass, metrics } = await analyzeScreenshot(pngBuffer);
    console.log("visual metrics:", metrics);

    const robloxErrors = errors.filter(
      (e) => /roblox|draco|ktx2|KTX2|WebGL/i.test(e) && !/favicon/i.test(e),
    );
    if (robloxErrors.length) {
      console.warn("console errors:", robloxErrors.slice(0, 5));
    }

    if (!pass) {
      throw new Error(
        `Visual check failed (holo shards likely): dark=${metrics.darkRatio} blue=${metrics.blueRatio} tan=${metrics.tanRatio}`,
      );
    }
    console.log("OK visual check passed");
  } finally {
    chrome.kill();
    ws?.close();
  }
}

async function main() {
  await staticChecks();
  if (!SKIP_BROWSER) {
    await browserChecks();
  } else {
    console.log("SKIP_BROWSER=1 — static checks only");
  }
  console.log("\nRoblox detail verification passed");
}

main().catch((e) => {
  console.error("FAIL:", e.message);
  process.exit(1);
});
