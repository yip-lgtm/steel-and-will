import { useEffect, useMemo, useState } from "react";
import { getDef, getNode, layerName } from "@/game/catalog";
import { useGame } from "@/game/store";
import type { Layer, UnitDef } from "@/game/types";
import { LiveMap, spotsNear } from "./live-map";
import { Btn } from "./bits";

let picked = "marne";
let feedPlay: FeedPlay | null = null;

export type FeedPlay = {
  id: string;
  y: number;
  name: string;
  theater: string;
  brief: string;
  kitName: string;
  designation: string;
  year: number;
  layer: Layer;
  history: string;
};

export function openHero30(id: string) {
  feedPlay = null;
  picked = id;
  useGame.getState().setScreen("hero30");
}

export function openFeed30(stage: FeedPlay) {
  feedPlay = stage;
  picked = `feed:${stage.id}`;
  useGame.getState().setScreen("hero30");
}

type Spot = { id: string; name: string; x: number; y: number; kind: "town" | "field" | "boss" | "shrine" };

const MAPS: Record<string, Spot[]> = {
  西線: [
    { id: "paris", name: "巴黎", x: 22, y: 68, kind: "town" },
    { id: "shrine", name: "時之補給站", x: 40, y: 46, kind: "shrine" },
    { id: "marne", name: "馬恩河", x: 58, y: 58, kind: "field" },
    { id: "somme", name: "索姆河", x: 48, y: 28, kind: "field" },
    { id: "boss", name: "防線", x: 72, y: 34, kind: "boss" },
  ],
  北海: [
    { id: "scapa", name: "斯卡帕灣", x: 22, y: 16, kind: "town" },
    { id: "shrine", name: "時之補給站", x: 42, y: 48, kind: "shrine" },
    { id: "dogger", name: "多格灘", x: 50, y: 64, kind: "field" },
    { id: "boss", name: "日德蘭", x: 66, y: 40, kind: "boss" },
  ],
  中國: [
    { id: "beiping", name: "北平", x: 62, y: 28, kind: "town" },
    { id: "shrine", name: "時之補給站", x: 48, y: 42, kind: "shrine" },
    { id: "lugou", name: "盧溝橋", x: 58, y: 36, kind: "field" },
    { id: "boss", name: "橋頭", x: 40, y: 62, kind: "boss" },
  ],
  東歐: [
    { id: "warsaw", name: "華沙", x: 48, y: 36, kind: "town" },
    { id: "shrine", name: "時之補給站", x: 34, y: 52, kind: "shrine" },
    { id: "bzura", name: "布祖拉河", x: 42, y: 48, kind: "field" },
    { id: "boss", name: "邊境", x: 66, y: 30, kind: "boss" },
  ],
  東線: [
    { id: "minsk", name: "明斯克", x: 30, y: 34, kind: "town" },
    { id: "shrine", name: "時之補給站", x: 46, y: 48, kind: "shrine" },
    { id: "kiev", name: "基輔", x: 48, y: 62, kind: "field" },
    { id: "boss", name: "斯摩棱斯克", x: 62, y: 36, kind: "boss" },
  ],
  太平洋: [
    { id: "pearl", name: "珍珠港", x: 18, y: 62, kind: "town" },
    { id: "shrine", name: "時之補給站", x: 40, y: 48, kind: "shrine" },
    { id: "field", name: "偵察航線", x: 58, y: 40, kind: "field" },
    { id: "boss", name: "中途島", x: 74, y: 32, kind: "boss" },
  ],
  本土: [
    { id: "london", name: "倫敦", x: 36, y: 58, kind: "town" },
    { id: "shrine", name: "時之補給站", x: 48, y: 42, kind: "shrine" },
    { id: "kent", name: "肯特", x: 58, y: 62, kind: "field" },
    { id: "boss", name: "海峽", x: 70, y: 48, kind: "boss" },
  ],
};

function spotsFor(theater: string): Spot[] {
  return (
    MAPS[theater] ?? [
      { id: "town", name: "港口", x: 24, y: 62, kind: "town" },
      { id: "shrine", name: "時之補給站", x: 42, y: 44, kind: "shrine" },
      { id: "field", name: "前哨", x: 58, y: 58, kind: "field" },
      { id: "boss", name: "目標", x: 74, y: 30, kind: "boss" },
    ]
  );
}

