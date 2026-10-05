import { getDef } from "./catalog";
import type { BattleState, Difficulty, Layer, ModuleKey, Side, UnitDef, UnitInst } from "./types";

const KEYS: ModuleKey[] = ["armor", "engine", "ammo", "crew", "gun"];

export function neutralized(u: UnitInst): boolean {
  return u.exploded || u.mod.ammo <= 0 || u.mod.crew <= 0 || u.mod.engine <= 0;
}

export function phaseName(t: number, layers?: Layer[]): string {
  if (t < 12) return layers && !layers.includes("air") ? "接敵" : "航空戰";
  if (t < 24) return "開幕突擊";
  if (t < 52) return "晝戰砲擊";
  return "夜戰追擊";
}

function pushLog(b: BattleState, text: string): BattleState {
  const log = [...b.log, { id: b.seq + 1, text }];
  return { ...b, seq: b.seq + 1, log: log.slice(-16) };
}

function maxMods(def: UnitDef, side: Side, opts: SpawnOpts): Record<ModuleKey, number> {
  const m: Record<ModuleKey, number> = { armor: 70, engine: 56, ammo: 52, crew: 56, gun: 60 };
  if (def.kind === "infantry") {
    m.armor = 28;
    m.engine = 36;
    m.gun = 40;
  }
  if (def.passive === "magazine") m.ammo = 30;
  if (def.kind === "artillery" && def.pen >= 150) {
    m.engine = 24;
    m.gun = 80;
    m.ammo = 40;
  }
  if (side === "player" && opts.purge) m.crew = Math.round(m.crew * 0.8);
  if (side === "player" && opts.fuelCrisis && (def.layer === "air" || def.kind === "tank")) {
    m.engine = Math.round(m.engine * 0.55);
  }
  if (side === "player" && opts.noRubber && def.layer === "air") m.engine = Math.round(m.engine * 0.62);
  if (side === "player" && opts.lowSupply) m.ammo = Math.round(m.ammo * 0.72);
  return m;
}

export type SpawnOpts = {
  difficulty: Difficulty;
  modifiers: string[];
  purge: boolean;
  fuelCrisis: boolean;
  noRubber: boolean;
  lowSupply: boolean;
};

function spawn(ids: string[], side: Side, opts: SpawnOpts): UnitInst[] {
  const out: UnitInst[] = [];
  ids.forEach((id, i) => {
    const def = getDef(id);
    if (!def) return;
    const modMax = maxMods(def, side, opts);
    const roundMul = opts.difficulty === "simulator" ? 0.62 : opts.difficulty === "realistic" ? 0.85 : 1;
    out.push({
      uid: `${side}-${id}-${i}`,
      defId: id,
      side,
      mod: { ...modMax },
      modMax,
      rounds: Math.max(4, Math.round(def.rounds * roundMul)),
      reload: side === "enemy" ? 0.4 + (i % 3) * 0.25 : 0.2,
      skillCd: 0,
      stunned: 0,
      conceal: 0,
      invuln: 0,
      exploded: false,
      tenichi: false,
      nextCrit: false,
      nextMul: 1,
      lastStandNoted: false,
    });
  });
  return out;
}

function applyWolfConceal(units: UnitInst[]): UnitInst[] {
  const sides: Side[] = ["player", "enemy"];
  let next = units;
  for (const side of sides) {
    const subs = next.filter((u) => getDef(u.defId)?.kind === "submarine" && u.side === side);
    if (!subs.length) continue;
    const bonus = subs.length >= 2 ? 9 : 4;
    next = next.map((u) =>
      u.side === side && getDef(u.defId)?.kind === "submarine" ? { ...u, conceal: bonus } : u,
    );
  }
  return next;
}

