import { useEffect, useMemo, useRef, useState } from "react";
import { neutralized } from "@/game/battle";
import { getDef, getNode } from "@/game/catalog";
import { sfx } from "@/game/sfx";
import { useGame } from "@/game/store";
import type { ModuleKey, UnitInst } from "@/game/types";
import { Btn } from "./bits";

const AMMO: { id: ModuleKey; label: string }[] = [
  { id: "ammo", label: "APHE" },
  { id: "armor", label: "AP" },
  { id: "crew", label: "HE" },
];

export function FieldBattle() {
  const battle = useGame((s) => s.battle);
  const muted = useGame((s) => s.muted);
  const tick = useGame((s) => s.tickBattle);
  const settle = useGame((s) => s.settle);
  const setPriority = useGame((s) => s.setPriority);
  const [pos, setPos] = useState({ x: 50, y: 78 });
  const [stick, setStick] = useState({ x: 0, y: 0 });
  const [cap, setCap] = useState(0);
  const [flash, setFlash] = useState("拖左邊搖桿開車。點敵車，或按右下開火。");
  const [lastLog, setLastLog] = useState(0);
  const stickRef = useRef({ x: 0, y: 0 });

  const enemies = useMemo(() => battle?.units.filter((u) => u.side === "enemy") ?? [], [battle]);
  const player = battle?.units.find((u) => u.side === "player" && !neutralized(u));
  const playerDef = player ? getDef(player.defId) : undefined;

  useEffect(() => {
    if (!battle || battle.over) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = stickRef.current;
      if (s.x || s.y) {
        setPos((p) => ({
          x: Math.max(12, Math.min(88, p.x + s.x * dt * 36)),
          y: Math.max(52, Math.min(84, p.y + s.y * dt * 28)),
        }));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const clock = window.setInterval(() => tick(0.35), 350);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(clock);
    };
  }, [battle?.nodeId, battle?.over, tick]);

  useEffect(() => {
    if (!battle) return;
    const last = battle.log[battle.log.length - 1];
    if (!last || last.id === lastLog) return;
    setLastLog(last.id);
    setFlash(last.text);
    if (muted) return;
    if (last.text.includes("殉爆")) sfx.boom();
    else if (last.text.includes("命中")) sfx.hit();
  }, [battle, lastLog, muted]);

  useEffect(() => {
    const near = Math.hypot(pos.x - 50, pos.y - 58) < 12;
    if (!near || battle?.over) return;
    const id = window.setInterval(() => setCap((c) => Math.min(100, c + 4)), 400);
    return () => window.clearInterval(id);
  }, [pos.x, pos.y, battle?.over]);

  useEffect(() => {
    if (cap < 100 || !battle || battle.over) return;
    useGame.setState((s) => (s.battle ? { battle: { ...s.battle, over: "win" } } : s));
  }, [cap, battle]);

  if (!battle) return null;
  const node = getNode(battle.nodeId);
  const speed = Math.round(Math.hypot(stick.x, stick.y) * 36);
  const remain = Math.max(0, 15 * 60 - battle.t);

  const fire = () => {
    const live = enemies.filter((u) => !neutralized(u));
    if (!live.length) return;
    const nearest = live
      .map((u, i) => ({ u, d: Math.hypot(spot(i, live.length).x - pos.x, spot(i, live.length).y - pos.y) }))
      .sort((a, b) => a.d - b.d)[0];
    if (!nearest) return;
    useGame.getState().shoot(nearest.u.uid);
  };

  return (
    <div className={`relative h-full min-h-0 flex-1 overflow-hidden bg-[#8fd3f8] ${battle.pulse ? "is-shake" : ""}`} style={{ touchAction: "none" }}>
      <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-[#7ec8f0] to-[#d7f1ff]" />
      <div className="absolute inset-x-0 bottom-0 top-[40%] bg-gradient-to-b from-[#9ccc65] via-[#7cb342] to-[#558b2f]" />
      <div className="absolute left-1/2 top-[56%] h-10 w-10 -translate-x-1/2 rounded-sm border-2 border-white/80 bg-white/20 text-center text-[10px] leading-9 text-white">A</div>
      {enemies.map((u, i) => (
        <Target key={u.uid} unit={u} index={i} total={enemies.length} player={pos} />
      ))}
      <div className="pointer-events-none absolute z-10 w-24 -translate-x-1/2" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
        <Hull name={playerDef?.name ?? "我方"} tone="#3e4a34" />
        <p className="text-center text-xs font-medium text-white drop-shadow">{speed} km/h</p>
      </div>
      <button type="button" className="absolute left-3 top-3 z-20 h-20 w-20 rounded-xl border border-white/50 bg-[#efe8d6]/90" onClick={() => useGame.getState().setScreen("map")}>
        <span className="relative block h-full w-full">
          <i className="absolute h-2.5 w-2.5 rounded-full bg-sky-600" style={{ left: `${pos.x}%`, top: `${pos.y}%` }} />
          <i className="absolute left-1/2 top-[58%] h-2 w-2 -translate-x-1/2 bg-white" />
          {enemies.map((u, i) => {
            const p = spot(i, enemies.length);
            return <i key={u.uid} className="absolute h-2 w-2 rounded-full bg-red-600" style={{ left: `${p.x}%`, top: `${p.y}%` }} />;
          })}
        </span>
      </button>
      <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 text-center text-white drop-shadow">
        <p className="font-mono text-sm">{fmt(remain)} · A {cap}%</p>
        <p className="text-xs">{node?.name}</p>
      </div>
      <p className="pointer-events-none absolute left-1/2 top-14 z-20 max-w-[78%] -translate-x-1/2 text-center text-xs text-white drop-shadow">{flash}</p>
      <Stick
        onChange={(v) => {
          stickRef.current = v;
          setStick(v);
        }}
      />
      <div className="absolute bottom-4 right-3 z-20 grid gap-2">
        <button type="button" className="grid h-20 w-20 place-items-center rounded-full bg-cyan-400 text-base font-medium text-white shadow-lg" onClick={fire}>
          開火
        </button>
        <div className="grid grid-cols-3 gap-1">
          {AMMO.map((a) => (
            <button key={a.id} type="button" className={`rounded-full px-2 py-2 text-[11px] text-white ${battle.priority === a.id ? "bg-cyan-600" : "bg-black/50"}`} onClick={() => setPriority(a.id)}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
      {battle.over ? (
        <div className="absolute inset-0 z-30 grid place-items-end bg-black/45 p-4">
          <div className="w-full rounded-3xl bg-white p-4 text-black">
            <h2 className="font-display text-2xl">{battle.over === "lose" ? "作戰中止" : "據點拿下"}</h2>
            <p className="mt-2 text-sm">{flash}</p>
            <div className="mt-3">
              <Btn kind="primary" onClick={() => settle()}>
                結算
              </Btn>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function spot(i: number, total: number) {
  return { x: 18 + ((i + 0.5) * 64) / Math.max(1, total), y: 50 + (i % 3) * 6 };
}

function Target({ unit, index, total, player }: { unit: UnitInst; index: number; total: number; player: { x: number; y: number } }) {
  const def = getDef(unit.defId);
  const p = spot(index, total);
  const dist = Math.hypot(p.x - player.x, p.y - player.y);
  const dead = neutralized(unit);
  return (
    <button
      type="button"
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${p.x}%`, top: `${p.y}%` }}
      onClick={() => useGame.getState().shoot(unit.uid)}
    >
      <span className="block text-center text-[10px] text-white drop-shadow">{dead ? "擊毀" : `${(dist / 22).toFixed(2)} km`}</span>
      <Hull name={def?.name ?? "敵"} tone={dead ? "#6b6256" : "#5c4632"} />
    </button>
  );
}

function Hull({ name, tone }: { name: string; tone: string }) {
  return (
    <span className="mx-auto grid w-16 justify-items-center">
      <span className="h-3 w-8 rounded-sm" style={{ background: tone }} />
      <span className="relative -mt-1 h-7 w-14 rounded-md shadow" style={{ background: tone }}>
        <span className="absolute -right-3 top-2 h-1.5 w-4 bg-[#2b241c]" />
      </span>
      <span className="mt-0.5 max-w-16 truncate text-center text-[10px] text-white drop-shadow">{name}</span>
    </span>
  );
}

function Stick({ onChange }: { onChange: (v: { x: number; y: number }) => void }) {
  const origin = useRef<{ x: number; y: number } | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  return (
    <div
      className="absolute bottom-6 left-3 z-20 grid h-28 w-28 place-items-center rounded-full border-2 border-white/70 bg-black/25"
      style={{ touchAction: "none" }}
      onPointerDown={(e) => {
        origin.current = { x: e.clientX, y: e.clientY };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!origin.current) return;
        const x = Math.max(-1, Math.min(1, (e.clientX - origin.current.x) / 42));
        const y = Math.max(-1, Math.min(1, (e.clientY - origin.current.y) / 42));
        setKnob({ x: x * 28, y: y * 28 });
        onChange({ x, y });
      }}
      onPointerUp={() => {
        origin.current = null;
        setKnob({ x: 0, y: 0 });
        onChange({ x: 0, y: 0 });
      }}
    >
      <span className="h-12 w-12 rounded-full bg-white shadow" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
