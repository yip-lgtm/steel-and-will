#!/usr/bin/env node
/**
 * Add one 兵器娘 立繪 and wire it into the catalog source.
 *
 * Runs inside the app repository. The catalog in `src/game/catalog.ts` is the
 * single source of truth: a kit carries `portrait: pub("portraits/<id>.jpg")`
 * and the image lives in `public/portraits/<id>.jpg`. Writing the roster entry
 * here means the next build keeps the art — patching the built bundle instead
 * silently loses it on the next rebuild, which is what happened twice already.
 *
 * Environment:
 *   MINIMAX_API_KEY   required (no mock in this script)
 *   PORTRAIT_OFFSET   rotate the pick when several runs race
 *
 * Verified against the MiniMax image_generation reference:
 *   POST {base}/image_generation  { model:"image-01", prompt, width, height, n,
 *                                   response_format:"url", prompt_optimizer }
 *   width/height: [512,2048], divisible by 8, must be set together.
 *   aspect_ratio only offers 1:1 / 16:9 / 9:16, so it is NOT used — 1152x1728
 *   gives the true 2:3 that the published 立繪 already use.
 *   response_format "url" expires in 24 hours, so the bytes are downloaded and
 *   committed; the URL is never stored.
 *   The service nests the link under data.image_urls[0] — the published
 *   reference shows data[0].url, which is wrong and cost two paid generations.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.env.REPO_ROOT || resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = resolve(ROOT, "src/game/catalog.ts");
const PORTRAITS = resolve(ROOT, "public/portraits");

// 1152x1728 = 2:3, both divisible by 8, both inside [512,2048].
const W = 1152;
const H = 1728;

const NATION = {
  fr: { uni: "French military uniform of the period, horizon-blue tunic with red piping", pal: "horizon blue and red" },
  de: { uni: "German Wehrmacht feldgrau tunic with collar tabs", pal: "feldgrau and gunmetal" },
  uk: { uni: "British khaki service dress with brass buttons and collar badges", pal: "khaki and brass" },
  us: { uni: "American olive-drab service uniform with brass buttons", pal: "olive drab and brass" },
  ussr: { uni: "Soviet khaki officer tunic with collar tabs and shoulder boards", pal: "soviet green" },
  jp: { uni: "Japanese naval white dress uniform with gold trim and shoulder boards", pal: "white and gold" },
  it: { uni: "Italian Royal Army grey-green uniform with collar patches", pal: "grey-green" },
  se: { uni: "Swedish grey uniform with collar patches", pal: "swedish grey" },
  cn: { uni: "Chinese PLA khaki uniform with red collar tabs", pal: "PLA green and red" },
  il: { uni: "Israeli olive-drab uniform", pal: "idf olive" },
};
const LAYER = {
  land: "Army service dress; the vehicle's or gun's most recognisable part worn as a shoulder plate",
  air: "leather flight suit with a fur collar; an aircraft part - spinner, cowling louvre or wing-root rib - as a shoulder harness",
  sea: "naval dress; a ship's fitting - turret face, rangefinder or anchor-stock plate - as a collar device",
};
const KIND = {
  tank: "an armoured hull plate",
  infantry: "the service rifle's receiver as a chest plate",
  artillery: "a gun breech ring",
  fighter: "a spinner and cowling section",
  bomber: "a bomb-bay rack section",
  battleship: "a main-gun turret face",
  carrier: "an island structure",
  cruiser: "a bridge face and porthole band",
  submarine: "a periscope section",
  destroyer: "a gun turret face",
};

// ------------------------------------------------------------------- catalog
if (!existsSync(CATALOG)) { console.error("src/game/catalog.ts not found"); process.exit(1); }
const src = readFileSync(CATALOG, "utf8");

/** Bracket matcher that skips template literals and quoted strings, so a
 *  bracket inside a history string cannot unbalance the scan. */
function matchBracket(from) {
  const pairs = { "[": "]", "{": "}", "(": ")" };
  if (!pairs[src[from]]) return -1;
  let depth = 0, q = null;
  for (let i = from; i < src.length; i++) {
    const c = src[i];
    if (q) { if (c === "\\") { i++; continue; } if (c === q) q = null; continue; }
    if (c === "`" || c === '"' || c === "'") { q = c; continue; }
    if (c === "[" || c === "{" || c === "(") depth++;
    else if (c === "]" || c === "}" || c === ")") { depth--; if (depth === 0) return i + 1; }
  }
  return -1;
}

