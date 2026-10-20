#!/usr/bin/env node
/**
 * Fill a batch of 立繪 in one run.
 *
 * The scheduled portrait job draws one card per run, which is the right
 * shape for a site that adds a card every half hour. When the backlog is
 * hundreds of cards -- every campaign the bulk writer produced needs its own
 * picture -- the same job is run in a loop instead, and the whole batch is
 * committed at the end.
 *
 *   PORTRAIT_BATCH   how many cards to draw (default 10)
 *   COMMIT=1         commit and push when the batch is done
 */
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const tick = resolve(HERE, "portrait-tick.mjs");
const batch = Number(process.env.PORTRAIT_BATCH || 10);

let drawn = 0;
for (let i = 0; i < batch; i++) {
  const run = spawnSync("node", [tick], {
    env: { ...process.env, COMMIT: "0" },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const out = `${run.stdout || ""}${run.stderr || ""}`;
  process.stdout.write(out);
  if (run.status !== 0) {
    console.error("  the run stopped; the rest of the batch is left for the next one.");
    break;
  }
  if (/every kit already has/.test(out)) break;
  if (/saved public\/portraits/.test(out)) drawn++;
}
console.log(`portrait batch: ${drawn} card(s) drawn`);
if (process.env.COMMIT === "1") {
  const { execFileSync } = await import("node:child_process");
  const run = (cmd, args, allowFail = false) => {
    try {
      return execFileSync("git", ["-C", resolve(HERE, ".."), cmd, ...args], { stdio: "pipe", encoding: "utf8" });
    } catch (e) {
      if (allowFail) return null;
      throw e;
    }
  };
  run("config", ["user.name", "yip-lgtm"]);
  run("config", ["user.email", "258986088+yip-lgtm@users.noreply.github.com"]);
  run("add", ["public/portraits", "src/game/catalog.ts", "src/game/arms.ts"]);
  const changed = run("diff", ["--staged", "--name-only"], true);
  if (changed && changed.trim()) {
    run("commit", ["-q", "-m", `portraits: add ${drawn} card(s)`]);
    console.log("committed");
  } else {
    console.log("nothing staged");
  }
  if (process.env.PUSH === "1") {
    run("fetch", ["--quiet", "origin"]);
    const behind = Number(run("rev-list", ["--count", "HEAD..origin/main"]).trim());
    if (behind > 0) {
      console.error(`origin/main moved ${behind} commit(s) -- rebase and re-run`);
      process.exit(2);
    }
    run("push", ["origin", "HEAD:main"]);
    console.log("pushed");
  }
}
