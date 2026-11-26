#!/usr/bin/env node
/**
 * Restyle the weapon-girl portraits.
 *
 * The site keeps its 兵器娘 in two styles: the new cel-shaded one and the old
 * painted one. This script walks the roster and repaints the ones still in
 * the old style, ten at a time, because the image plan allows only a few
 * requests per minute.
 *
 * Every repaint lands in src/public/portraits (the source of truth: the
 * publish workflow wipes cute/portraits and copies it over), then commits and
 * pushes. The progress list lives in restyle-done.json, so a run that dies
 * half way through never repeats work.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";

const SRC = "/workspace/.s2/src";
const PAGES = "/workspace/.s2/pages";
const CATALOG = `${SRC}/public/catalog.json`;
const DONE = "/workspace/qa/restyle-done.json";
const REDO = "/workspace/qa/restyle-redo.json";
const OUTDIR = `${SRC}/public/portraits`;
const TMP = "/workspace/qa/img/restyle";

const BATCH = Number(process.argv[2] ?? 10);

/** The first batch: painted by hand with the weapon in the picture. */
const SEEDED = [
  "mp40", "m3greasegun", "flak88", "churchill", "m3lee", "f4u", "mig15", "f14", "ak74", "m60",
  "tiger", "ak47", "garand",
];

const NATION_UNIFORM = {
  de: "a grey-green German field uniform with black collar tabs and red piping",
  us: "an olive drab US Army uniform with a canvas belt",
  ussr: "a Soviet olive field uniform with a brown chest harness",
  uk: "a khaki British battledress with a beret",
  fr: "a blue-grey French uniform with a kepi",
  it: "a grey-green Italian uniform with a collar badge",
  jp: "a khaki Japanese uniform with a starred cap",
  cn: "a green Chinese field uniform with a padded cap",
  se: "a blue-grey Swedish uniform with a peaked cap",
  il: "a khaki Israeli uniform with a beret",
  tr: "an olive Turkish uniform with a side cap",
  gr: "a grey Greek uniform with a puggaree",
  es: "an olive Spanish uniform with a field cap",
};

const HAIR = [
  "short dark brown hair under a field cap",
  "short black hair with a side part",
  "short auburn hair, a few strands loose",
  "wavy blonde hair tied back",
  "short chestnut hair under a beret",
  "long pale hair braided over one shoulder",
  "short silver hair, a scar through one eyebrow",
  "curly dark hair held by a headband",
];

const STYLE = (w, pose, weapon) =>
  `Single anime-style illustration, vertical portrait 2:3 composition. ` +
  `A young anime girl soldier personifying the ${w.designation} of ${w.year}: ${pose}. ` +
  `She has large expressive eyes, soft cel-shaded anime rendering, clean line art, ${HAIR[hash(w.id) % HAIR.length]}. ` +
  `She wears ${NATION_UNIFORM[w.nation] ?? "a plain field uniform"}, with red-trimmed epaulettes and a unit patch on the sleeve. ` +
  `${weapon} Warm cream-to-tan gradient background, soft studio lighting, gentle shading, ` +
  `high detail on the weapon, full body, no text, no signature, no watermark, no logo.`;

const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7);

function poseFor(w) {
  if (w.layer === "air") {
    return `she stands on the airfield in front of the aircraft, one hand raised in a salute and the other resting on her belt, ${w.kind === "bomber" ? "a bomb in the other hand" : "wind lifting her hair"}`;
  }
  if (w.layer === "sea") {
    return `she stands on the deck with a rail behind her, one hand on the gunwale and the other holding her cap, the ship behind her`;
  }
  if (w.kind === "artillery") {
    return "she stands beside the gun carriage with one hand on the breech, looking straight at the viewer";
  }
  if (w.kind === "destroyer" || w.kind === "battleship") {
    return "she stands on the deck with a rail behind her, one hand on the gunwale";
  }
  // A tank is a vehicle, not a rifle. The old wording ("she holds the weapon
  // across her body") made the model draw the tank small enough to carry in
  // her arms, which is exactly how the first tank portraits came out.
  if (w.kind === "tank") {
    return "she stands on open ground beside the tank at its real size, one hand resting on the gun barrel and the other on her hip, the whole vehicle behind her";
  }
  return "she holds the weapon across her body with both hands, looking straight at the viewer";
}

