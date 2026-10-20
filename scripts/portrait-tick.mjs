#!/usr/bin/env node
/**
 * Add one 兵器娘 立繪 and wire it into the catalog source.
 *
 * Runs inside the app repository. The catalog in `src/game/catalog.ts` is the
 * single source of truth for the playable roster: a kit carries
 * `portrait: pub("portraits/<id>.jpg")` and the image lives in
 * `public/portraits/<id>.jpg`. Writing the roster entry here means the next
 * build keeps the art -- patching the built bundle instead silently loses it
 * on the next rebuild, which is what happened twice already.
 *
 * The reference arms in `src/game/arms.ts` are cards too: the gallery renders
 * them on the same card face as the roster, so a card without art shows the
 * "立繪待生成" placeholder. They are wired the same way, from the same
 * generator, so every card in the gallery ends up with an illustration.
 *
 * Campaign kits are a third source. They live in the feed (`feed.json`), which
 * the Pages repo owns and writes every hour, so they are not catalog seeds and
 * cannot be wired by editing a source file. For those the feed already holds
 * the `portrait` reference; only the image file is missing and has to be
 * produced.
 *
 * Environment:
 *   MINIMAX_API_KEY   required (no mock in this script)
 *   PORTRAIT_OFFSET   rotate the pick when several runs race
 *   REPO_ROOT         where the repo lives (default: the parent of scripts/)
 *
 * Verified against the MiniMax image_generation reference:
 *   POST {base}/image_generation  { model, prompt, width, height, n,
 *                                   response_format:"url", prompt_optimizer }
 *   width/height: [512,2048], divisible by 8, must be set together.
 *   aspect_ratio only offers 1:1 / 16:9 / 9:16, so it is NOT used -- 1152x1728
 *   gives the true 2:3 that the published 立繪 already use.
 *   response_format "url" expires in 24 hours, so the bytes are downloaded and
 *   committed; the URL is never stored.
 *   The service nests the link under data.image_urls[0] -- the published
 *   reference shows data[0].url, which is wrong and cost two paid generations.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, openSync, closeSync, unlinkSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.env.REPO_ROOT || resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = resolve(ROOT, "src/game/catalog.ts");
const ARMS = resolve(ROOT, "src/game/arms.ts");
const PORTRAITS = resolve(ROOT, "public/portraits");

// 1152x1728 = 2:3, both divisible by 8, both inside [512,2048].
// image-01 is the only image model the /image_generation reference documents,
// and it is the one that worked: swapping this to MiniMax-M3.1-Flash-Preview
// stopped every portrait run for two and a half days, 10-12 04:21 onwards.
// That name is a text model and is used for the briefs and dossiers instead,
// where it does work -- see MINIMAX_MODEL in the Pages repo.
// MINIMAX_IMAGE_MODEL still overrides this.
const IMAGE_MODEL = process.env.PORTRAIT_IMAGE_MODEL || "image-01";

/**
 * PORTRAIT_ONLY pins the run to one id. The job normally takes the first
 * pending kit, which is what the scheduled run wants; pinning is for filling a
 * known gap, and for running several jobs over disjoint shards of the list
 * without two of them picking the same card.
 */
const only = process.env.PORTRAIT_ONLY || "";
const W = 1152;
const H = 1728;

/**
 * Every card the gallery can show, and where its seed lives.
 *
 * `marker` is the call that opens a seed object. `unit(` in the catalog and
 * `arm(` in the reference list are different shapes but the same record, so
 * the same scan handles both.
 */
const SOURCES = [
  { path: CATALOG, marker: "unit(", label: "catalog" },
  { path: ARMS, marker: "arm(", label: "arms" },
];

/**
 * Uniforms. The modern line is what the published 立繪 already use; the `old`
 * map covers the pre-1900 eras, where a WWI tunic on a hoplite would be a
 * different kind of wrong.
 */
