// Decodes committed .b64 asset files back to their binary originals.
//
// The GitHub contents API used to publish this repo can only commit text, so
// binary build assets (icons, fonts, images) are stored next to their real
// path with a .b64 suffix. The Windows build workflow runs this right after
// checkout, before `bun run dist:win`, restoring the real files.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === "release" || e.name === "dist" || e.name === "dist-electron") continue;
      walk(p, out);
    } else if (e.name.endsWith(".b64")) {
      out.push(p);
    }
  }
  return out;
}

const files = walk(root);
if (files.length === 0) {
  console.error("decode-assets: no .b64 files found — repository is missing binary assets");
  process.exit(1);
}

for (const b64 of files) {
  const target = b64.replace(/\.b64$/, "");
  writeFileSync(target, Buffer.from(readFileSync(b64, "utf8").replace(/\s+/g, ""), "base64"));
  console.log(`decoded ${relative(root, b64)} -> ${relative(root, target)}`);
}