function weaponFor(w) {
  const d = w.designation;
  if (w.layer === "air") return `The ${d} stands behind her in three-quarter view, its shape and markings clearly readable.`;
  if (w.layer === "sea") return `The ${d} sits behind her, hull and superstructure clearly readable.`;
  if (w.kind === "artillery") return `The ${d} is drawn in full: long barrel, breech and carriage, with the wheels visible.`;
  if (w.kind === "tank") return `The ${d} stands on the ground behind her at its true scale, tracks, hull and turret clearly readable, far larger than a person.`;
  return `The ${d} itself is the focus: metal and wood rendered in detail, the whole weapon visible in her hands.`;
}

const readJson = (p, fb) => {
  if (!existsSync(p)) return fb;
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return fb;
  }
};

const catalog = readJson(CATALOG, { cards: [] });
// Ids that already have a new-style file but were drawn with a prompt that
// turned out wrong (the tank wording made the vehicle small enough to carry).
// They go back into the queue even though their file is already new-style.
const redo = new Set(readJson(REDO, []));
const done = new Set([...SEEDED, ...readJson(DONE, [])].filter((id) => !redo.has(id)));
const todo = catalog.cards.filter((c) => c.id && c.portrait && !done.has(c.id));
const batch = todo.slice(0, BATCH);
if (!batch.length) {
  console.log("全部兵器娘已經係新風格 ✓");
  process.exit(0);
}
console.log(`未重畫：${todo.length} 件；今批 ${batch.length} 件：${batch.map((c) => c.name).join("、")}`);

mkdirSync(TMP, { recursive: true });
const argsFile = `${TMP}/req.json`;
const outFile = `${TMP}/res.json`;
writeFileSync(
  argsFile,
  JSON.stringify({
    requests: batch.map((w) => ({
      prompt: STYLE(w, poseFor(w), weaponFor(w)),
      aspect_ratio: "2:3",
      area: "2K",
      output_format: "jpg",
      output_file: `${w.id}.jpg`,
    })),
  }),
  "utf8",
);

const sh = (cmd, args) =>
  execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 });

let res = {};
try {
  res = JSON.parse(sh("mcode-tools", ["connector", "call", "connector__matrix__generate_image", "--args-file", argsFile]));
} catch (e) {
  console.log(`生成失敗：${String(e.stdout ?? e.message).slice(0, 300)}`);
  process.exit(1);
}
const ok = res.success_items ?? [];
const failed = res.failed_items ?? [];
console.log(`生成：成功 ${ok.length}／失敗 ${failed.length}`);
for (const f of failed.slice(0, 3)) console.log(`  失敗原因：${String(f.error_msg ?? "").slice(0, 120)}`);

const landed = [];
for (const item of ok) {
  const name = item.file_name;
  const id = name.replace(/\.jpg$/, "");
  if (!batch.some((w) => w.id === id)) continue;
  try {
    const { download_url } = JSON.parse(sh("mcode-tools", ["get_asset_url", item.node_id]));
    execFileSync("curl", ["-sk", "--max-time", "90", download_url, "-o", `${OUTDIR}/${name}`]);
    execFileSync("cp", [`${OUTDIR}/${name}`, `${PAGES}/cute/portraits/${name}`]);
    landed.push(id);
    done.add(id);
    redo.delete(id);
  } catch (e) {
    console.log(`  ${name} 下載失敗`);
  }
}
writeFileSync(DONE, JSON.stringify([...done].sort(), null, 1) + "\n", "utf8");
writeFileSync(REDO, JSON.stringify([...redo].sort(), null, 1) + "\n", "utf8");
console.log(`落地 ${landed.length} 張 → src/public/portraits（+ pages/cute/portraits）`);
console.log(`進度：${done.size}／${catalog.cards.length} 件已係新風格`);
