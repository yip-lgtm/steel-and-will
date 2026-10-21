import { useMemo, useState } from "react";
import { allCatalog } from "@/game/catalog";
import type { UnitDef } from "@/game/types";
import { useGame } from "@/game/store";
import { Btn, Panel } from "./bits";
import { CardFace } from "./card-face";

type Tile = "beach" | "hill" | "supply";

const TILES: { id: Tile; name: string; note: string }[] = [
  { id: "beach", name: "灘頭", note: "先上岸的人占這裡。" },
  { id: "hill", name: "高地", note: "火力從這裡壓下來。" },
  { id: "supply", name: "補給", note: "占住才能換下一張卡。" },
];

function beats(a: UnitDef, b: UnitDef) {
  if (a.layer === b.layer) return a.pen + a.armor >= b.pen + b.armor ? "you" : "them";
  if (a.layer === "sea" && b.layer === "land") return "you";
  if (a.layer === "air" && b.layer === "sea") return "you";
  if (a.layer === "land" && b.layer === "air") return "you";
  return "them";
}

function hand() {
  const pool = allCatalog().filter((u) => u.year >= 1914 && u.year <= 1945);
  return [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
}

export function Clash() {
  const [mine, setMine] = useState(hand);
  const [theirs] = useState(hand);
  const [pick, setPick] = useState<string | null>(null);
  const [enemy, setEnemy] = useState<UnitDef | null>(null);
  const [score, setScore] = useState({ you: 0, them: 0 });
  const [log, setLog] = useState("出一張卡。海克陸，空克海，陸克空。同層比火力加防護。");
  const chosen = mine.find((u) => u.id === pick);
  const over = score.you >= 2 || score.them >= 2;
  function play(id: string) {
    if (over || enemy) return;
    const card = mine.find((u) => u.id === id);
    if (!card) return;
    const foe = theirs[Math.floor(Math.random() * theirs.length)]!;
    const win = beats(card, foe) === "you";
    setPick(id);
    setEnemy(foe);
    setScore((s) => ({ you: s.you + (win ? 1 : 0), them: s.them + (win ? 0 : 1) }));
    setLog(win ? `${card.name} 壓過 ${foe.name}。` : `${foe.name} 壓過 ${card.name}。`);
  }
  function next() {
    if (over) return;
    setMine(hand());
    setPick(null);
    setEnemy(null);
  }
  return (
    <div className="grid gap-3">
      <Btn onClick={() => useGame.getState().setScreen("title")}>返回</Btn>
      <h1 className="font-display text-3xl">卡牌對撞</h1>
      <p className="font-mono text-xs text-subtle">{score.you} : {score.them} · 先到兩分</p>
      <Panel><p className="text-sm leading-relaxed text-muted">{log}</p></Panel>
      {enemy && chosen ? (
        <div className="grid grid-cols-2 gap-2">
          <CardFace unit={chosen} />
          <CardFace unit={enemy} />
        </div>
      ) : null}
      {over ? (
        <Btn kind="primary" onClick={() => { setScore({ you: 0, them: 0 }); setMine(hand()); setPick(null); setEnemy(null); setLog("再來一局。"); }}>再來</Btn>
      ) : enemy ? (
        <Btn kind="primary" onClick={next}>下一張</Btn>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {mine.map((u) => (
            <button key={u.id} type="button" onClick={() => play(u.id)} className="overflow-hidden rounded-2xl border border-line text-left">
              <CardFace unit={u} />
              <p className="bg-surface px-2 py-2 text-xs">{u.name}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Hold() {
  const deck = useMemo(hand, []);
  const foe = useMemo(hand, []);
  const [held, setHeld] = useState<Record<Tile, "you" | "them" | null>>({ beach: null, hill: null, supply: null });
  const [log, setLog] = useState("派一張卡去一格。先占兩格就贏。");
  const [used, setUsed] = useState<string[]>([]);
  const you = TILES.filter((t) => held[t.id] === "you").length;
  const them = TILES.filter((t) => held[t.id] === "them").length;
  const over = you >= 2 || them >= 2;
  function send(tile: Tile, id: string) {
    if (over || held[tile] || used.includes(id)) return;
    const card = deck.find((u) => u.id === id);
    const enemy = foe[Math.floor(Math.random() * foe.length)];
    if (!card || !enemy) return;
    const win = beats(card, enemy) === "you";
    setHeld((h) => ({ ...h, [tile]: win ? "you" : "them" }));
    setUsed((u) => [...u, id]);
    setLog(win ? `${card.name} 占住${TILES.find((t) => t.id === tile)?.name}。` : `${enemy.name} 守住了這一格。`);
  }
  return (
    <div className="grid gap-3">
      <Btn onClick={() => useGame.getState().setScreen("title")}>返回</Btn>
      <h1 className="font-display text-3xl">占三格</h1>
      <p className="font-mono text-xs text-subtle">{you} : {them} · 先占兩格</p>
      <Panel><p className="text-sm leading-relaxed text-muted">{log}</p></Panel>
      {TILES.map((tile) => (
        <Panel key={tile.id}>
          <div className="flex items-baseline justify-between">
            <h2 className="font-medium">{tile.name}</h2>
            <span className="text-xs text-subtle">{held[tile.id] === "you" ? "你占" : held[tile.id] === "them" ? "對方占" : "空"}</span>
          </div>
          <p className="mt-1 text-xs text-subtle">{tile.note}</p>
          {!held[tile.id] && !over ? (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {deck.map((u) => (
                <button key={u.id} type="button" disabled={used.includes(u.id)} onClick={() => send(tile.id, u.id)} className="rounded-xl border border-line px-2 py-2 text-left text-xs disabled:opacity-30">
                  {u.name}
                </button>
              ))}
            </div>
          ) : null}
        </Panel>
      ))}
      {over ? <Btn kind="primary" onClick={() => { setHeld({ beach: null, hill: null, supply: null }); setUsed([]); setLog("再占一次。"); }}>再來</Btn> : null}
    </div>
  );
}