const NATION = {
  fr: {
    uni: "French military uniform of the period, horizon-blue tunic with red piping",
    pal: "horizon blue and red",
    old: {
      ancient: "a Gallic linen tunic over leather armour, bronze helmet with a crest",
      classical: "a Roman-style mail and scale cuirass with a red cloak and crested helmet",
      medieval: "a mail coat under a surcoat, kettle hat, kite shield",
      earlymodern: "a blackened half-armour with a plumed morion and a sash",
      preindustrial: "an eighteenth-century French infantry coat with lace and tricorn",
      industrial: "a 1860s French uniform with a kepi and grey-blue coat",
    },
  },
  de: {
    uni: "German Wehrmacht feldgrau tunic with collar tabs",
    pal: "feldgrau and gunmetal",
    old: {
      ancient: "a Germanic hide and mail cuirass, conical iron helmet, round shield",
      classical: "a Roman-style lorica segmentata over a red tunic, legionary helmet",
      medieval: "a mail coat with a kettle hat, a war-hammer and a kite shield",
      earlymodern: "a Landsknecht slashed doublet, plumed beret, half-pike",
      preindustrial: "an eighteenth-century Prussian infantry coat, tricorne and musket",
      industrial: "a 1860s Prussian uniform with a pickelhaube and dark blue coat",
    },
  },
  uk: {
    uni: "British khaki service dress with brass buttons and collar badges",
    pal: "khaki and brass",
    old: {
      ancient: "a bronze-age warrior in a bronze helmet and mail shirt, spear and round shield",
      classical: "a Roman-style segmented plate over a red tunic, legionary helmet",
      medieval: "a mail hauberk and kettle hat, a longbow, a kite shield",
      earlymodern: "a padded doublet and trunk hose, morion, and a matchlock musket",
      preindustrial: "an eighteenth-century redcoat with tricorn and flintlock musket",
      industrial: "a 1860s British rifleman in a dark blue frock coat, kepi and Spencer rifle",
    },
  },
  us: {
    uni: "American olive-drab service uniform with brass buttons",
    pal: "olive drab and brass",
    old: {
      ancient: "a hide and wicker shield, a spear and a stone-headed axe",
      medieval: "a gambeson and mail, kettle hat, a hand gun",
      earlymodern: "a buckskin fringed jacket and tricorn, a long rifle",
      preindustrial: "an early nineteenth-century militia coat with a tall shako",
      industrial: "a 1860s Union uniform with a kepi and Springfield rifle",
    },
  },
  ussr: {
    uni: "Soviet khaki officer tunic with collar tabs and shoulder boards",
    pal: "soviet green",
    old: {
      ancient: "a steppe nomad in a fur coat with a composite bow",
      medieval: "a Mongol lamellar coat with a fur cap and a composite bow",
      earlymodern: "a Muscovite cavalryman in a caftan and fur hat with a sabre",
      preindustrial: "an eighteenth-century Russian infantry coat and a tricorn",
      industrial: "a 1860s Russian soldier in a brown kaftan and tall shako",
    },
  },
  jp: {
    uni: "Japanese naval white dress uniform with gold trim and shoulder boards",
    pal: "white and gold",
    old: {
      ancient: "an ancient Japanese warrior in lamellar armour with a long bow",
      medieval: "a samurai in o-yoroi lamellar armour with a naginata",
      earlymodern: "a Japanese arquebusier in a jinbaori and a straw hat",
      preindustrial: "an Edo-period samurai in a kimono and lamellar cuirass with a matchlock",
      industrial: "a late nineteenth-century Japanese infantryman in a dark blue tunic and peaked cap",
    },
  },
  it: {
    uni: "Italian Royal Army grey-green uniform with collar patches",
    pal: "grey-green and bronze",
    old: {
      ancient: "a Roman legionary in lorica segmentata, legionary helmet with a crest, scutum and gladius",
      classical: "a Roman legionary in lorica segmentata, legionary helmet with a crest, scutum and gladius",
      medieval: "a Byzantine scale-armoured soldier in a conical helmet with a pavise",
      earlymodern: "an Italian condottieri in a half-armour with a plumed helmet and a rapier",
      preindustrial: "an eighteenth-century Italian infantry coat with tricorn",
      industrial: "a 1860s Italian Bersagliere with a feathered hat and a Carcano rifle",
    },
  },
  se: {
    uni: "Swedish grey uniform with collar patches",
    pal: "swedish grey and bronze",
    old: {
      ancient: "a Norse warrior in a bronze helmet with a round shield and a spear",
      medieval: "a Viking-age warrior in a mail shirt, round shield and a bearded axe",
      earlymodern: "a Swedish pikeman in a blue-and-yellow uniform with a corslet",
      preindustrial: "an eighteenth-century Swedish infantry coat with tricorn",
      industrial: "a 1860s Swedish soldier in a blue uniform and shako",
    },
  },
  cn: {
    uni: "Chinese PLA khaki uniform with red collar tabs",
    pal: "PLA green and red",
    old: {
      ancient: "a Zhou-era warrior in lamellar armour with a dagger-axe and a crossbow",
      classical: "a Han-era crossbowman in lacquered lamellar armour with a repeating crossbow",
      medieval: "a Song-dynasty crossbowman in black lacquered armour with a heavy repeating crossbow",
      earlymodern: "a Ming-dynasty matchlockman in a brigandine and a feathered cap",
      preindustrial: "a Qing-era soldier in a long robe with a conical hat and a matchlock",
      industrial: "a late nineteenth-century Green Standard soldier with a rifle and a queue",
    },
  },
  il: {
    uni: "Israeli olive-drab uniform",
    pal: "idf olive",
    old: {
      ancient: "a Judean spearman with a shield and a slingshot",
      medieval: "a Crusader knight in mail and a great helm with a crossbow",
      earlymodern: "an Ottoman-era irregular with a musket and a sash",
      preindustrial: "an Ottoman infantryman in a red fez and a long coat with a musket",
      industrial: "a late nineteenth-century Ottoman soldier in a dark uniform and a fez",
    },
  },
  // Feed-side nations. The game roster has no campaign for these, so they
  // only ever appear on a campaign card, and the gallery labels them from the
  // feed's own nation list.
  gr: {
    uni: "a Greek evzone in a fustanella, red fez and embroidered waistcoat",
    pal: "Greek blue and white",
    old: {
      ancient: "a Greek hoplite in a bronze helmet, bronze cuirass, red cloak and a hoplon shield",
      classical: "a Greek hoplite in a bronze helmet, bronze cuirass, red cloak and a hoplon shield",
      medieval: "a Byzantine Greek soldier in scale armour with a conical helmet and a long spear",
      earlymodern: "a Greek infantryman in a fustanella and a fez with a musket",
    },
  },
  tr: {
    uni: "an Ottoman sipahi in a dark-blue jacket and a red fez",
    pal: "ottoman crimson and indigo",
    old: {
      medieval: "an Ottoman sipahi in a mail coat under a turbaned helmet with a composite bow",
      earlymodern: "an Ottoman janissary in a bork robe and a tall white headdress with an arquebus",
      preindustrial: "an Ottoman artilleryman in a red jacket and a great turban beside a siege gun",
      industrial: "an Ottoman soldier in a dark-red tunic and a kalpak with a Martini-Henry rifle",
    },
  },
  es: {
    uni: "a Spanish infantry uniform of the period, grey-blue coat with red facings",
    pal: "castilian red and silver",
    old: {
      earlymodern: "a Spanish tercio pikeman in a buff coat and a morion with apartisan and a matchlock",
      preindustrial: "an eighteenth-century Spanish infantryman in a blue coat and tricorn",
      industrial: "a 1860s Carlist infantryman in a red beret with a Beret rifle",
    },
  },
  nl: {
    uni: "a Dutch marine in a dark blue eighteenth-century-style coat",
    pal: "dutch orange and navy",
    old: {
      earlymodern: "a Dutch musketeer in a buff coat and a leather cap with a matchlock musket",
      preindustrial: "an eighteenth-century Dutch soldier in a blue coat and tricorn",
      industrial: "a 1860s Dutch grenadier in a dark blue tunic and bearskin",
    },
  },
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

/**
 * The era of a card, from its service year. Negative years are BC, which the
 * feed writes for the pre-1000 spans.
 */
function eraOf(year) {
  if (year < 0) return { key: "ancient", phrase: "ancient, before the common era" };
  if (year < 500) return { key: "classical", phrase: "classical antiquity" };
  if (year < 1000) return { key: "earlymedieval", phrase: "early medieval" };
  if (year < 1500) return { key: "medieval", phrase: "high medieval" };
  if (year < 1650) return { key: "earlymodern", phrase: "early modern" };
  if (year < 1800) return { key: "preindustrial", phrase: "pre-industrial" };
  if (year < 1919) return { key: "industrial", phrase: "the industrial age" };
  if (year <= 1945) return { key: "ww2", phrase: "Second World War era" };
  if (year <= 1991) return { key: "cold", phrase: "Cold War" };
  return { key: "modern", phrase: "modern" };
}

// ------------------------------------------------------------------- catalog

/** Bracket matcher that skips template literals and quoted strings, so a
 *  bracket inside a history string cannot unbalance the scan. */
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

/** Every seed of one source file, with the place a portrait reference goes. */
function scanSource(source) {
  if (!existsSync(source.path)) return [];
  // A caller that already has the text (the locked re-read) passes it in.
  const src = source.src ?? readFileSync(source.path, "utf8");
  const seeds = [];
  for (let i = src.indexOf(source.marker); i > -1; i = src.indexOf(source.marker, i + 1)) {
    if (src[i - 1] === ".") continue;                 // skip `.unit(` if it ever appears
    const brace = src.indexOf("{", i);
    if (brace < 0) break;
    const end = matchBracket(src, brace);
    if (end < 0 || end <= brace) { console.error("unterminated seed at " + i); process.exit(1); }
    const body = src.slice(brace, end);
    const id = /id:\s*"([^"]+)"/.exec(body)?.[1];
    if (!id) continue;
    const year = Number(/year:\s*(-?\d+)/.exec(body)?.[1] ?? 0);
    seeds.push({
      id,
      name: /name:\s*"([^"]+)"/.exec(body)?.[1] ?? id,
      designation: /designation:\s*"([^"]+)"/.exec(body)?.[1] ?? id,
      nation: /nation:\s*"([a-z]+)"/.exec(body)?.[1] ?? "us",
      layer: /layer:\s*"([a-z]+)"/.exec(body)?.[1] ?? "land",
      kind: /kind:\s*"([a-z]+)"/.exec(body)?.[1] ?? "infantry",
      year,
      // the closing brace of the seed object is where `portrait` is inserted
      insertAt: end - 1,
      referenced: /portrait:\s*pub\(/.test(body),
      onDisk: existsSync(resolve(PORTRAITS, `${id}.jpg`)),
      source,
      src,
    });
  }
  return seeds;
}