export function createBattle(
  nodeId: string,
  playerIds: string[],
  enemyIds: string[],
  layers: Layer[],
  opts: SpawnOpts,
): BattleState {
  const units = applyWolfConceal([...spawn(playerIds, "player", opts), ...spawn(enemyIds, "enemy", opts)]);
  const arcade = opts.difficulty === "arcade";
  return {
    nodeId,
    difficulty: opts.difficulty,
    t: 0,
    energy: arcade ? 5 : opts.difficulty === "realistic" ? 4 : 3,
    maxEnergy: 8,
    units,
    log: [{ id: 1, text: "交戰開始。沒有血條：彈藥庫、動力、乘員才算癱瘓。" }],
    seq: 1,
    over: null,
    focusUid: null,
    shooterUid: units.find((u) => u.side === "player")?.uid ?? null,
    priority: "ammo",
    modifiers: opts.modifiers,
    layers,
    cross: layers.includes("sea") && layers.includes("land"),
    buffTcross: 0,
    buffEscort: 0,
    strikeCd: 8,
    pulse: 0,
    lead: 0,
  };
}

export function airPower(units: UnitInst[], side: Side): number {
  return units
    .filter((u) => u.side === side && !neutralized(u) && getDef(u.defId)?.layer === "air")
    .reduce((s, u) => s + u.mod.gun + u.mod.crew, 0);
}

export function airBanner(b: BattleState): string {
  if (!b.layers.includes("air")) return "此戰區沒有空中層。";
  const p = airPower(b.units, "player");
  const e = airPower(b.units, "enemy");
  if (p > e * 1.12 && p > 0) return "制空權在我方。表面單位命中提高。";
  if (e > p * 1.12 && e > 0) return "敵方握有制空權。注意空襲。";
  return "空中均勢。";
}

function canEngage(att: UnitDef, defLayer: Layer, b: BattleState): boolean {
  if (att.layer === "sea" && defLayer === "land") return b.cross && att.targets.includes("land");
  if (att.layer === "land" && defLayer === "sea") return false;
  if (att.layer === "air" && defLayer !== "air" && !b.layers.includes(defLayer)) return false;
  return att.targets.includes(defLayer);
}

function aliveTargets(b: BattleState, att: UnitInst): UnitInst[] {
  const def = getDef(att.defId);
  if (!def) return [];
  return b.units.filter((u) => u.side !== att.side && !neutralized(u) && canEngage(def, getDef(u.defId)?.layer ?? "land", b));
}

function pickTarget(b: BattleState, att: UnitInst): UnitInst | undefined {
  const list = aliveTargets(b, att);
  if (!list.length) return;
  if (att.side === "player" && b.focusUid) {
    const focused = list.find((u) => u.uid === b.focusUid);
    if (focused) return focused;
  }
  if (att.side === "enemy") {
    return [...list].sort((a, c) => a.mod.ammo / a.modMax.ammo - c.mod.ammo / c.modMax.ammo)[0];
  }
  return list[0];
}

function pickModule(b: BattleState, att: UnitInst, target: UnitInst): ModuleKey {
  if (att.side === "player") {
    if (target.mod[b.priority] > 0) return b.priority;
  } else {
    const attDef = getDef(att.defId);
    const def = getDef(target.defId);
    if (attDef && def && attDef.pen > def.armor * 0.65 && target.mod.ammo > 0) return "ammo";
    if (target.mod.engine > 0) return "engine";
  }
  for (const k of ["ammo", "engine", "crew", "gun", "armor"] as ModuleKey[]) {
    if (target.mod[k] > 0) return k;
  }
  return "crew";
}

function ignoresNight(def: UnitDef, side: Side, mods: string[]): boolean {
  if (def.nation === "uk") return true;
  if (side === "player" && mods.includes("radar")) return true;
  return false;
}

