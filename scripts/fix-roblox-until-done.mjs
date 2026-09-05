/**
 * Fix Roblox Game Dev detail render — apply patches and verify until pass.
 * Usage: node scripts/fix-roblox-until-done.mjs
 */
import { spawn, spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MAX_ATTEMPTS = 5;
const VERIFY_PORT = Number(process.env.VERIFY_PORT || 3020);
const VERIFY_BASE = `http://127.0.0.1:${VERIFY_PORT}`;

function run(cmd, args, env = {}) {
  console.log(`\n> ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, ...env },
    shell: process.platform === "win32",
  });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  return r.status ?? 1;
}

function nodeScript(name, env = {}) {
  return run(process.execPath, [join(ROOT, "scripts", name)], env);
}

async function waitForServer(url, attempts = 40) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      /* retry */
    }
    await sleep(750);
  }
  return false;
}

async function startVerifyServer() {
  const child = spawn(`npx --yes serve . -l ${VERIFY_PORT} -c serve.json`, {
    cwd: ROOT,
    stdio: "ignore",
    shell: true,
  });
  await sleep(2000);
  const ok = await waitForServer(`${VERIFY_BASE}/`);
  if (!ok) {
    child.kill();
    throw new Error(`Verify server did not start on port ${VERIFY_PORT}`);
  }
  console.log(`OK verify server on ${VERIFY_BASE}`);
  return child;
}

async function main() {
  const serveProc = await startVerifyServer();

  try {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      console.log(`\n========== Roblox fix attempt ${attempt}/${MAX_ATTEMPTS} ==========`);

      const mode = "basic";
      const rotEnv = attempt >= 3 ? { ROBLOX_DETAIL_ROT: "1" } : {};

      if (nodeScript("validate-roblox-glb.mjs") !== 0) continue;
      if (nodeScript("import-roblox-from-glb.mjs") !== 0) continue;
      if (nodeScript("patch-roblox-detail-texture.mjs", { ROBLOX_DETAIL_MODE: mode }) !== 0)
        continue;
      if (nodeScript("patch-roblox-cube-flip.mjs") !== 0) continue;
      if (nodeScript("patch-coolbb-agency.mjs") !== 0) continue;
      if (nodeScript("patch-monkey-detail-orientation.mjs", rotEnv) !== 0) continue;
      if (nodeScript("patch-index-bundle.mjs") !== 0) continue;

      const verifyStatus = nodeScript("verify-roblox-detail.mjs", {
        BASE_URL: VERIFY_BASE,
        CDP_PORT: String(9334 + attempt),
      });
      if (verifyStatus === 0) {
        console.log("\nRoblox Game Dev detail fix complete.");
        console.log(`Hard refresh: ${VERIFY_BASE}/portfolio/gamedev`);
        process.exit(0);
      }
      console.warn(`Attempt ${attempt} failed verification — retrying with escalated fix...`);
    }

    console.error(`\nFailed after ${MAX_ATTEMPTS} attempts. See tmp-roblox-detail.png`);
    process.exit(1);
  } finally {
    serveProc.kill();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