const allSeeds = SOURCES.flatMap(scanSource);
const seen = new Set(allSeeds.map((s) => s.id));
if (seen.size !== allSeeds.length) {
  console.error(`duplicate ids in catalog (${allSeeds.length} seeds, ${seen.size} unique) -- refusing to edit`);
  process.exit(1);
}
console.log(`catalog seeds: ${allSeeds.filter((s) => s.source.label === "catalog").length}`);
console.log(`arms seeds:   ${allSeeds.filter((s) => s.source.label === "arms").length}`);

// An image on disk with no catalog reference is a repairable state, not a finished
// one. Wire those up for free instead of skipping them forever.
for (const sd of allSeeds) sd.hasPortrait = sd.referenced && sd.onDisk;
const orphans = allSeeds.filter((sd) => !sd.referenced && sd.onDisk);
const todo = allSeeds.filter((s) => !s.hasPortrait && !s.onDisk && (!only || s.id === only));

// The feed carries its own kit records and every one of them points at a
// portrait file. Those ids are not catalog seeds, so the scan above never
// reaches them: the Sea Harrier entry from the Falklands campaign referenced
// portraits/harrier.jpg and nothing could ever produce that file, so the card
// rendered a broken image. Collect them and generate the file directly -- the
// feed already holds the reference, so there is nothing to write back.
//
// The live feed is the Pages repo's, and the Pages repo is the one that writes
// it every hour, so the local copy in this repo is hours behind. Read the
// deployed feed as well, otherwise the newest campaigns never get art.
const feedWanted = [];
const feedSeen = new Set();
function collectFeedKit(kit) {
  const ref = kit?.portrait;
  if (!ref) return;
  const id = String(ref).replace(/^.*\//, "").replace(/\.jpg$/, "");
  if (!id || feedSeen.has(id)) return;
  feedSeen.add(id);
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
// The live feed is the Pages repo's, and the Pages repo is the one that writes
// it every hour, so the local copy in this repo is hours behind. Read the
// deployed feed as well, otherwise the newest campaigns never get art.
// FEED_FILE points the job at a specific copy when filling a known gap.
const feedPath = resolve(process.env.FEED_FILE || resolve(ROOT, "public/feed.json"));
if (existsSync(feedPath)) {
  try {
    const feed = JSON.parse(readFileSync(feedPath, "utf8"));
    for (const item of feed.items ?? []) collectFeedKit(item.kit);
  } catch (err) {
    console.warn(`feed.json not readable (${err.message}); feed portraits skipped this run`);
  }
}
const LIVE_FEED = process.env.FEED_URL || "https://yip-lgtm.github.io/cute/feed.json";
try {
  const res = await fetch(LIVE_FEED, { cache: "no-store" });
  if (res.ok) {
    const feed = await res.json();
    for (const item of feed.items ?? []) collectFeedKit(item.kit);
    console.log(`live feed: ${feed.items?.length ?? 0} item(s) from ${LIVE_FEED}`);
  } else {
    console.warn(`live feed HTTP ${res.status}; using the local copy only`);
  }
} catch (err) {
  console.warn(`live feed not reachable (${err.message}); using the local copy only`);
}

const feedTodo = feedWanted.filter((f) => !f.onDisk && (!only || f.id === only));
console.log(
  `referenced: ${allSeeds.filter((s) => s.referenced).length} | orphan images: ${orphans.length} | ` +
    `need generation: ${todo.length} | feed portraits missing: ${feedTodo.length}`,
);
if (!todo.length && !orphans.length && !feedTodo.length) {
  if (only) { console.log(`${only}: nothing pending`); process.exit(0); }
  console.log("every kit already has a 立繪 -- nothing to do"); process.exit(0);
}

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
    ? `target: ${card.id} (${card.name}) -- image already on disk, wiring only, no API call`
    : `target: ${card.id} (${card.name}) -- generate, ${todo.length} pending`,
);

// -------------------------------------------------------------------- prompt
const nat = NATION[card.nation] || NATION.us;
const lay = LAYER[card.layer] || LAYER.land;
const kind = KIND[card.kind] || "the weapon's single most recognisable external feature";
const era = eraOf(card.year);
const uniform = card.year < 1900 && nat.old?.[era.key] ? nat.old[era.key] : nat.uni;
const when = card.year < 0 ? `${-card.year} BC` : `${card.year}`;
const prompt = [
  `Anime-style character portrait of an adult woman personifying the ${card.designation} (${when}).`,
  `She wears an accurate ${era.phrase} uniform: ${uniform}. Palette: ${nat.pal}.`,
  `Framing: bust-up, cropped near the mid-torso, facing the viewer.`,
  `Integrated into the outfit: ${kind}, ${lay}.`,
  `Background: a flat warm cream-to-beige vertical gradient, no scenery, no props.`,
  `Style: clean uniform line art, soft cel shading, gentle closed-mouth smile, warm brown eyes.`,
  `Dignified and composed, not in a fighting stance.`,
  `No text, no signature, no watermark, no real-world insignia or national flag.`,
].join(" ");

// --------------------------------------------------------------- source lock
// Several of these jobs can run at once -- the scheduled one, and a fill run
// over a shard of the list. They all edit the same two source files, so the
// read-modify-write has to be serialised: two jobs that read the same file
// and write it back each lose the other's edit, and a job that reads while
// another is writing sees half a file and reports an unterminated seed.
//
// The lock covers only the edit, not the generation, so the jobs still run in
// parallel where the time is actually spent.
const LOCK = resolve(ROOT, ".portrait.lock");

function acquireLock() {
  for (let attempt = 0; attempt < 600; attempt++) {
    try {
      const fd = openSync(LOCK, "wx");
      closeSync(fd);
      return;
    } catch (err) {
      if (err.code !== "EEXIST") throw err;
      // A lock left behind by a killed job would block everything. Take it
      // over once it is clearly stale.
      try {
        if (Date.now() - statSync(LOCK).mtimeMs > 120_000) {
          unlinkSync(LOCK);
          continue;
        }
      } catch {
        continue;
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
    }
  }
  throw new Error("could not take the source lock");
}

function releaseLock() {
  try { unlinkSync(LOCK); } catch { /* already gone */ }
}

/**
 * Add the portrait reference to one seed, re-reading the file first.
 *
 * The seed is located again here because the file may have changed since the
 * scan: another job may have wired a different card in the meantime, which
 * moves every offset after it.
 */
function wirePortrait(source, id) {
  acquireLock();
  try {
    const src = readFileSync(source.path, "utf8");
    const seeds = scanSource({ ...source, src });
    const seed = seeds.find((s) => s.id === id);
    if (!seed) { console.error(`${id} not found in ${source.path}`); return false; }
    if (seed.referenced) { console.log(`${source.label}: ${id} already wired`); return true; }
    const before = src.slice(0, seed.insertAt);
    const after = src.slice(seed.insertAt);
    const lineStart = before.lastIndexOf("\n") + 1;
    const onOneLine = before.trim() !== "" && before.indexOf("\n") === lineStart && /,\s*$/.test(before);
    let patched;
    if (onOneLine) {
      patched = before.trimEnd().replace(/,$/, "") + `, portrait: pub("portraits/${id}.jpg")` + after;
    } else {
      const closingIndent = (before.slice(lineStart).match(/^\s*/) || [""])[0];
      const fieldIndent = closingIndent + "  ";
      patched =
        before.trimEnd().replace(/,$/, "") +
        `,\n${fieldIndent}portrait: pub("portraits/${id}.jpg"),\n${closingIndent}` +
        after;
    }
    const REF = /portrait:\s*pub\("portraits\/([a-z0-9-]+)\.jpg"\)/g;
    const already = [...src.matchAll(REF)].map((m) => m[1]);
    const found = [...patched.matchAll(REF)].map((m) => m[1]);
    if (already.includes(id)) { console.error(`${id} already referenced -- aborting`); return false; }
    if (found.length !== already.length + 1) {
      console.error(`expected ${already.length + 1} portrait refs after edit, found ${found.length} -- aborting`);
      return false;
    }
    writeFileSync(source.path, patched, "utf8");
    console.log(`${source.label}: ${id} -> portrait: pub("portraits/${id}.jpg")`);
    return true;
  } finally {
    releaseLock();
  }
}

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
      model: process.env.MINIMAX_IMAGE_MODEL || IMAGE_MODEL,
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

  // the signed url dies in 24h -- pull the bytes now
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

// ------------------------------------------------- wire into the source file
// A feed kit is not a catalog seed: the feed already carries its own portrait
// reference, so only the image file was missing and there is nothing to edit.
if (card.feedOnly) {
  console.log(`feed kit ${card.id} (${card.name}) -- image only, no source edit`);
} else {
  if (!wirePortrait(card.source, card.id)) process.exit(1);
}

// -------------------------------------------------------------------- commit
if (process.env.COMMIT === "1") {
  const run = (cmd, args, allowFail = false) => {
    try { return execFileSync("git", ["-C", ROOT, cmd, ...args], { stdio: "pipe", encoding: "utf8" }); }
    catch (e) { if (allowFail) return null; throw e; }
  };
  run("config", ["user.name", "yip-lgtm"]);
  run("config", ["user.email", "258986088+yip-lgtm@users.noreply.github.com"]);
  run("add", ["public/portraits", "src/game/catalog.ts", "src/game/arms.ts"]);
  const changed = run("diff", ["--staged", "--name-only"], true);
  if (!changed || !changed.trim()) { console.log("nothing staged"); process.exit(0); }
  run("commit", ["-q", "-m", `portraits: add ${card.name} (${card.id})`]);
  if (process.env.PUSH === "1") {
    run("fetch", ["--quiet", "origin"]);
    const behind = Number(run("rev-list", ["--count", "HEAD..origin/main"]).trim());
    if (behind > 0) { console.error(`origin/main moved ${behind} commit(s) -- rebase and re-run`); process.exit(2); }
    run("push", ["origin", "HEAD:main"]);
    console.log("committed and pushed");
  } else {
    console.log("committed");
  }
}