function strike(b: BattleState, att: UnitInst, target: UnitInst, module: ModuleKey, forceHit: boolean | null): BattleState {
  const attDef = getDef(att.defId);
  const def = getDef(target.defId);
  if (!attDef || !def) return b;
  if (att.rounds <= 0 || neutralized(att) || att.mod.gun <= 0) return b;

  let next = {
    ...b,
    units: b.units.map((u) =>
      u.uid === att.uid ? { ...u, rounds: u.rounds - 1, reload: attDef.rof, conceal: 0 } : u,
    ),
  };
  const attNow = next.units.find((u) => u.uid === att.uid)!;

  if (target.invuln > 0) {
    return pushLog(next, `${attDef.name} 的射擊被避開。`);
  }

  const phase = next.t < 12 ? "air" : next.t < 24 ? "torp" : next.t < 52 ? "gun" : "night";
  let hit = next.difficulty === "arcade" ? 0.58 : next.difficulty === "realistic" ? 0.46 : 0.42;
  const pAir = airPower(next.units, "player");
  const eAir = airPower(next.units, "enemy");
  if (next.layers.includes("air")) {
    if (att.side === "player" && pAir > eAir * 1.12 && attDef.layer !== "air") hit *= 1.3;
    if (att.side === "enemy" && eAir > pAir * 1.12 && attDef.layer !== "air") hit *= 1.3;
  }
  if (target.conceal > 0) hit *= 0.52;
  hit *= 0.55 + 0.45 * (attNow.mod.crew / attNow.modMax.crew);
  if (phase === "night" && !ignoresNight(attDef, att.side, next.modifiers)) hit *= 0.82;
  if (next.buffTcross > 0 && att.side === "player" && attDef.layer === "sea") hit *= 1.12;

  const landed = forceHit === null ? Math.random() < hit : forceHit;
  if (!landed) return pushLog(next, `${attDef.name} 未命中 ${def.name}。`);

  let dmg = 7 + attDef.pen / 22;
  if (phase === "gun" && attDef.kind === "battleship") dmg *= 1.26;
  if (phase === "torp" && (attDef.kind === "submarine" || attDef.kind === "destroyer")) dmg *= 1.38;
  if (phase === "air" && attDef.layer === "air") dmg *= 1.12;
  if (att.side === "player" && next.modifiers.includes("blitz") && attDef.layer === "land") dmg *= 1.12;
  if (att.side === "player" && next.modifiers.includes("deep") && attDef.layer === "land") dmg *= 1.1;
  if (att.side === "player" && next.modifiers.includes("fighter") && attDef.layer === "air") dmg *= 1.12;
  if (att.side === "player" && next.modifiers.includes("mare") && attDef.layer === "sea") dmg *= 1.12;
  if (att.side === "player" && next.modifiers.includes("rivalry") && (attDef.layer === "air" || attDef.layer === "sea")) dmg *= 0.88;
  if (attDef.passive === "flak" && def.layer === "air") dmg *= 1.22;
  if (attDef.layer !== def.layer) dmg *= attDef.kind === "battleship" ? 0.78 : 0.58;
  if (attNow.nextMul > 1) dmg *= attNow.nextMul;

  const avg = KEYS.reduce((s, k) => s + attNow.mod[k] / attNow.modMax[k], 0) / KEYS.length;
  if (attDef.passive === "last_stand" && avg < 0.28) {
    dmg *= 1.7;
    if (!attNow.lastStandNoted) {
      next = pushLog(next, `${attDef.name} 動力殘餘，火力仍在。`);
      next = {
        ...next,
        units: next.units.map((u) => (u.uid === att.uid ? { ...u, lastStandNoted: true } : u)),
      };
    }
  }
  if (attNow.tenichi) dmg *= 1.85;
  if (attNow.nextCrit && def.nation === "uk" && (def.kind === "battleship" || def.kind === "cruiser")) {
    dmg *= 1.8;
    if (module !== "ammo") module = "ammo";
  }

  const subs = next.units.filter(
    (u) => u.side === att.side && getDef(u.defId)?.kind === "submarine" && !neutralized(u),
  ).length;
  if (attDef.kind === "submarine" && subs >= 2) dmg *= 1.3;

  const armorRatio = target.mod.armor / target.modMax.armor;
  const penFactor = attDef.pen / (attDef.pen + def.armor);
  let mit = armorRatio * (1 - penFactor);
  if (module === "armor") mit *= 0.25;
  dmg = Math.max(5, dmg * (1 - mit * 0.62));

  const units = next.units.map((u) => {
    if (u.uid === att.uid) return { ...u, nextMul: 1, nextCrit: false };
    if (u.uid !== target.uid) return u;
    const mod = { ...u.mod, [module]: Math.max(0, u.mod[module] - dmg) };
    return { ...u, mod };
  });
  next = { ...next, units };

  const hitU = next.units.find((u) => u.uid === target.uid)!;
  const label = def.name;
  next = pushLog(next, `${attDef.name} 命中 ${label} · ${module === "ammo" ? "彈藥" : module === "engine" ? "動力" : module === "crew" ? "乘員" : module === "gun" ? "火力" : "裝甲"}。`);

  if (hitU.mod.ammo <= 0 && !hitU.exploded) {
    next = {
      ...next,
      pulse: next.pulse + 1,
      units: next.units.map((u) =>
        u.uid === target.uid ? { ...u, exploded: true, mod: { armor: 0, engine: 0, ammo: 0, crew: 0, gun: 0 } } : u,
      ),
    };
    next = pushLog(next, `${label} 彈藥殉爆。`);
  } else if (hitU.mod.engine <= 0) {
    next = pushLog(next, `${label} 動力失效，退出戰鬥。`);
  } else if (hitU.mod.crew <= 0) {
    next = pushLog(next, `${label} 乘員喪失戰鬥力。`);
  }

  const bearer = next.units.find((u) => u.uid === att.uid)!;
  const bearerDef = getDef(bearer.defId);
  if (bearerDef?.passive === "tenichi" && !bearer.tenichi) {
    const a = KEYS.reduce((s, k) => s + bearer.mod[k] / bearer.modMax[k], 0) / KEYS.length;
    if (a < 0.34) {
      next = {
        ...next,
        units: next.units.map((u) => (u.uid === bearer.uid ? { ...u, tenichi: true } : u)),
      };
      next = pushLog(next, `${bearerDef.name} 進入不顧後勤的齊射。`);
    }
  }
  return checkEnd(next);
}

