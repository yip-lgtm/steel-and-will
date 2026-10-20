#!/usr/bin/env node
/**
 * Collect the cards the connector drew: download them, cut them to the
 * published size, and wire them into the reference arms.
 *
 * The connector draws at 3:4; the published 立繪 are 2:3, which is what the
 * card face is shaped for. The picture is cropped to that, from the centre,
 * so the two generations of art sit in the same frame.
 *
 *   node scripts/portrait-matrix-collect.mjs <result.json>
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PORTRAITS = resolve(ROOT, "public/portraits");
const resultFile = process.argv[2] || "/tmp/matrix-result.json";
if (!existsSync(resultFile)) {
  console.error(`no result file: ${resultFile}`);
  process.exit(1);
}
const result = JSON.parse(readFileSync(resultFile, "utf8"));
const library = JSON.parse(readFileSync(resolve(ROOT, "public/weapon-library.json"), "utf8"));
const byId = new Map((library.weapons ?? []).map((w) => [w.id, w]));

mkdirSync(PORTRAITS, { recursive: true });
const saved = [];
for (const item of result.success_items ?? []) {
  const id = String(item.file_name || "").replace(/\.[a-z]+$/i, "");
  const weapon = byId.get(id);
  if (!weapon) continue;
  // The asset url is short-lived; ask for a fresh one.
  const asset = JSON.parse(
    execFileSync("mcode-tools", ["get_asset_url", String(item.node_id)], { encoding: "utf8" }),
  );
  const raw = execFileSync("curl", ["-sL", "-o", "-", asset.download_url], {
    encoding: "buffer",
    maxBuffer: 64 * 1024 * 1024,
  });
  const tmp = `/tmp/matrix-${id}.bin`;
  writeFileSync(tmp, raw);
  const out = resolve(PORTRAITS, `${id}.jpg`);
  // Cut to the published 2:3 and re-encode as a JPEG.
  execFileSync("python3", [
    "-c",
    `from PIL import Image
im = Image.open("${tmp}").convert("RGB")
w, h = im.size
target = 1152 / 1728
if w / h > target:
    nw = int(h * target); x = (w - nw) // 2; im = im.crop((x, 0, x + nw, h))
else:
    nh = int(w / target); y = (h - nh) // 2; im = im.crop((0, y, w, y + nh))
im = im.resize((1152, 1728), Image.LANCZOS)
im.save("${out}", "JPEG", quality=88, optimize=True)
print(im.size)`,
  ]);
  saved.push(id);
  console.log(`saved public/portraits/${id}.jpg`);
}
writeFileSync("/tmp/matrix-saved.json", JSON.stringify(saved));
console.log(`${saved.length} card(s) saved`);

// Wire them into the reference arms, so the gallery can show them.
const armsPath = resolve(ROOT, "src/game/arms.ts");
let arms = readFileSync(armsPath, "utf8");
const added = [];
for (const id of saved) {
  const w = byId.get(id);
  if (!w) continue;
  if (arms.includes(`id: "${id}"`)) continue;
  const line = `  arm({ id: "${id}", name: "${w.name}", designation: "${w.designation}", nation: "${w.nation}", layer: "${w.layer}", kind: "${w.kind}", year: ${w.year}, pen: 20, armor: 8, history: "${w.history}" }),\n`;
  added.push(line);
}
if (added.length) {
  const end = arms.lastIndexOf("];");
  arms = arms.slice(0, end) + added.join("") + arms.slice(end);
  writeFileSync(armsPath, arms);
  console.log(`${added.length} arm(s) wired into the catalog`);
}