function yearTheater(y: number) {
  if (y <= 1918) return "西線";
  if (y <= 1935) return "東歐";
  if (y <= 1945) return "東線";
  if (y <= 1990) return "冷戰";
  return "現代";
}

function kitFoe(stage: FeedPlay): UnitDef {
  return {
    id: `feed-${stage.id}`,
    name: stage.kitName,
    designation: stage.designation,
    epithet: stage.name,
    nation: "de",
    layer: stage.layer,
    kind: stage.layer === "air" ? "fighter" : stage.layer === "sea" ? "cruiser" : "tank",
    year: stage.year,
    speed: "slow",
    pen: 40,
    armor: 28,
    rof: 4,
    rounds: 8,
    targets: [stage.layer],
    skill: { id: "salvo", name: "齊射", blurb: "制式火力。", energy: 3 },
    voice: stage.history,
    history: stage.history,
  };
}

export function Hero30() {
  const catalogNode = getNode(picked);
  const stage = catalogNode
    ? { id: catalogNode.id, y: catalogNode.y, theater: catalogNode.theater, name: catalogNode.name, brief: catalogNode.brief }
    : feedPlay && picked === `feed:${feedPlay.id}`
      ? { id: feedPlay.id, y: feedPlay.y, theater: feedPlay.name.includes("俄國內戰") ? "東歐" : yearTheater(feedPlay.y), name: feedPlay.name, brief: feedPlay.brief }
      : null;
  const ids = [...(catalogNode?.fixedPlayer ?? []), ...(catalogNode?.allies ?? [])].filter((id, i, all) => all.indexOf(id) === i);
  const heroes = (ids.length ? ids : ["ft", "spitfire", "enterprise"]).map((id) => getDef(id)).filter((u): u is UnitDef => !!u);
  const foes = catalogNode
    ? [...(catalogNode.fixedEnemy ?? []), ...(catalogNode.axis ?? [])].map((id) => getDef(id)).filter((u): u is UnitDef => !!u)
    : feedPlay
      ? [kitFoe(feedPlay)]
      : [];
  const boss = foes[0];
  const grunt = foes[1] ?? foes[0];
  const [hero, setHero] = useState<UnitDef | null>(null);
  const [sec, setSec] = useState(30);
  const [paused, setPaused] = useState(true);
  const [lv, setLv] = useState(1);
  const [gold, setGold] = useState(0);
  const [gear, setGear] = useState(0);
  const [hp, setHp] = useState(3);
  const [spot, setSpot] = useState<string | null>(null);
  const [log, setLog] = useState("三十秒。打怪、買裝備、打倒魔王。時間不夠就回補給站。");
  const [over, setOver] = useState<"win" | "lose" | null>(null);
  const spots = useMemo(() => spotsFor(stage?.theater ?? ""), [stage?.theater]);
  const here = spots.find((s) => s.id === spot) ?? null;

  useEffect(() => {
    if (!hero || paused || over) return;
    const id = window.setInterval(() => {
      setSec((s) => {
        if (s <= 0.1) {
          setOver("lose");
          setPaused(true);
          return 0;
        }
        return Math.max(0, Math.round((s - 0.1) * 10) / 10);
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [hero, paused, over]);

  if (!stage) return null;

  const power = (hero?.pen ?? 20) + lv * 6 + gear * 8;
  const spend = (n: number) => {
    setSec((s) => Math.max(0, Math.round((s - n) * 10) / 10));
  };

  const go = (next: Spot) => {
    if (over) return;
    setPaused(false);
    setSpot(next.id);
    spend(1);
    setLog(`趕到${next.name}。`);
  };

  const fight = (enemy: UnitDef | undefined, bossFight: boolean) => {
    if (!enemy || over) return;
    setPaused(false);
    spend(bossFight ? 4 : 2);
    const need = enemy.armor + (bossFight ? 18 : 6);
    if (power >= need) {
      setLv((v) => v + (bossFight ? 2 : 1));
      setGold((g) => g + (bossFight ? 30 : 8));
      setLog(`${hero?.name} 打中${enemy.name}的要害。`);
      if (bossFight) {
        setOver("win");
        setPaused(true);
        useGame.setState((s) => ({ won: s.won.includes(stage.id) ? s.won : [...s.won, stage.id] }));
      }
    } else {
      setHp((h) => {
        const left = h - 1;
        if (left <= 0) {
          setOver("lose");
          setPaused(true);
        }
        return left;
      });
      setLog(`${enemy.name} 沒被打穿。`);
    }
  };

  if (!hero) {
    return (
      <div className="phone-scroll">
        <p className="text-xs text-subtle">{stage.y} · {stage.theater}</p>
        <h1 className="font-display text-3xl">{stage.name}</h1>
        <div className="mt-3 h-36 overflow-hidden rounded-2xl bg-[#16324a]">
          <LiveMap theater={stage.theater} label={stage.name} />
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted">選一位兵器娘當勇者。三十秒內走完這張真實戰場，打倒對方的制式裝備。</p>
        <div className="mt-4 grid gap-2">
          {heroes.map((u) => (
            <button key={u.id} type="button" className="rounded-2xl border border-line bg-surface p-3 text-left" onClick={() => { setHero(u); setPaused(false); }}>
              <p className="font-medium">{u.name}</p>
              <p className="text-xs text-subtle">{u.designation} · {layerName(u.layer)} · {u.year}</p>
              <p className="mt-1 text-sm text-muted">{u.history}</p>
            </button>
          ))}
        </div>
        <div className="mt-3">
          <Btn onClick={() => useGame.getState().setScreen("map")}>返回戰役</Btn>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex items-end justify-between gap-2 px-1 pb-2">
        <div>
          <p className="text-xs text-subtle">{stage.theater} · Lv {lv} · {gold} 金</p>
          <h1 className="font-display text-2xl">{stage.name}</h1>
        </div>
        <p className={`font-mono text-4xl ${sec < 8 ? "text-accent" : "text-fg"}`}>{sec.toFixed(1)}</p>
      </div>
      <div className="relative min-h-64 flex-1 overflow-hidden rounded-3xl border border-line">
        <LiveMap
          theater={stage.theater}
          label={stage.name}
          active={spot}
          spots={spotsNear(stage.name, stage.theater, spots)}
          onPick={(id) => {
            const next = spots.find((s) => s.id === id);
            if (next) go(next);
          }}
        />
        <p className="pointer-events-none absolute bottom-2 left-2 text-xs text-[#f6d9cb]">{hero.name} · 命 {hp} · {here?.name ?? "點地圖上的地名"}</p>
      </div>
      <div className="grid max-h-[46%] gap-2 overflow-y-auto py-3">
        <p className="text-sm leading-relaxed text-muted">{log}</p>
        {here?.kind === "field" ? <Btn kind="primary" onClick={() => fight(grunt, false)}>打 {grunt?.name ?? "前哨"}</Btn> : null}
        {here?.kind === "boss" ? <Btn kind="primary" onClick={() => fight(boss, true)}>挑戰 {boss?.name ?? "魔王"}</Btn> : null}
        {here?.kind === "town" ? (
          <Btn kind="primary" onClick={() => { if (gold < 12) { setLog("金幣不夠。先去打前哨。"); return; } setGold((g) => g - 12); setGear((g) => g + 1); setLog("換上這一年的下一件制式裝備。"); }}>買裝備（12 金）</Btn>
        ) : null}
        {here?.kind === "shrine" ? (
          <Btn kind="primary" onClick={() => { if (gold < 10) { setLog("補給站要 10 金才把鐘撥回三十秒。"); return; } setGold((g) => g - 10); setSec(30); setLog("時之補給站把倒數撥回三十秒。"); }}>撥回三十秒（10 金）</Btn>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          <Btn onClick={() => setPaused((p) => !p)}>{paused ? "繼續" : "暫停"}</Btn>
          <Btn onClick={() => useGame.getState().setScreen("map")}>離開</Btn>
        </div>
        {over === "win" ? <p className="text-sm text-fg">三十秒內打穿了。{stage.brief}</p> : null}
        {over === "lose" ? <p className="text-sm text-accent">時間到，或勇者倒下。這一關可以重走。</p> : null}
        {over ? <Btn kind="primary" onClick={() => { setHero(null); setOver(null); setSec(30); setLv(1); setGold(0); setGear(0); setHp(3); setSpot(null); }}>再選勇者</Btn> : null}
      </div>
    </div>
  );
}