function crystallize(b: BattleState): BattleState {
  let next = b;
  for (const u of b.units) {
    const cur = next.units.find((x) => x.uid === u.uid);
    if (!cur || cur.exploded || cur.mod.ammo > 0) continue;
    next = {
      ...next,
      pulse: next.pulse + 1,
      units: next.units.map((x) =>
        x.uid === cur.uid ? { ...x, exploded: true, mod: { armor: 0, engine: 0, ammo: 0, crew: 0, gun: 0 } } : x,
      ),
    };
    next = pushLog(next, `${getDef(cur.defId)?.name ?? "單位"} 彈藥殉爆。`);
  }
  return checkEnd(next);
}

function checkEnd(b: BattleState): BattleState {
  if (b.over) return b;
  const enemies = b.units.filter((u) => u.side === "enemy");
  const players = b.units.filter((u) => u.side === "player");
  if (enemies.length && enemies.every(neutralized)) return pushLog({ ...b, over: "win" }, "敵方戰鬥單位全部癱瘓。");
  if (players.length && players.every(neutralized)) return pushLog({ ...b, over: "lose" }, "我方已無法繼續作戰。");
  return b;
}

function canFire(u: UnitInst): boolean {
  return !neutralized(u) && u.mod.gun > 0 && u.rounds > 0 && u.stunned <= 0 && u.reload <= 0;
}

export function step(b: BattleState, dt: number): BattleState {
  if (b.over) return b;
  let next: BattleState = {
    ...b,
    t: b.t + dt,
    energy: Math.min(b.maxEnergy, b.energy + dt * (b.difficulty === "arcade" ? 0.46 : b.difficulty === "realistic" ? 0.28 : 0.2)),
    buffTcross: Math.max(0, b.buffTcross - dt),
    buffEscort: Math.max(0, b.buffEscort - dt),
    strikeCd: b.strikeCd - dt,
    units: b.units.map((u) => ({
      ...u,
      reload: Math.max(0, u.reload - dt * (b.buffEscort > 0 && u.side === "player" && getDef(u.defId)?.layer === "air" ? 1.45 : 1)),
      skillCd: Math.max(0, u.skillCd - dt),
      stunned: Math.max(0, u.stunned - dt),
      conceal: Math.max(0, u.conceal - dt),
      invuln: Math.max(0, u.invuln - dt),
    })),
  };

  if (next.layers.includes("air") && next.strikeCd <= 0) {
    const pAir = airPower(next.units, "player");
    const eAir = airPower(next.units, "enemy");
    next = { ...next, strikeCd: 9 };
    if (eAir > pAir * 1.12 && pAir <= 0) {
      const victims = next.units.filter((u) => u.side === "player" && !neutralized(u) && getDef(u.defId)?.layer !== "air");
      const v = victims[Math.floor(Math.random() * victims.length)];
      if (v) {
        next = {
          ...next,
          units: next.units.map((u) =>
            u.uid === v.uid ? { ...u, mod: { ...u.mod, ammo: Math.max(0, u.mod.ammo - 10), engine: Math.max(0, u.mod.engine - 6) } } : u,
          ),
        };
        next = pushLog(next, `敵方空襲命中 ${getDef(v.defId)?.name ?? "單位"}。`);
        next = checkEnd(next);
      }
    }
  }

  if (next.over) return next;
  for (const u of next.units) {
    if (next.over) break;
    if (next.difficulty === "simulator" && u.side === "player") continue;
    if (!canFire(u)) continue;
    const current = next.units.find((x) => x.uid === u.uid);
    if (!current || !canFire(current)) continue;
    const target = pickTarget(next, current);
    if (!target) continue;
    const module = pickModule(next, current, target);
    next = strike(next, current, target, module, null);
  }
  return crystallize(next);
}

