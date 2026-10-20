#!/usr/bin/env node
/**
 * Plan a batch of 立繪 for the connector's image service.
 *
 * The MiniMax image endpoint is one way to draw a card; the connector is
 * another, and it runs on the account's credits rather than on the token
 * plan. The prompt is the same either way, so a card looks the same however
 * it was drawn.
 *
 *   node scripts/portrait-matrix-plan.mjs [batchSize] [outFile]
 *
 * It writes the arguments for `mcode-tools connector call
 * connector__matrix__generate_image` and prints the ids it asked for.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildPrompt } from "./portrait-prompt.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const library = JSON.parse(readFileSync(resolve(ROOT, "public/weapon-library.json"), "utf8"));
const batchSize = Number(process.argv[2] || 8);
const outFile = process.argv[3] || "/tmp/matrix-batch.json";

const pending = (library.weapons ?? []).filter(
  (w) => !existsSync(resolve(ROOT, "public/portraits", `${w.id}.jpg`)),
);
const batch = pending.slice(0, batchSize);
if (!batch.length) {
  console.log("nothing to draw");
  process.exit(0);
}

const requests = batch.map((w) => ({
  prompt: buildPrompt({
    designation: w.designation,
    year: w.year,
    nation: w.nation,
    layer: w.layer,
    kind: w.kind,
  }),
  aspect_ratio: "3:4",
  resolution: "2K",
  output_file: w.id,
}));

writeFileSync(outFile, JSON.stringify({ requests }));
console.log(`${batch.length} card(s) queued: ${batch.map((w) => w.id).join(" ")}`);
console.log(`  -> ${outFile}`);