const seeds = [];
for (let i = src.indexOf("unit("); i > -1; i = src.indexOf("unit(", i + 1)) {
  if (src[i - 1] === ".") continue;                 // skip `.unit(` if it ever appears
  const brace = src.indexOf("{", i);
  if (brace < 0) break;
  const end = matchBracket(brace);
  if (end < 0 || end <= brace) { console.error("unterminated seed at " + i); process.exit(1); }
  const body = src.slice(brace, end);
  const id = /id:\s*"([^"]+)"/.exec(body)?.[1];
  if (!id) continue;
  seeds.push({
    id,
    name: /name:\s*"([^"]+)"/.exec(body)?.[1] ?? id,
    designation: /designation:\s*"([^"]+)"/.exec(body)?.[1] ?? id,
    nation: /nation:\s*"([a-z]+)"/.exec(body)?.[1] ?? "us",
    layer: /layer:\s*"([a-z]+)"/.exec(body)?.[1] ?? "land",
    kind: /kind:\s*"([a-z]+)"/.exec(body)?.[1] ?? "infantry",
    year: Number(/year:\s*(\d+)/.exec(body)?.[1] ?? 0),
    // the closing brace of the seed object is where `portrait` is inserted
    insertAt: end - 1,
    referenced: /portrait:\s*pub\(/.test(body),
    onDisk: existsSync(resolve(PORTRAITS, `${id}.jpg`)),
  });
}

const seen = new Set(seeds.map((s) => s.id));
if (seen.size !== seeds.length) {
  console.error(`duplicate ids in catalog (${seeds.length} seeds, ${seen.size} unique) — refusing to edit`);
  process.exit(1);
}
console.log(`catalog seeds: ${seeds.length}`);

// An image on disk with no catalog reference is a repairable state, not a finished
// one. Wire those up for free instead of skipping them forever.
for (const sd of seeds) sd.hasPortrait = sd.referenced && sd.onDisk;
const orphans = seeds.filter((sd) => !sd.referenced && sd.onDisk);
const todo = seeds.filter((s) => !s.hasPortrait && !s.onDisk);

// The feed carries its own kit records and a few of them point at a portrait
// file. Those ids are not catalog seeds, so the scan above never reaches them:
// the Sea Harrier entry from the Falklands campaign referenced
// portraits/harrier.jpg and nothing could ever produce that file, so the card
// rendered a broken image. Collect them and generate the file directly -- the
// feed already holds the reference, so there is nothing to write back.
const feedPath = resolve(ROOT, "public/feed.json");
const feedWanted = [];
if (existsSync(feedPath)) {
  try {
    const feed = JSON.parse(readFileSync(feedPath, "utf8"));
    for (const item of feed.items ?? []) {
      const ref = item?.kit?.portrait;
      if (!ref) continue;
      const id = String(ref).replace(/^.*\//, "").replace(/\.jpg$/, "");
      if (!id || feedWanted.some((x) => x.id === id)) continue;
      const kit = item.kit ?? {};
      feedWanted.push({
        id,
        name: kit.name || id,
        designation: kit.designation || kit.name || id,
        nation: kit.nation || "us",
        layer: kit.layer || "land",
        kind: kit.kind || "infantry",
        year: Number(kit.year) || 0,
        onDisk: existsSync(resolve(PORTRAITS, `${id}.jpg`)),
        feedOnly: true,
      });
    }
  } catch (err) {
    console.warn(`feed.json not readable (${err.message}); feed portraits skipped this run`);
  }
}
const feedTodo = feedWanted.filter((f) => !f.onDisk);
console.log(
  `referenced: ${seeds.filter((s) => s.referenced).length} | orphan images: ${orphans.length} | ` +
    `need generation: ${todo.length} | feed portraits missing: ${feedTodo.length}`,
);
if (!todo.length && !orphans.length && !feedTodo.length) { console.log("every kit already has a 立繪 — nothing to do"); process.exit(0); }

const offset = Number(process.env.PORTRAIT_OFFSET || 0);
// Prefer wiring an orphan: the image already exists, so it costs nothing.
// A feed portrait that is referenced but missing shows as a broken image on the
// live card, so repair those before spending a generation on a new card.
const repairOnly = feedTodo.length === 0 && orphans.length > 0;
const card = feedTodo.length
  ? feedTodo[offset % feedTodo.length]
  : repairOnly
    ? orphans[offset % orphans.length]
    : todo[offset % todo.length];
console.log(
  repairOnly
    ? `target: ${card.id} (${card.name}) — image already on disk, wiring only, no API call`
    : `target: ${card.id} (${card.name}) — generate, ${todo.length} pending`,
);

// -------------------------------------------------------------------- prompt
const nat = NATION[card.nation] || NATION.us;
const lay = LAYER[card.layer] || LAYER.land;
const kind = KIND[card.kind] || "the weapon's single most recognisable external feature";
const era = card.year < 1919 ? "First World War era" : card.year <= 1945 ? "Second World War era" : card.year <= 1991 ? "Cold War" : "modern";
const prompt = [
  `Anime-style character portrait of an adult woman personifying the ${card.designation} (${card.year}).`,
  `She wears an accurate ${era} ${nat.uni}. Palette: ${nat.pal}.`,
  `Framing: bust-up, cropped near the mid-torso, facing the viewer.`,
  `Integrated into the outfit: ${kind}, ${lay}.`,
  `Background: a flat warm cream-to-beige vertical gradient, no scenery, no props.`,
  `Style: clean uniform line art, soft cel shading, gentle closed-mouth smile, warm brown eyes.`,
  `Dignified and composed, not in a fighting stance.`,
  `No text, no signature, no watermark, no real-world insignia or national flag.`,
].join(" ");

// ------------------------------------------------------------------ generate
// A repair needs no key and no API call.
const key = repairOnly ? "" : process.env.MINIMAX_API_KEY;
if (!key && !repairOnly) { console.error("MINIMAX_API_KEY missing"); process.exit(1); }
const base = (process.env.MINIMAX_BASE_URL || "https://api.minimax.io/v1").replace(/\/$/, "");

if (!repairOnly) {
  const res = await fetch(`${base}/image_generation`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.MINIMAX_IMAGE_MODEL || "image-01",
      prompt, width: W, height: H, n: 1,
      response_format: "url",
      prompt_optimizer: false,
    }),
  });
  if (!res.ok) { console.error(`image_generation HTTP ${res.status}:`, (await res.text()).slice(0, 600)); process.exit(1); }
  const body = await res.json();
  if (body.base_resp?.status_code && body.base_resp.status_code !== 0) {
    console.error("api:", body.base_resp.status_code, body.base_resp.status_msg); process.exit(1);
  }
  // The service nests the link under data.image_urls[0]; the published reference
  // shows data[0].url, which is wrong and cost two paid generations.
  const url = body.data?.image_urls?.[0] || body.data?.[0]?.url || body.data?.url || null;
  if (!url) { console.error("no image url in response. body:", JSON.stringify(body).slice(0, 1000)); process.exit(1); }

  // the signed url dies in 24h — pull the bytes now
  const img = await fetch(url);
  if (!img.ok) { console.error(`image download HTTP ${img.status}`); process.exit(1); }
  const bytes = Buffer.from(await img.arrayBuffer());
  if (bytes.length < 4096) { console.error(`image too small (${bytes.length}B)`); process.exit(1); }
  mkdirSync(PORTRAITS, { recursive: true });
  writeFileSync(resolve(PORTRAITS, `${card.id}.jpg`), bytes);
  console.log(`saved public/portraits/${card.id}.jpg (${bytes.length} bytes)`);
} else {
  console.log(`reusing existing public/portraits/${card.id}.jpg`);
}

