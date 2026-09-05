/**
 * CoolBB agency site content — sourced from X article positioning.
 * Edit this file to update copy; run patch-coolbb-agency.mjs to apply.
 */

export const TELEGRAM = "https://t.me/C00LBB";
export const X_HANDLE = "coolBilliBigBoy";
export const X_PROFILE = `https://x.com/${X_HANDLE}`;
export const X_ARTICLE =
  `https://x.com/${X_HANDLE}/status/2034555812891255030?s=20`;

export const manifesto = {
  title: "////// Base Camp",
  text:
    "CoolBB is the base camp for builders in hard markets.\n\n" +
    "The igloo is our HQ — multidisciplinary dev for AI, Web3, game, SaaS, and launches.\n\n" +
    "We refine concepts against market reality, then deliver architecture, milestones, and scalable builds.",
};

export const scroll = "Scroll down to see the stack.";
export const follow = "/// Follow Us";
export const copyright = "// Copyright © 2026";
export const rights = "CoolBB\nAll Rights Reserved.";

export const social = [
  { name: "X", link: X_PROFILE },
  { name: "TG", link: TELEGRAM },
];

/** Entry hologram link carousel (particle volumes) */
export const links = [
  { title: "CoolBB Agency", url: X_ARTICLE, vdb: "monkey_64", scale: 1.28 },
  {
    title: "X",
    url: X_ARTICLE,
    vdb: "x_64",
    scale: 1.3,
  },
  { title: "Contact", url: TELEGRAM, vdb: "medium_32", scale: 1.25 },
];

const interiorDefaults = {
  socialTitle: "/// Connect",
  social: [{ name: "X", link: X_ARTICLE }],
  linkTitle: "/// Contact",
  links: [{ name: "telegram", link: TELEGRAM }],
};

function cube(
  title,
  hash,
  date,
  temp,
  obj,
  innerobject,
  content,
  interiorObj,
  objScale = 1.1,
) {
  return {
    title,
    hash,
    date,
    temp,
    obj,
    innerobject,
    interior: {
      enabled: true,
      title: "////// Summary",
      content,
      ...interiorDefaults,
      obj: interiorObj,
      objScale,
    },
  };
}

