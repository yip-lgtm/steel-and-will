import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { advance, castSkill, correctLead, createBattle, manualFire } from "./battle";
import {
  ARCHIVES,
  buyCost,
  canFight,
  FOCUSES,
  getDef,
  getNode,
  isPrologue,
  NATIONS,
  QUIZ,
  setExtraUnits,
  STARTS,
  STORY,
  serviceThisYear,
  archiveToUnit,
} from "./catalog";
import type { BattleState, Difficulty, ModuleKey, NationId, Screen, UnitDef } from "./types";

export const SAVE_KEY = "steel-will";

export type LastResult = {
  nodeId: string;
  name: string;
  win: boolean;
  reward: { steel: number; eq: number; pp: number; oil: number } | null;
  bulletin: string;
  lines: string[];
  quiz: number;
  picked: number | null;
};

export type GameData = {
  version: number;
  screen: Screen;
  difficulty: Difficulty;
  muted: boolean;
  nation: NationId | null;
  story: number;
  y: number;
  m: number;
  civ: number;
  mil: number;
  steel: number;
  oil: number;
  rubber: number;
  alu: number;
  mp: number;
  pp: number;
  supply: number;
  eq: number;
  modifiers: string[];
  focuses: string[];
  focusId: string | null;
  focusLeft: number;
  owned: string[];
  template: string[];
  won: string[];
  archiveSeen: string[];
  extras: UnitDef[];
  chronicle: string[];
  autoResearch: boolean;
  aiCount: number;
  lastAiAt: number;
  lastResult: LastResult | null;
  toast: string | null;
  battle: BattleState | null;
  lectureClaimed: boolean;
};

type Actions = {
  setScreen: (screen: Screen) => void;
  setDifficulty: (d: Difficulty) => void;
  toggleMute: () => void;
  setAutoResearch: (on: boolean) => void;
  clearToast: () => void;
  beginStory: () => void;
  nextStory: () => void;
  chooseNation: (id: NationId) => void;
  abandon: () => void;
  convert: (toMil: boolean) => void;
  trade: (what: "oil" | "rubber") => void;
  advanceMonth: () => void;
  startFocus: (id: string) => void;
  adjustTemplate: (id: string, delta: number) => void;
  buy: (id: string) => void;
  revealArchive: () => void;
  acceptAi: (unit: UnitDef) => void;
  markAi: () => void;
  startBattle: (id: string) => void;
  setFocusTarget: (uid: string) => void;
  setShooter: (uid: string) => void;
  setPriority: (k: ModuleKey) => void;
  setLead: (n: number) => void;
  tickBattle: (seconds: number) => void;
  useSkill: (uid: string) => void;
  fireManual: () => void;
  shoot: (uid: string) => void;
  settle: () => void;
  pickQuiz: (i: number) => void;
  setBulletin: (text: string) => void;
  claimLecture: () => void;
  importData: (data: Partial<GameData>) => void;
};

const empty = (): GameData => ({
  version: 1,
  screen: "title",
  difficulty: "arcade",
  muted: false,
  nation: null,
  story: 0,
  y: 1914,
  m: 6,
  civ: 0,
  mil: 0,
  steel: 0,
  oil: 0,
  rubber: 0,
  alu: 0,
  mp: 0,
  pp: 0,
  supply: 0,
  eq: 0,
  modifiers: [],
  focuses: [],
  focusId: null,
  focusLeft: 0,
  owned: [],
  template: [],
  won: [],
  archiveSeen: [],
  extras: [],
  chronicle: [],
  autoResearch: false,
  aiCount: 0,
  lastAiAt: 0,
  lastResult: null,
  toast: null,
  battle: null,
  lectureClaimed: false,
});

function sync(extras: UnitDef[]) {
  setExtraUnits(extras);
}

function monthName(y: number, m: number) {
  return `${y}年${m}月`;
}

