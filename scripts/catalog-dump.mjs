#!/usr/bin/env node
/**
 * Dump the catalog as JSON, so the Pages repo can build the card deck.
 *
 * The deck is a single page that lists every card with its art. It lives in
 * the Pages repo, and the Pages repo does not have the catalog -- it only
 * gets the built site and the portrait files. This dump is what it reads.
 *
 * The Pages repo owns the live feed, so it builds the deck from its own
 * feed.json and from this catalog; only the catalog has to come from here.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCES = [
  { path: resolve(ROOT, "src/game/catalog.ts"), marker: "unit(" },
  { path: resolve(ROOT, "src/game/arms.ts"), marker: "arm(" },
];

function matchBracket(text, from) {
  const pairs = { "[": "]", "{": "}", "(": ")" };
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

const pick = (body, re) => (re.exec(body)?.[1] ?? null);

const cards = [];
for (const source of SOURCES) {
  if (!existsSync(source.path)) continue;
  const src = readFileSync(source.path, "utf8");
  for (let i = src.indexOf(source.marker); i > -1; i = src.indexOf(source.marker, i + 1)) {
    if (src[i - 1] === ".") continue;
    const brace = src.indexOf("{", i);
    if (brace < 0) break;
    const end = matchBracket(src, brace);
    if (end < 0) break;
    const body = src.slice(brace, end);
    const id = pick(body, /id:\s*"([^"]+)"/);
    if (!id) continue;
    const portrait = pick(body, /portrait:\s*pub\("portraits\/([^"]+)"\)/);
    cards.push({
      id,
      name: pick(body, /name:\s*"([^"]+)"/) ?? id,
      designation: pick(body, /designation:\s*"([^"]+)"/) ?? id,
      nation: pick(body, /nation:\s*"([a-z]+)"/) ?? "us",
      layer: pick(body, /layer:\s*"([a-z]+)"/) ?? "land",
      kind: pick(body, /kind:\s*"([a-z]+)"/) ?? "infantry",
      year: Number(pick(body, /year:\s*(-?\d+)/) ?? 0),
      epithet: pick(body, /epithet:\s*"([^"]+)"/) ?? "",
      pen: Number(pick(body, /pen:\s*(\d+)/) ?? 0),
      armor: Number(pick(body, /armor:\s*(\d+)/) ?? 0),
      history: pick(body, /history:\s*"([^"]+)"/) ?? "",
      portrait: portrait ? `portraits/${portrait}` : null,
    });
  }
}

const out = resolve(ROOT, "public/catalog.json");
writeFileSync(out, JSON.stringify({ cards }, null, 1) + "\n");
const withArt = cards.filter((c) => c.portrait).length;
console.log(`catalog dump: ${cards.length} card(s), ${withArt} with a 立繪 -> ${out}`);
