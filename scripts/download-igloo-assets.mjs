import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const ASSETS = join(ROOT, "assets");
const BASE = "https://www.igloo.inc/assets/";

const MANIFEST = [
  // JS bundles and workers (App3D/index are patched locally — do not re-download)
  "bitmapworker-046527f8.js",
  "exrworker-41cbee65.js",
  "msdfworker-ac346fa7.js",
  "audioworker-036a09db.js",

  // Decoder libs
  "libs/draco/draco_decoder.wasm",
  "libs/draco/draco_decoder.js",
  "libs/draco/draco_wasm_wrapper.js",
  "libs/basis/basis_transcoder.wasm",
  "libs/basis/basis_transcoder.js",

  // Fonts
  "IBMPlexMono-Medium-897c8c30.woff2",
  "IBMPlexMono-Medium-1e253194.woff",
  "IBMPlexMono-Regular-d3034935.woff2",
  "IBMPlexMono-Regular-419d45f6.woff",
  "fonts/IBMPlexMono-Medium-datatexture.ktx2",
  "fonts/IBMPlexMono-Medium.json",

  // Favicons
  "favicon16-9e4401be.png",
  "favicon32-af94112f.png",

  // Audio (children.ogg + children-loop.ogg are local CoolBB assets)
  "audio/room.ogg",
  "audio/wind.ogg",
  "audio/igloo.ogg",
  "audio/beeps.ogg",
  "audio/beeps2.ogg",
  "audio/beeps3.ogg",
  "audio/click-project.ogg",
  "audio/enter-project.ogg",
  "audio/leave-project.ogg",
  "audio/shard.ogg",
  "audio/project-text.ogg",
  "audio/circles.ogg",
  "audio/particles.ogg",
  "audio/logo.ogg",
  "audio/ui-long.ogg",
  "audio/ui-short.ogg",
  "audio/manifesto.ogg",

  // Geometries
  "geometries/ground.drc",
  "geometries/mountain.drc",
  "geometries/intro_particles.drc",
  "geometries/igloo.drc",
  "geometries/igloo/igloo_cage.drc",
  "geometries/igloo/igloo_outline.drc",
  "geometries/igloo/patch.drc",
  "geometries/cubes/cube1.drc",
  "geometries/cubes/cube2.drc",
  "geometries/cubes/cube3.drc",
  "geometries/cubes/plexus.drc",
  "geometries/cubes/background_shapes.drc",
  "geometries/pudgy.drc",
  // monkey.drc is generated locally (npm run build:monkey)
  "geometries/overpass_logo.drc",
  "geometries/abstractlogo.drc",
  "geometries/floor.drc",
  "geometries/smoke_trail.drc",
  "geometries/shattered_ring.drc",
  "geometries/shattered_ring2.drc",
  "geometries/shattered_ring_smoke.drc",
  "geometries/ceilingsmoke.drc",
  "geometries/blurrytext_cylinder.drc",
  "geometries/blurrytext.drc",

  // Images — global
  "images/wind_noise.ktx2",
  "images/mosaic.ktx2",
  "images/clouds_noise.ktx2",
  "images/caustics.ktx2",
  "images/perlin-datatexture.ktx2",
  "images/perlin-datatexture.png",
  "images/scroll-datatexture.ktx2",
  "images/frost-datatexture.ktx2",
  "images/numbers-datatexture.ktx2",
  "images/shapes_blurred.ktx2",
  "images/floor_color.ktx2",
  "images/bokeh.ktx2",
  "images/cubes_env.exr",
  "images/social.jpg",

  // Images — igloo
  "images/igloo/ground_color.ktx2",
  "images/igloo/ground_glow.ktx2",
  "images/igloo/ground_sansigloo_color.ktx2",
  "images/igloo/mountain_color.ktx2",
  "images/igloo/triangles_tiling.ktx2",
  "images/igloo/numbers.ktx2",
  "images/igloo/igloo_color.ktx2",
  "images/igloo/igloo_exploded_color.ktx2",
  "images/igloo/igloo_scene.ktx2",

  // Images — cubes
  "images/cubes/bg.png",
  "images/cubes/blurrytext_atlas.ktx2",
  "images/cubes/dot_pattern.ktx2",
  "images/cubes/cube_scene.ktx2",
  "images/cubes/advect.png",
  "images/cubes/cube1_roughness.ktx2",
  "images/cubes/cube1_normal.ktx2",
  "images/cubes/cube2_roughness.ktx2",
  "images/cubes/cube2_normal.ktx2",
  "images/cubes/cube3_roughness.ktx2",
  "images/cubes/cube3_normal.ktx2",
  "images/cubes/pudgy_color.ktx2",
  // monkey_color.ktx2 is generated locally (npm run build:monkey)
  "images/cubes/abstractlogo_color.ktx2",
  "images/cubes/overpass_logo_color.ktx2",
  "images/pudgy_dark_color.ktx2",
  // monkey_dark_color.ktx2 is generated locally (npm run build:monkey)
  "images/abstractlogo_dark_color.ktx2",
  "images/overpass_logo_dark_color.ktx2",

  // Rings
  "images/shattered_ring_color.ktx2",
  "images/shattered_ring_ao.ktx2",
  "images/shattered_ring2_color.ktx2",
  "images/shattered_ring2_ao.ktx2",

  // Volumes
  "images/volumes/peachesbody_64.ktx2",
  "images/volumes/x_64.ktx2",
  "images/volumes/medium_32.ktx2",

  // UI — logo-datatexture.ktx2 is generated locally (npm run build:monkey)
  "images/ui/sound-datatexture.ktx2",
  "images/ui/arrow-datatexture.ktx2",
  "images/ui/close-datatexture.ktx2",
  "images/ui/visit-datatexture.ktx2",

  // Noise
  "images/noises/blue-8-128-rgb.ktx2",

  // Dev / fluid sim (optional but required for full boot)
  "images/uv/uvchecker-srgb.png",
];

async function download(path) {
  const url = BASE + path;
  const dest = join(ASSETS, path);
  await mkdir(dirname(dest), { recursive: true });

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`${res.status} ${url}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/html")) {
    throw new Error(`SPA fallback (html) for ${url}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return { path, size: buf.length, contentType };
}

async function main() {
  console.log(`Downloading ${MANIFEST.length} assets to ${ASSETS}`);
  const failed = [];
  const ok = [];

  for (const path of MANIFEST) {
    try {
      const info = await download(path);
      ok.push(info);
      console.log(`OK ${path} (${info.size} bytes)`);
    } catch (err) {
      failed.push({ path, error: err.message });
      console.error(`FAIL ${path}: ${err.message}`);
    }
  }

  console.log(`\nDone: ${ok.length} ok, ${failed.length} failed`);
  if (failed.length) {
    console.error("Failed:", failed);
    process.exitCode = 1;
  }
}

main();