function finishFocus(s: GameData, id: string): GameData {
  const modifiers = [...s.modifiers];
  const drop = (m: string) => {
    const i = modifiers.indexOf(m);
    if (i >= 0) modifiers.splice(i, 1);
  };
  const add = (m: string) => {
    if (!modifiers.includes(m)) modifiers.push(m);
  };
  let { civ, mil, mp, pp, supply, eq, oil, rubber, steel } = s;
  switch (id) {
    case "de-rhein":
      pp += 15;
      supply += 5;
      break;
    case "de-anschluss":
      civ += 1;
      mp += 6;
      break;
    case "de-synth":
      add("synth");
      break;
    case "de-blitz":
      add("blitz");
      break;
    case "de-oppose":
      civ = Math.max(1, civ - 2);
      mp = Math.max(0, mp - 8);
      add("kaiser-path");
      break;
    case "de-kaiser":
      add("kaiser");
      civ += 1;
      break;
    case "us-deal":
      civ += 1;
      supply += 8;
      break;
    case "us-ocean":
      eq += 10;
      break;
    case "us-war":
      drop("isolation");
      break;
    case "us-red":
      drop("isolation");
      add("red");
      civ = Math.max(1, civ - 3);
      mp += 20;
      break;
    case "su-reform":
      drop("purge");
      break;
    case "su-deep":
      add("deep");
      break;
    case "su-ural":
      mil += 1;
      break;
    case "uk-chain":
      supply += 6;
      pp += 6;
      break;
    case "uk-fc":
      add("fighter");
      break;
    case "jp-south":
      oil += 6;
      rubber += 4;
      add("southern");
      break;
    case "jp-north":
      pp += 8;
      add("north");
      break;
    case "jp-unify":
      drop("rivalry");
      break;
    case "cn-front":
      supply += 18;
      break;
    case "cn-aid":
      eq += 8;
      break;
    case "fr-line":
      supply += 12;
      eq += 4;
      break;
    case "it-sea":
      add("mare");
      break;
    case "it-oil":
      add("ration");
      break;
    case "se-ore":
      steel += 10;
      break;
    case "se-arm":
      supply += 8;
      break;
    case "il-surplus":
      eq += 6;
      break;
    case "il-field":
      add("fighter");
      break;
    default:
      break;
  }
  return {
    ...s,
    modifiers,
    civ,
    mil,
    mp,
    pp,
    supply,
    eq,
    oil,
    rubber,
    steel,
    focuses: s.focuses.includes(id) ? s.focuses : [...s.focuses, id],
    focusId: null,
    focusLeft: 0,
  };
}

export function projectMonth(s: GameData): string[] {
  const thirsty = s.template.filter((id) => {
    const d = getDef(id);
    return d && (d.layer === "air" || d.kind === "tank");
  }).length;
  const airs = s.template.filter((id) => getDef(id)?.layer === "air").length;
  const oilIn = Math.floor(s.civ / 5) + (s.modifiers.includes("synth") ? 2 : 0) + (s.modifiers.includes("ration") ? 1 : 0);
  const lines = [
    `鋼 +${s.civ * 2 + (s.nation === "se" ? 1 : 0)}`,
    `裝備 +${s.mil * 3}`,
    `油 ${oilIn - thirsty >= 0 ? "+" : ""}${oilIn - thirsty}（編制 thirsty ${thirsty}）`.replace("thirsty", "耗油單位"),
  ];
  if (airs > 0) lines.push("橡膠 −1（有飛機在編）");
  if (s.focusId) lines.push(s.focusLeft <= 1 ? "本月完成國家專注" : `專注剩餘 ${s.focusLeft - 1} 個月`);
  if (s.m === 12) {
    const born = serviceThisYear(s.y + 1);
    if (born.length) {
      const names = born
        .slice(0, 5)
        .map((u) => u.name)
        .join("、");
      lines.push(`跨年入役：${names}${born.length > 5 ? "…" : ""}`);
    }
  }
  if (s.autoResearch) lines.push("本月推進後，檔案室會考證一件貼近年份的實史裝備。");
  return lines;
}

