/**
 * CoolBB agency site content — sourced from X article positioning.
 * Edit this file to update copy; run patch-coolbb-agency.mjs to apply.
 */

export const TELEGRAM = "https://t.me/C00LBB";
export const X_PROFILE = "https://x.com/GoatForever97";
export const X_ARTICLE =
  "https://x.com/GoatForever97/status/2034555812891255030?s=20";

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
    "monkey",
    "We integrate intelligent AI agents into your products and fine-tune models for your exact use case.\n\n" +
      "Autonomous workflows, custom intelligence layers, and domain-specific performance — systems that deliver measurable results, not demos.",
    "monkey",
    1.1,
  ),
  cube(
    "SERVICE_02 Game Dev",
    "gamedev",
    "03/19/2026",
    -2,
    "cube2",
    "abstractlogo",
    "We build games across Roblox, native 2D, and 3D engines, targeting web, mobile, and desktop from a single technical pipeline.\n\n" +
      "Our work covers systems design, gameplay implementation, performance optimization, and production deployment — from prototype through ship.",
    "abstractlogo",
    1.2,
  ),
  cube(
    "SERVICE_03 SaaS",
    "saas",
    "03/19/2026",
    -3,
    "cube3",
    "overpass_logo",
    "Scalable SaaS platforms built for real businesses — rental marketplaces, medical services, and more.\n\n" +
      "Clean architecture, secure multi-tenant systems, and user-centric design from day one.",
    "overpass_logo",
    1.2,
  ),
  cube(
    "SERVICE_04 Trading Bots",
    "trading",
    "03/19/2026",
    -4,
    "cube1",
    "pudgy",
    "AI-powered trading bots for Polymarket and Hyperliquid.\n\n" +
      "We design, train, and deploy strategies that operate with precision in fast-moving markets.",
    "pudgy",
    1.15,
  ),
  cube(
    "SERVICE_05 Memecoin Launch",
    "memecoin",
    "03/19/2026",
    -5,
    "cube2",
    "monkey",
    "End-to-end token launch infrastructure: MEV-protected bundling, automated liquidity and market-making, on-chain holder analytics, and native wallet integrations.\n\n" +
      "We cover launch execution, liquidity bootstrapping, distribution mapping, and wallet-ready distribution from a single pipeline.",
    "monkey",
    1.1,
  ),
  cube(
    "SERVICE_06 Web3&Blockchain",
    "web3",
    "03/19/2026",
    -6,
    "cube3",
    "abstractlogo",
    "Full-stack blockchain engineering across Solana and EVM — DeFi protocols, play-to-earn economies, NFT marketplaces, and production-grade on-chain systems.\n\n" +
      "We cover smart contract architecture, tokenomics implementation, wallet integrations, liquidity and launch infrastructure, and mainnet deployment from a single technical pipeline.",
    "abstractlogo",
    1.2,
  ),
];
