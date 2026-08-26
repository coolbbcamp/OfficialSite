const { readFileSync, writeFileSync } = require("node:fs");
const { compress } = require("@mongodb-js/zstd");

const inPath = process.argv[2];
const outPath = process.argv[3];
if (!inPath || !outPath) {
  console.error("Usage: node zstd-compress.cjs <input> <output>");
  process.exit(1);
}

compress(readFileSync(inPath))
  .then((out) => {
    writeFileSync(outPath, out);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