export function advance(b: BattleState, seconds: number): BattleState {
  let s = b;
  let left = seconds;
  while (left > 0.001 && !s.over) {
    const d = Math.min(0.1, left);
    s = step(s, d);
    left -= d;
  }
  return s;
}

export function castSkill(b: BattleState, uid: string): { battle: BattleState; ok: boolean } {
  if (b.over) return { battle: b, ok: false };
  const u = b.units.find((x) => x.uid === uid && x.side === "player" && !neutralized(x));
  const def = u ? getDef(u.defId) : undefined;
  if (!u || !def) return { battle: pushLog(b, "無法施放。"), ok: false };
  if (u.skillCd > 0) return { battle: pushLog(b, "技能尚未準備。"), ok: false };
  if (b.energy < def.skill.energy) return { battle: pushLog(b, "能量不足。"), ok: false };

  let next: BattleState = {
    ...b,
    energy: b.energy - def.skill.energy,
    units: b.units.map((x) => (x.uid === uid ? { ...x, skillCd: 14 } : x)),
  };
  const id = def.skill.id;
  const focus = next.units.find((x) => x.uid === next.focusUid && x.side === "enemy" && !neutralized(x));

  if (id === "salvo") {
    next = {
      ...next,
      units: next.units.map((x) => (x.uid === uid ? { ...x, nextMul: 1.55, reload: Math.min(x.reload, 0.3) } : x)),
    };
    next = pushLog(next, `${def.name} 校準了下一發。`);
  } else if (id === "smoke") {
    next = {
      ...next,
      units: next.units.map((x) =>
        x.side === "player" && getDef(x.defId)?.layer !== "air" ? { ...x, conceal: Math.max(x.conceal, 6) } : x,
      ),
    };
    next = pushLog(next, "煙幕展開，水面與地面單位難以被鎖定。");
  } else if (id === "tcross") {
    next = { ...next, buffTcross: 8 };
    next = pushLog(next, "搶到射擊優勢。海上火力上升。");
  } else if (id === "sweep") {
    next = {
      ...next,
      units: next.units.map((x) =>
        x.side === "enemy" && getDef(x.defId)?.layer === "air" ? { ...x, stunned: Math.max(x.stunned, 3.2) } : x,
      ),
    };
    next = pushLog(next, "敵方飛行單位被壓制。");
  } else if (id === "shore") {
    next = {
      ...next,
      units: next.units.map((x) => {
        if (x.side !== "enemy" || getDef(x.defId)?.layer !== "land") return x;
        return { ...x, mod: { ...x.mod, armor: Math.max(0, x.mod.armor - 16), engine: Math.max(0, x.mod.engine - 8) } };
      }),
    };
    next = pushLog(next, "艦砲跨越海岸，打在岸上裝甲與動力上。");
  } else if (id === "dive") {
    if (!focus || getDef(focus.defId)?.layer === "air") return { battle: pushLog(b, "俯衝需要一個水面或地面目標。"), ok: false };
    next = {
      ...next,
      units: next.units.map((x) => (x.uid === focus.uid ? { ...x, mod: { ...x.mod, ammo: Math.max(0, x.mod.ammo - 20) } } : x)),
    };
    next = pushLog(next, `${def.name} 俯衝打擊 ${getDef(focus.defId)?.name} 的彈藥。`);
  } else if (id === "blitz") {
    next = {
      ...next,
      units: next.units.map((x) =>
        x.side === "enemy" && getDef(x.defId)?.layer === "land" ? { ...x, stunned: Math.max(x.stunned, 3.4) } : x,
      ),
    };
    next = pushLog(next, "陸地單位被震懾，短暫停火。");
  } else if (id === "barrage") {
    next = {
      ...next,
      units: next.units.map((x) => {
        if (x.side !== "enemy" || getDef(x.defId)?.layer !== "land") return x;
        const keys: ModuleKey[] = ["ammo", "engine", "crew", "gun"];
        const k = keys[Math.floor(Math.random() * keys.length)]!;
        return { ...x, mod: { ...x.mod, [k]: Math.max(0, x.mod[k] - 14) } };
      }),
    };
    next = pushLog(next, "火箭／砲兵覆蓋了敵方陸地單位。");
  } else if (id === "siege") {
    if (!focus) return { battle: pushLog(b, "要塞砲需要一個目標。"), ok: false };
    next = {
      ...next,
      units: next.units.map((x) =>
        x.uid === focus.uid
          ? { ...x, mod: { ...x.mod, armor: Math.max(0, x.mod.armor - 34), gun: Math.max(0, x.mod.gun - 26) } }
          : x.uid === uid
            ? { ...x, reload: Math.max(x.reload, 5) }
            : x,
      ),
    };
    next = pushLog(next, `${def.name} 完成長時間裝填，重擊 ${getDef(focus.defId)?.name}。`);
  } else if (id === "escort") {
    next = { ...next, buffEscort: 8 };
    next = pushLog(next, "護航編隊加快了我方空中單位的再裝填。");
  } else if (id === "lucky") {
    const inv = Math.random() < 0.4;
    next = {
      ...next,
      units: next.units.map((x) => (x.uid === uid && inv ? { ...x, invuln: 5 } : x)),
    };
    if (focus) {
      next = {
        ...next,
        units: next.units.map((x) =>
          x.uid === focus.uid ? { ...x, mod: { ...x.mod, ammo: Math.max(0, x.mod.ammo - 16) } } : x,
        ),
      };
    }
    next = pushLog(next, inv ? `${def.name} 撐過這一輪攻擊窗口。` : `${def.name} 放出攻擊波。`);
  } else if (id === "hoodshot") {
    next = { ...next, units: next.units.map((x) => (x.uid === uid ? { ...x, nextCrit: true } : x)) };
    next = pushLog(next, `${def.name} 把下一發對準藥庫。`);
  } else if (id === "repair") {
    next = {
      ...next,
      units: next.units.map((x) =>
        x.uid === uid
          ? {
              ...x,
              mod: {
                ...x.mod,
                engine: Math.min(x.modMax.engine, x.mod.engine + 16),
                crew: Math.min(x.modMax.crew, x.mod.crew + 10),
              },
            }
          : x,
      ),
    };
    next = pushLog(next, `${def.name} 搶修了動力與乘員。`);
  }

  next = crystallize(next);
  return { battle: next, ok: true };
}

export function manualFire(b: BattleState, lead: number): { battle: BattleState; ok: boolean } {
  if (b.over) return { battle: b, ok: false };
  const target = b.units.find((u) => u.uid === b.focusUid && u.side === "enemy" && !neutralized(u));
  if (!target) return { battle: pushLog(b, "先點選一個尚未癱瘓的目標。"), ok: false };
  const shooter =
    b.units.find((u) => u.uid === b.shooterUid && u.side === "player" && canFire(u) && aliveTargets(b, u).some((t) => t.uid === target.uid)) ??
    b.units.find((u) => u.side === "player" && canFire(u) && aliveTargets(b, u).some((t) => t.uid === target.uid));
  if (!shooter) return { battle: pushLog(b, "沒有能開火的單位。檢查砲、彈藥與是否被煙幕／暈眩。"), ok: false };
  const def = getDef(target.defId);
  const correct = def?.speed === "fast" ? 2 : 0;
  const hit = lead === correct;
  const module = b.priority;
  const battle = strike(b, shooter, target, module, hit);
  return { battle, ok: true };
}

export function correctLead(defId: string): number {
  return getDef(defId)?.speed === "fast" ? 2 : 0;
}