export const cubes = [
  cube(
    "SERVICE_01 AI",
    "ai",
    "03/19/2026",
    0,
    "cube1",
    "grok",
    "We build AI for production — on-device agents, fine-tuned models, and workflows designed around privacy, latency, and cost. Systems that act in the real world, not demos that stop at the chat window.\n\n" +
      "Featured: Nova\n\n" +
      "Nova is a fully local smart-home assistant we shipped end to end. Speech stays on-device: a compact model interprets everyday language — implicit requests, slang, preferences — decides when to act, and routes the right tool calls. Home Assistant handles the devices; Nova handles intent.\n\n" +
      "No cloud LLMs. No subscriptions. No 70B model in the loop. Nova is private, always available, efficient at the edge, and built to respond when you need it — not to listen around the clock.\n\n" +
      "The result is an assistant that reliably controls a home instead of talking about it. That is the standard we bring to every engagement: practical AI that changes how people actually use technology in daily life.",
    "grok",
    1.1,
  ),
  cube(
    "SERVICE_02 Game Dev",
    "gamedev",
    "03/19/2026",
    -2,
    "cube2",
    "roblox",
    "We build for lean teams in 2026 — AI-accelerated pipelines, professional tooling, and performance that scales from mobile to high-end.\n\n" +
      "Roblox is our core: agentic Studio, Rojo + Git + roblox-ts workflows, mobile-first optimization, and native live-ops — Experiments, Configs, and analytics without custom infrastructure.\n\n" +
      "2D and 3D: Godot 4.7 by default; GameMaker or Unity 6 when scope demands it; Unreal for high-fidelity targets. Game-ready AI assets, modern engines, prototype through live ops.",
    "roblox",
    1.35,
  ),
  cube(
    "SERVICE_03 SaaS",
    "saas",
    "03/19/2026",
    -3,
    "cube3",
    "overpass_logo",
    "We build SaaS for real businesses — rental marketplaces, medical services, operator-led platforms — on the stacks winning teams ship in 2026.\n\n" +
      "AI is built in, not bolted on: streaming generation via Vercel AI SDK, RAG over customer data with pgvector in Postgres, tool-calling agents, and LangGraph multi-agent workflows where production complexity demands it. MCP is how we expose product and internal capabilities to agents — consistently and without one-off integrations.\n\n" +
      "Products are shifting from users clicking through screens to agents that complete workflows. That changes architecture and pricing — usage, outcome, and hybrid models alongside seat-based tiers. Security is non-negotiable: Row Level Security so agents cannot bypass tenant isolation.\n\n" +
      "We anchor on Next.js, Supabase, Stripe, and Vercel instead of stitching auth, billing, vectors, queues, and CMS separately. Architecture stays a modular monolith in a monorepo until scale or team boundaries require a split. Micro-frontends and Kubernetes wait until there is a real reason.",
    "overpass_logo",
    1.2,
  ),
  cube(
    "SERVICE_04 Trading Bots",
    "trading",
    "03/19/2026",
    -4,
    "cube1",
    "solana",
    "We design, deploy, and operate automated trading systems for Polymarket and Hyperliquid — built for live markets, tight execution, and production reliability.\n\n" +
      "On Polymarket, we engineer bots around prediction-market mechanics: pricing inefficiencies, liquidity conditions, and fast, rules-based execution. On Hyperliquid, we focus on perp infrastructure — low-latency order flow, risk controls, and strategies tuned to how the venue actually behaves under load.\n\n" +
      "Solana Arbitrage & Liquidation\n\n" +
      "Our strongest Solana system is a combined cross-venue arbitrage and protocol liquidation engine. These are market-neutral, protocol-sanctioned strategies — not directional bets.\n\n" +
      "Arbitrage — Prices between DEX venues (Raydium, Orca, Meteora, and others) dislocate in brief windows. We detect those gaps and atomically execute both legs with no net exposure.\n\n" +
      "Liquidations — Lending protocols (Kamino, Marginfi, Save) pay a bonus to close under-collateralized positions. We monitor account health in real time and execute qualifying liquidations when they clear.\n\n" +
      "We have built and operated systems like this before. This is where we have the most confidence in delivery.",
    "solana",
    1.15,
  ),
  cube(
    "SERVICE_05 Memecoin Launch",
    "memecoin",
    "03/19/2026",
    -5,
    "cube2",
    "bull",
    "We help teams launch on Solana and Robinhood Chain — curve infrastructure, launch utilities, and lightweight games that give a token more than a chart.\n\n" +
      "Solana remains the volume engine: Pump.fun and Meteora-style bonding curves, Jito-protected bundling, automated liquidity and market-making, on-chain holder analytics, and wallet-ready distribution. We build what surrounds the launch — sniper-aware tooling, distribution mapping, community utilities, and small playable experiences that drive retention without staffing a full game studio.\n\n" +
      "Robinhood Chain is now a real second lane. Pons and Pools Trade mirror the pump.fun playbook — bonding curves, graduation into locked Uniswap v4 pools, creator fee mechanics, and launch APIs to track curve fills and graduations. Execution is sequencer-first with no public mempool; we adapt Solana-hardened launch playbooks to that environment.\n\n" +
      "As a lean team we ship what launches actually need: fair-launch tooling, monitoring dashboards, social integrations, and bite-sized games tied to the token — fast to deploy, built to convert attention into holders.",
    "bull",
    1.1,
  ),
  cube(
    "SERVICE_06 Web3&Blockchain",
    "web3",
    "03/19/2026",
    -6,
    "cube3",
    "monkey",
    "We build production Web3 across Solana and EVM — DeFi, tokenized assets, on-chain economies, and systems users can operate without thinking like engineers.\n\n" +
      "The UX bar in 2026 is intent-first: users sign outcomes, apps and solver networks handle routing. On Ethereum that means ERC-4337 smart accounts, EIP-7702 EOA upgrades, paymasters, and cross-chain intent settlement. On Solana it means PDAs, session keys, sponsored fees, and CPI-native composability — programmable accounts without the EVM bundler overhead.\n\n" +
      "Engineering follows where liquidity and composability actually live.\n\n" +
      "Solana: Anchor programs with strict ownership and PDA validation, DeFi and RWA integrations in one execution environment, deployments tuned for multi-client resilience (Firedancer) and Alpenglow-grade finality.\n\n" +
      "EVM: audited Foundry/Solidity stacks, modular upgrade paths, and wallet flows built on Safe, Privy, and modern wallet-as-a-service infrastructure.\n\n" +
      "We cover protocol architecture, tokenomics, NFT and marketplace infrastructure, liquidity rails, indexing, and mainnet operations — from contract design through the wallet experience on the other side.",
    "monkey",
    1.1,
  ),
];
