#!/usr/bin/env node
/**
 * Publish the catalog's designation -> 立繪 map.
 *
 * The hourly writer in the Pages repo builds a campaign kit record and has to
 * say which image that card draws. Most of the time the weapon is already in
 * the roster and already has art, so the map saves a generation and keeps one
 * weapon on one image.
 *
 * The map is written to `public/portrait-index.json`, which the publish
 * workflow copies next to the war index in the Pages repo.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { asciiKey } from "./kit-portrait.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCES = [
  { path: resolve(ROOT, "src/game/catalog.ts"), marker: "unit(" },
  { path: resolve(ROOT, "src/game/arms.ts"), marker: "arm(" },
];

function matchBracket(text, from) {
  const pairs = { "[": "]", "{": "}", "(": ")" };
  if (!pairs[text[from]]) return -1;
  let depth = 0;
  let q = null;
  for (let i = from; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === "\\") { i++; continue; }
      if (c === q) q = null;
      continue;
    }
    if (c === "`" || c === '"' || c === "'") { q = c; continue; }
    if (c === "[" || c === "{" || c === "(") depth++;
    else if (c === "]" || c === "}" || c === ")") { depth--; if (depth === 0) return i + 1; }
  }
  return -1;
}

const portraits = {};
let seeds = 0;
for (const source of SOURCES) {
  if (!existsSync(source.path)) continue;
  const src = readFileSync(source.path, "utf8");
  for (let i = src.indexOf(source.marker); i > -1; i = src.indexOf(source.marker, i + 1)) {
    if (src[i - 1] === ".") continue;
    const brace = src.indexOf("{", i);
    if (brace < 0) break;
    const end = matchBracket(src, brace);
    if (end < 0 || end <= brace) break;
    const body = src.slice(brace, end);
    const id = /id:\s*"([^"]+)"/.exec(body)?.[1];
    if (!id) continue;
    seeds++;
    const portrait = /portrait:\s*pub\("portraits\/([^"]+)"\)/.exec(body)?.[1];
    if (!portrait) continue;
    const path = `portraits/${portrait}`;
    const name = /name:\s*"([^"]+)"/.exec(body)?.[1] ?? "";
    const designation = /designation:\s*"([^"]+)"/.exec(body)?.[1] ?? "";
    // The designation is the stable key: the writer puts the type there. The
    // name is the fallback, and only when it carries enough letters to be a
    // key at all -- a Chinese name like "法國 75" reduces to "75", which would
    // collide with every other number in the roster.
    for (const key of [asciiKey(designation), asciiKey(name)]) {
      if (!key || key.length < 3 || /^\d+$/.test(key)) continue;
      if (!portraits[key]) portraits[key] = path;
    }
  }
}

const out = resolve(ROOT, "public/portrait-index.json");
writeFileSync(out, JSON.stringify({ portraits }, null, 1) + "\n");
console.log(`portrait index: ${seeds} seed(s), ${Object.keys(portraits).length} key(s) -> ${out}`);
