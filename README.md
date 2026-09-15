# CoolBB Official Site

CoolBB is a base camp for builders in hard markets. This repository is the agency’s official 3D site: an interactive WebGL experience where the igloo is HQ, the stack is a scrollable portfolio, and each cube opens a service brief.

Live: [coolbb.dev](https://coolbb.dev)

## Experience

Visitors land in a full-screen Three.js scene — not a conventional marketing page.

1. **Boot** — a cyan “CoolBB Base Camp” marquee holds until the WebGL app is ready (tuned for slow networks).
2. **HQ** — the igloo scene, manifesto, and 3D ground tagline (“BASE CAMP / for builders”).
3. **Stack** — six service cubes. Click a cube to enter its interior: summary copy, featured work, and contact links.
4. **Entry links** — particle volumes for the agency article, X, and Telegram.

Visual language is CoolBB’s cyberpunk palette: deep navy, electric cyan, and warm amber.

## Services

| Cube | Focus |
| --- | --- |
| **AI** | Production AI, on-device agents, privacy-first workflows. Featured: Nova, a fully local smart-home assistant. |
| **Game Dev** | Roblox-first pipelines, Godot / Unity / Unreal when scope demands it. |
| **SaaS** | Operator-led products on Next.js, Supabase, Stripe, and Vercel, with agents as a first-class surface. |
| **Trading Bots** | Polymarket, Hyperliquid, and Solana arbitrage / liquidation systems. |
| **Memecoin Launch** | Solana and Robinhood Chain launch tooling, curves, and lightweight games. |
| **Web3 & Blockchain** | Production Solana and EVM — DeFi, tokenized assets, and intent-first wallet UX. |

## Quick start

Requires **Node.js 18+**.

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). The static server (`serve`) rewrites `/home` and `/portfolio/**` to `index.html`.

### Checks

```bash
npm run verify   # required assets exist on disk
npm run smoke    # HTTP smoke test against the local server
```

Run `npm start` in another terminal before `npm run smoke`.

## Architecture

The runtime is a **static site**: `index.html` loads hashed bundles under `assets/`. Those bundles are patched locally so every asset URL is relative, branding is CoolBB, and content matches this repo.

Do not edit `assets/index-*.js` or `assets/App3D-*.js` by hand. Change source content, then re-run the patch / build scripts.

| Path | Role |
| --- | --- |
| `index.html` | Entry document, Open Graph / Twitter metadata |
| `assets/` | Bundles, Draco meshes, KTX2 textures, audio, workers |
| `models/` | Source GLBs and generated textures for portfolio objects |
| `scripts/content/` | Canonical copy, links, loader, audio, and scene text |
| `scripts/patch-*.mjs` | Injects content and theme into the production bundles |
| `serve.json` | Local SPA rewrites and no-cache headers |

Content is authored in `scripts/content/` and applied into the App3D bundle:

| File | Controls |
| --- | --- |
| `scripts/content/agency.mjs` | Manifesto, social links, cube copy, entry holograms |
| `scripts/content/loader.mjs` | Boot marquee text and timing |
| `scripts/content/scene-text.mjs` | Ground tagline geometry |
| `scripts/content/funding-text.mjs` | HQ 3D line copy |
| `scripts/content/audio.mjs` | Background music and room bed levels |

Contact and social defaults live in `agency.mjs`:

- X: [@coolBilliBigBoy](https://x.com/coolBilliBigBoy)
- Telegram: [t.me/C00LBB](https://t.me/C00LBB)

## Content and rebuild

After editing files in `scripts/content/`, apply patches. A full local rebuild (models, logo, theme, loader, HUD, and index wiring) is:

```bash
npm run build:monkey
```

That pipeline imports portfolio GLBs, generates the CoolBB letter logo, writes volume textures, patches agency copy / audio / theme, and points the boot bundle at `assets/App3D-coolbb.js`.

Refresh upstream static assets (workers, fonts, shared geometries) without overwriting locally patched App3D/index bundles:

```bash
npm run download
```

## NPM scripts

| Script | Purpose |
| --- | --- |
| `npm start` | Serve the site at port 3000 |
| `npm run download` | Fetch shared assets, then patch the index bundle and loader |
| `npm run build:monkey` | Full CoolBB asset + bundle rebuild |
| `npm run verify` | Confirm required files are present |
| `npm run smoke` | Confirm the running server returns CoolBB, not remote URLs |
| `npm run validate:monkey-volume` | Check the entry volume texture |
| `npm run verify:roblox` / `validate:roblox-glb` | Roblox cube asset checks |

`scripts/` also contains one-off inspect, peek, and screenshot helpers used while adapting the WebGL bundles. They are not part of the production runtime.

## License

Site content, branding, and CoolBB-specific assets are © 2026 CoolBB. All rights reserved.

The 3D runtime is a customized local fork of a production WebGL experience, adapted here for CoolBB’s agency site.
