/**
 * Build CoolBB monkey assets: procedural model → Draco .drc + KTX2 textures.
 *
 * Prerequisites: npm install (three, sharp, draco3d, @gltf-transform/cli)
 * Usage: node scripts/convert-monkey-assets.mjs
 */
import { mkdir, writeFile, copyFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { generateMonkeyModel } from "./generate-monkey-model.mjs";

const require = createRequire(import.meta.url);
const draco3d = require("draco3d");
const basis = require("@gpu-tex-enc/basis");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MODEL_DIR = join(ROOT, "models", "monkey");
const ASSETS = join(ROOT, "assets");

function encodeGeometryToDrc(geometry, encoderModule) {
  if (!geometry.attributes.normal) {
    geometry.computeVertexNormals();
  }

  const pos = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  const uv = geometry.attributes.uv;
  const index = geometry.index;
  const encoder = new encoderModule.Encoder();
  const meshBuilder = new encoderModule.MeshBuilder();
  const mesh = new encoderModule.Mesh();

  const numPoints = pos.count;
  meshBuilder.AddFloatAttributeToMesh(
    mesh,
    encoderModule.POSITION,
    numPoints,
    3,
    pos.array
  );

  if (normal) {
    meshBuilder.AddFloatAttributeToMesh(mesh, encoderModule.NORMAL, numPoints, 3, normal.array);
  }

  if (uv) {
    meshBuilder.AddFloatAttributeToMesh(mesh, encoderModule.TEX_COORD, numPoints, 2, uv.array);
  }

  if (index) {
    meshBuilder.AddFacesToMesh(mesh, index.count / 3, index.array);
  } else {
    const indices = new Uint32Array(numPoints);
    for (let i = 0; i < numPoints; i++) indices[i] = i;
    const faceCount = Math.floor(numPoints / 3);
    meshBuilder.AddFacesToMesh(mesh, faceCount, indices.subarray(0, faceCount * 3));
  }

  encoder.SetSpeedOptions(5, 5);
  encoder.SetAttributeQuantization(encoderModule.POSITION, 14);
  if (normal) encoder.SetAttributeQuantization(encoderModule.NORMAL, 10);
  if (uv) encoder.SetAttributeQuantization(encoderModule.TEX_COORD, 12);
  encoder.SetEncodingMethod(encoderModule.MESH_EDGEBREAKER_ENCODING);

  const encoded = new encoderModule.DracoInt8Array();
  const len = encoder.EncodeMeshToDracoBuffer(mesh, encoded);
  if (len <= 0) throw new Error("Draco encoding failed");

  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) out[i] = encoded.GetValue(i);

  encoderModule.destroy(encoded);
  encoderModule.destroy(mesh);
  encoderModule.destroy(encoder);
  encoderModule.destroy(meshBuilder);

  return out;
}

async function toKtx2(inputPng, outputKtx2) {
  const out = basis.generate(inputPng, "ETC1S", true, ["-q", "200", "-mipmap"]);
  await copyFile(out, outputKtx2);
}

async function main() {
  console.log("Generating monkey mesh + textures...");
  const { geometry } = await generateMonkeyModel();

  console.log("Encoding Draco geometry...");
  const encoderModule = await draco3d.createEncoderModule({});
  const drc = encodeGeometryToDrc(geometry, encoderModule);

  await mkdir(join(ASSETS, "geometries"), { recursive: true });
  await mkdir(join(ASSETS, "images", "cubes"), { recursive: true });
  await mkdir(join(ASSETS, "images"), { recursive: true });

  await writeFile(join(ASSETS, "geometries", "monkey.drc"), drc);
  console.log(`OK geometries/monkey.drc (${drc.byteLength} bytes)`);

  const colorPng = join(MODEL_DIR, "monkey_color.png");
  const darkPng = join(MODEL_DIR, "monkey_dark.png");

  console.log("Encoding KTX2 textures...");
  await toKtx2(colorPng, join(ASSETS, "images", "cubes", "monkey_color.ktx2"));
  console.log("OK images/cubes/monkey_color.ktx2");
  await toKtx2(darkPng, join(ASSETS, "images", "monkey_dark_color.ktx2"));
  console.log("OK images/monkey_dark_color.ktx2");

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