// ------------------------------------------------- wire into catalog.ts source
// A feed kit is not a catalog seed: the feed already carries its own portrait
// reference, so only the image file was missing and there is nothing to edit.
if (card.feedOnly) {
  console.log(`feed kit ${card.id} (${card.name}) — image only, no catalog edit`);
} else {
  const patched =
    // the seed already ends with a trailing comma — drop it before adding ours,
    // otherwise the edit emits `,,` and the file stops parsing
    src.slice(0, card.insertAt).trimEnd().replace(/,$/, "") +
    `,\n    portrait: pub("portraits/${card.id}.jpg"),\n  ` +
    src.slice(card.insertAt);

  // The duplicate check has to run against the ORIGINAL text: `patched` by
  // definition contains the new reference, so testing `patched` is always true.
  const REF = /portrait:\s*pub\("portraits\/([a-z0-9-]+)\.jpg"\)/g;
  const already = [...src.matchAll(REF)].map((m) => m[1]);
  const found = [...patched.matchAll(REF)].map((m) => m[1]);
  if (already.includes(card.id)) { console.error(`${card.id} already referenced — aborting`); process.exit(1); }
  if (found.length !== already.length + 1) {
    console.error(`expected ${already.length + 1} portrait refs after edit, found ${found.length} — aborting`);
    process.exit(1);
  }
  writeFileSync(CATALOG, patched, "utf8");
  console.log(`catalog: ${card.id} -> portrait: pub("portraits/${card.id}.jpg")`);
}

// -------------------------------------------------------------------- commit
if (process.env.COMMIT === "1") {
  const run = (cmd, args, allowFail = false) => {
    try { return execFileSync("git", ["-C", ROOT, cmd, ...args], { stdio: "pipe", encoding: "utf8" }); }
    catch (e) { if (allowFail) return null; throw e; }
  };
  run("config", ["user.name", "yip-lgtm"]);
  run("config", ["user.email", "258986088+yip-lgtm@users.noreply.github.com"]);
  run("add", ["public/portraits", "src/game/catalog.ts"]);
  const changed = run("diff", ["--staged", "--name-only"], true);
  if (!changed || !changed.trim()) { console.log("nothing staged"); process.exit(0); }
  run("commit", ["-q", "-m", `portraits: add ${card.name} (${card.id})`]);
  if (process.env.PUSH === "1") {
    run("fetch", ["--quiet", "origin"]);
    const behind = Number(run("rev-list", ["--count", "HEAD..origin/main"]).trim());
    if (behind > 0) { console.error(`origin/main moved ${behind} commit(s) — rebase and re-run`); process.exit(2); }
    run("push", ["origin", "HEAD:main"]);
    console.log("committed and pushed");
  } else {
    console.log("committed");
  }
}