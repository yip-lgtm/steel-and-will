import { useEffect, useMemo, useState } from "react";
import { getDef, getNode, layerName } from "@/game/catalog";
import { useGame } from "@/game/store";
import type { UnitDef } from "@/game/types";
import { Btn } from "./bits";

let picked = "marne";

export function openHero30(id: string) {
  picked = id;
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

function TheaterMap({ theater }: { theater: string }) {
  const land = "#c4b48a";
  const line = "#efe6cf";
  if (theater === "北海") {
    return (
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-label="北海">
        <path d="M6 8 L16 4 L20 12 L14 18 L18 28 L12 40 L16 54 L10 70 L6 62 L8 36 Z" fill={land} stroke={line} strokeWidth="0.4" />
        <path d="M18 6 L22 4 L21 9 Z" fill={land} />
        <path d="M74 2 L90 4 L86 24 L78 16 L74 6 Z" fill={land} stroke={line} strokeWidth="0.4" />
        <path d="M68 34 L78 30 L84 46 L76 72 L66 60 L70 44 Z" fill={land} stroke={line} strokeWidth="0.4" />
        <path d="M58 78 L98 72 L98 100 L36 100 L46 84 Z" fill={land} stroke={line} strokeWidth="0.4" />
        <text x="8" y="42" fill="#1b2430" fontSize="3.2">英國</text>
        <text x="76" y="14" fill="#1b2430" fontSize="3.2">挪威</text>
        <text x="70" y="52" fill="#1b2430" fontSize="3.2">日德蘭半島</text>
      </svg>
    );
  }
  if (theater === "西線" || theater === "本土") {
    return (
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-label={theater}>
        <path d="M4 8 L18 6 L16 28 L10 46 L14 70 L6 78 L4 40 Z" fill={land} stroke={line} strokeWidth="0.4" />
        <path d="M28 30 L98 18 L98 100 L22 100 L26 70 L34 48 Z" fill={land} stroke={line} strokeWidth="0.4" />
        <text x="6" y="40" fill="#1b2430" fontSize="3.2">英國</text>
        <text x="48" y="78" fill="#1b2430" fontSize="3.2">法國</text>
        <text x="62" y="34" fill="#1b2430" fontSize="3.2">比利時</text>
      </svg>
    );
  }
  if (theater === "太平洋") {
    return (
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-label="太平洋">
        <path d="M2 40 L16 36 L18 58 L8 70 L2 56 Z" fill={land} stroke={line} strokeWidth="0.4" />
        <path d="M70 8 L98 6 L98 34 L82 28 L74 16 Z" fill={land} stroke={line} strokeWidth="0.4" />
        <circle cx="74" cy="32" r="2.2" fill={land} />
        <circle cx="58" cy="40" r="1.4" fill={land} />
        <text x="4" y="52" fill="#1b2430" fontSize="3">夏威夷</text>
        <text x="78" y="18" fill="#1b2430" fontSize="3.2">日本</text>
      </svg>
    );
  }
  if (theater === "中國") {
    return (
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-label="中國">
        <path d="M8 20 L70 8 L78 30 L62 48 L70 78 L20 90 L8 60 Z" fill={land} stroke={line} strokeWidth="0.4" />
        <path d="M78 30 L98 24 L98 70 L74 62 Z" fill="#1d4e73" />
        <text x="28" y="40" fill="#1b2430" fontSize="4">華北</text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-label={theater}>
      <path d="M6 18 L40 8 L78 16 L92 40 L80 78 L30 92 L8 60 Z" fill={land} stroke={line} strokeWidth="0.4" />
      <text x="36" y="52" fill="#1b2430" fontSize="4">{theater}</text>
    </svg>
  );
}

export function Hero30() {
  const node = getNode(picked);
  const ids = [...(node?.fixedPlayer ?? []), ...(node?.allies ?? [])].filter((id, i, all) => all.indexOf(id) === i);
  const heroes = (ids.length ? ids : ["ft", "spitfire", "enterprise"]).map((id) => getDef(id)).filter((u): u is UnitDef => !!u);
  const foes = [...(node?.fixedEnemy ?? []), ...(node?.axis ?? [])].map((id) => getDef(id)).filter((u): u is UnitDef => !!u);
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
  const spots = useMemo(() => spotsFor(node?.theater ?? ""), [node?.theater]);
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

  if (!node) return null;

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
        useGame.setState((s) => ({ won: s.won.includes(node.id) ? s.won : [...s.won, node.id] }));
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
        <p className="text-xs text-subtle">{node.y} · {node.theater}</p>
        <h1 className="font-display text-3xl">{node.name}</h1>
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
          <p className="text-xs text-subtle">{node.theater} · Lv {lv} · {gold} 金</p>
          <h1 className="font-display text-2xl">{node.name}</h1>
        </div>
        <p className={`font-mono text-4xl ${sec < 8 ? "text-accent" : "text-fg"}`}>{sec.toFixed(1)}</p>
      </div>
      <div className="relative min-h-56 flex-1 overflow-hidden rounded-3xl border border-line bg-[#16324a]">
        <TheaterMap theater={node.theater} />
        {spots.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => go(s)}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border px-2 py-1 text-xs ${s.id === spot ? "border-accent bg-accent text-accent-fg" : "border-line bg-surface text-fg"}`}
            style={{ left: `${s.x}%`, top: `${s.y}%` }}
          >
            {s.name}
          </button>
        ))}
        <p className="absolute bottom-2 left-2 text-xs text-subtle">{hero.name} · 命 {hp} · {here?.name ?? "選一個地點"}</p>
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
        {over === "win" ? <p className="text-sm text-fg">三十秒內打穿了。{node.brief}</p> : null}
        {over === "lose" ? <p className="text-sm text-accent">時間到，或勇者倒下。這一關可以重走。</p> : null}
        {over ? <Btn kind="primary" onClick={() => { setHero(null); setOver(null); setSec(30); setLv(1); setGold(0); setGear(0); setHp(3); setSpot(null); }}>再選勇者</Btn> : null}
      </div>
    </div>
  );
}