export const useGame = create<GameData & Actions>()(
  persist(
    (set, get) => ({
      ...empty(),
      setScreen: (screen) => set({ screen, toast: null }),
      setDifficulty: (difficulty) => set({ difficulty }),
      toggleMute: () => set((s) => ({ muted: !s.muted })),
      setAutoResearch: (autoResearch) => set({ autoResearch }),
      clearToast: () => set({ toast: null }),
      beginStory: () => set({ screen: "story", story: 0 }),
      nextStory: () => {
        const s = get();
        if (s.story < STORY.length - 1) {
          set({ story: s.story + 1 });
          return;
        }
        sync(s.extras);
        const battle = createBattle("marne", ["soixante", "lebel", "smle"], ["mg08", "g98", "fk96"], ["land"], {
          difficulty: s.difficulty,
          modifiers: [],
          purge: false,
          fuelCrisis: false,
          noRubber: false,
          lowSupply: false,
        });
        set({ screen: "battle", battle, toast: null });
      },
      chooseNation: (id) => {
        const { units, ...pack } = STARTS[id];
        const base = empty();
        const prev = get();
        set({
          ...base,
          difficulty: prev.difficulty,
          muted: prev.muted,
          lectureClaimed: prev.lectureClaimed,
          autoResearch: prev.autoResearch,
          story: 5,
          won: prev.won.filter((id) => isPrologue(id)),
          screen: "hq",
          nation: id,
          ...pack,
          owned: [...units],
          template: units.slice(0, 4),
          modifiers: [...pack.modifiers],
          extras: [],
        });
        sync([]);
      },
      abandon: () => {
        const prev = get();
        set({ ...empty(), difficulty: prev.difficulty, muted: prev.muted });
        sync([]);
      },
      convert: (toMil) =>
        set((s) => {
          if (toMil && s.civ <= 1) return { toast: "至少留下一座民用工廠。" };
          if (!toMil && s.mil <= 0) return { toast: "沒有可轉回的軍用工廠。" };
          return toMil
            ? { civ: s.civ - 1, mil: s.mil + 1, steel: Math.max(0, s.steel - 2), toast: null }
            : { civ: s.civ + 1, mil: s.mil - 1, toast: null };
        }),
      trade: (what) =>
        set((s) => {
          if (s.civ < 1) return { toast: "沒有民用產能可做貿易。" };
          if (s.steel < 4) return { toast: "貿易需要 4 鋼。" };
          if (what === "oil") return { steel: s.steel - 4, oil: s.oil + 3, toast: null };
          return { steel: s.steel - 4, rubber: s.rubber + 2, toast: null };
        }),
      advanceMonth: () =>
        set((s) => {
          if (!s.nation) return s;
          sync(s.extras);
          let next: GameData = { ...s, toast: null };
          const thirsty = next.template.filter((id) => {
            const d = getDef(id);
            return d && (d.layer === "air" || d.kind === "tank");
          }).length;
          const airs = next.template.filter((id) => getDef(id)?.layer === "air").length;
          next.oil = Math.max(
            0,
            next.oil +
              Math.floor(next.civ / 5) +
              (next.modifiers.includes("synth") ? 2 : 0) +
              (next.modifiers.includes("ration") ? 1 : 0) -
              thirsty,
          );
          next.rubber = Math.max(0, next.rubber + (next.nation === "jp" ? 1 : 0) + Math.floor(next.civ / 8) - (airs > 0 ? 1 : 0));
          next.steel += next.civ * 2 + (next.nation === "se" ? 1 : 0);
          next.alu += Math.max(1, Math.floor(next.civ / 6));
          next.eq += next.mil * 3;
          next.pp += 2;
          next.mp += next.modifiers.includes("red") ? 4 : 2;
          next.supply = Math.max(20, Math.min(100, next.supply + Math.floor(next.civ / 3) - 1));
          if (next.focusId) {
            next.focusLeft -= 1;
            if (next.focusLeft <= 0) next = finishFocus(next, next.focusId);
          }
          next.m += 1;
          if (next.m > 12) {
            next.m = 1;
            next.y += 1;
            const born = serviceThisYear(next.y);
            if (born.length) {
              const line = `${next.y} 年入役：${born
                .slice(0, 6)
                .map((u) => u.name)
                .join("、")}${born.length > 6 ? "…" : ""}`;
              next.chronicle = [line, ...(next.chronicle ?? [])].slice(0, 8);
              next.toast = line;
            }
          }
          return next;
        }),
      startFocus: (id) =>
        set((s) => {
          const def = FOCUSES.find((f) => f.id === id);
          if (!def || def.nation !== s.nation) return { toast: "這不是你的路線。" };
          if (s.focuses.includes(id) || s.focusId === id) return { toast: "已經做過或正在做。" };
          if (def.req.some((r) => !s.focuses.includes(r))) return { toast: "前置專注未完成。" };
          if (def.exclusive?.some((r) => s.focuses.includes(r))) return { toast: "與已選路線互斥。" };
          if (s.focusId) return { toast: "先把進行中的專注做完。" };
          return { focusId: id, focusLeft: def.cost, toast: null };
        }),
      adjustTemplate: (id, delta) =>
        set((s) => {
          if (!s.owned.includes(id)) return { toast: "尚未列裝。" };
          const count = s.template.filter((x) => x === id).length;
          if (delta > 0) {
            if (count >= 2) return { toast: "同一鋼印最多兩件。" };
            if (s.template.length >= 6) return { toast: "編制已滿六個位置。" };
            return { template: [...s.template, id], toast: null };
          }
          const idx = s.template.lastIndexOf(id);
          if (idx < 0) return s;
          return { template: s.template.filter((_, i) => i !== idx), toast: null };
        }),
      buy: (id) =>
        set((s) => {
          sync(s.extras);
          const def = getDef(id);
          if (!def) return { toast: "沒有這份檔案。" };
          if (s.owned.includes(id)) return { toast: "已經列裝。" };
          const cost = buyCost(def, s.y);
          if (s.eq < cost) return { toast: `裝備存量不足（需要 ${cost}）。` };
          const template = s.template.length < 6 ? [...s.template, id] : s.template;
          return { eq: s.eq - cost, owned: [...s.owned, id], template, toast: def.year > s.y + 1 ? "已列裝。年代超前，這是圖紙提前。" : null };
        }),
      revealArchive: () =>
        set((s) => {
          if (s.eq < 4) return { toast: "開館需要 4 點裝備存量。" };
          const seed = ARCHIVES.find((a) => !s.archiveSeen.includes(a.id));
          if (!seed) return { toast: "館藏已全部揭開。可向檔案室即時考證新的實史裝備。" };
          const unit = archiveToUnit(seed);
          const extras = [...s.extras.filter((u) => u.id !== unit.id), unit];
          sync(extras);
          const owned = s.owned.includes(unit.id) ? s.owned : [...s.owned, unit.id];
          return {
            eq: s.eq - 4,
            extras,
            owned,
            archiveSeen: [...s.archiveSeen, seed.id],
            toast: `入館：${unit.name}（${unit.designation}）`,
          };
        }),
      acceptAi: (unit) =>
        set((s) => {
          if (s.extras.some((u) => u.name === unit.name) || s.owned.includes(unit.id)) {
            return { toast: "名稱已在庫中。" };
          }
          const extras = [...s.extras, unit];
          sync(extras);
          return {
            extras,
            aiCount: s.aiCount + 1,
            lastAiAt: Date.now(),
            toast: `考證完成：${unit.name}。到編制用裝備存量列裝。`,
          };
        }),
      markAi: () => set({ lastAiAt: Date.now() }),
      startBattle: (id) => {
        const s = get();
        sync(s.extras);
        const node = getNode(id);
        if (!node) return;
        const playerIds = node.fixedPlayer?.length ? node.fixedPlayer : node.allies;
        const enemyIds = node.fixedEnemy?.length ? node.fixedEnemy : node.axis;
        let oil = s.oil;
        if (playerIds.includes("yamato")) oil = Math.max(0, oil - 3);
        const battle = createBattle(node.id, playerIds, enemyIds, node.layers, {
          difficulty: s.difficulty,
          modifiers: s.modifiers,
          purge: s.modifiers.includes("purge"),
          fuelCrisis: oil <= 0,
          noRubber: s.rubber <= 0,
          lowSupply: s.supply < 40,
        });
        set({ oil, battle, screen: "battle", toast: null });
      },
      setFocusTarget: (uid) => set((s) => (s.battle ? { battle: { ...s.battle, focusUid: uid } } : s)),
      setShooter: (uid) => set((s) => (s.battle ? { battle: { ...s.battle, shooterUid: uid } } : s)),
      setPriority: (priority) => set((s) => (s.battle ? { battle: { ...s.battle, priority } } : s)),
      setLead: (lead) => set((s) => (s.battle ? { battle: { ...s.battle, lead } } : s)),
      tickBattle: (seconds) =>
        set((s) => {
          if (!s.battle || s.battle.over) return s;
          sync(s.extras);
          return { battle: advance(s.battle, seconds) };
        }),
      useSkill: (uid) =>
        set((s) => {
          if (!s.battle) return s;
          sync(s.extras);
          const cast = castSkill(s.battle, uid);
          if (!cast.ok) return { battle: cast.battle };
          return { battle: advance(cast.battle, 1.2) };
        }),
      fireManual: () =>
        set((s) => {
          if (!s.battle) return s;
          sync(s.extras);
          const shot = manualFire(s.battle, s.battle.lead);
          if (!shot.ok) return { battle: shot.battle };
          return { battle: advance(shot.battle, 1.2) };
        }),
      shoot: (uid: string) =>
        set((s) => {
          if (!s.battle || s.battle.over) return s;
          sync(s.extras);
          const target = s.battle.units.find((u) => u.uid === uid);
          const defId = target?.defId ?? "";
          const lead = s.battle.difficulty === "simulator" ? s.battle.lead : correctLead(defId);
          const shot = manualFire({ ...s.battle, focusUid: uid }, lead);
          return { battle: advance(shot.battle, 0.6), toast: null };
        }),
      settle: () =>
        set((s) => {
          if (!s.battle?.over || s.screen === "debrief") return s;
          const node = getNode(s.battle.nodeId);
          if (!node) return { screen: "map", battle: null };
          const win = s.battle.over === "win";
          const first = win && !s.won.includes(node.id);
          const reward = first ? node.reward : null;
          const who = s.nation ? NATIONS[s.nation].name : "觀察員";
          const bulletin = `${monthName(node.y, node.m)}，${who}在「${node.name}」${win ? "達成當日作戰目標" : "中止作戰"}。擊毀看的是乘員、彈藥庫與動力。研發點數 ${reward?.pp ?? 0}，銀獅 ${reward?.steel ?? 0}。`;
          return {
            screen: "debrief",
            won: first ? [...s.won, node.id] : s.won,
            steel: s.steel + (reward?.steel ?? 0),
            eq: s.eq + (reward?.eq ?? 0),
            pp: s.pp + (reward?.pp ?? 0),
            oil: s.oil + (reward?.oil ?? 0),
            mp: win ? s.mp : Math.max(0, s.mp - 4),
            supply: win ? s.supply : Math.max(15, s.supply - 6),
            lastResult: {
              nodeId: node.id,
              name: node.name,
              win,
              reward,
              bulletin,
              lines: s.battle.log.slice(-8).map((l) => l.text),
              quiz: s.won.length % 10,
              picked: null,
            },
          };
        }),
      pickQuiz: (i) =>
        set((s) => {
          if (!s.lastResult || s.lastResult.picked !== null) return s;
          const q = QUIZ[s.lastResult.quiz];
          if (!q) return s;
          const right = i === q.a;
          return {
            pp: s.pp + (right ? 3 : 0),
            lastResult: { ...s.lastResult, picked: i },
          };
        }),
      setBulletin: (text) =>
        set((s) => (s.lastResult ? { lastResult: { ...s.lastResult, bulletin: text }, lastAiAt: Date.now() } : s)),
      claimLecture: () =>
        set((s) => (s.lectureClaimed ? s : { lectureClaimed: true, pp: s.pp + 4, toast: "講堂筆記 +4 政治力。" })),
      importData: (data) => {
        const base = empty();
        const screen: Screen = "map";
        const next: GameData = { ...base, ...data, battle: null, toast: null, screen };
        sync(next.extras ?? []);
        set(next);
      },
    }),
    {
      name: SAVE_KEY,
      version: 1,
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => {
        const screen: Screen = "map";
        return {
          version: s.version,
          screen,
          difficulty: s.difficulty,
          muted: s.muted,
          nation: s.nation,
          story: s.story,
          y: s.y,
          m: s.m,
          civ: s.civ,
          mil: s.mil,
          steel: s.steel,
          oil: s.oil,
          rubber: s.rubber,
          alu: s.alu,
          mp: s.mp,
          pp: s.pp,
          supply: s.supply,
          eq: s.eq,
          modifiers: s.modifiers,
          focuses: s.focuses,
          focusId: s.focusId,
          focusLeft: s.focusLeft,
          owned: s.owned,
          template: s.template,
          won: s.won,
          archiveSeen: s.archiveSeen,
          extras: s.extras,
          chronicle: s.chronicle,
          autoResearch: s.autoResearch,
          aiCount: s.aiCount,
          lastAiAt: s.lastAiAt,
          lastResult: s.lastResult,
          lectureClaimed: s.lectureClaimed,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.screen === "battle" || state.screen === "hq" || state.screen === "story" || state.screen === "nation") {
          state.screen = "map";
        }
        if (state.autoResearch == null) state.autoResearch = false;
        sync(state.extras ?? []);
      },
    },
  ),
);
