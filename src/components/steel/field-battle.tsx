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
  const [flash, setFlash] = useState("");
  const [lastLog, setLastLog] = useState(0);
  const stickRef = useRef({ x: 0, y: 0 });
  const origin = useRef<{ x: number; y: number } | null>(null);

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
          x: Math.max(8, Math.min(92, p.x + s.x * dt * 28)),
          y: Math.max(18, Math.min(88, p.y + s.y * dt * 28)),
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
    const near = Math.hypot(pos.x - 50, pos.y - 42) < 14;
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
  const speed = Math.round(Math.hypot(stick.x, stick.y) * 32);
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
    <div className={`relative h-full min-h-0 flex-1 overflow-hidden bg-[#7ec8f0] ${battle.pulse ? "is-shake" : ""}`}>
      <div className="absolute inset-x-0 top-0 h-[46%] bg-gradient-to-b from-[#8fd3f8] to-[#c9ecff]" />
      <div className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-b from-[#87b84a] to-[#5d8a32]" />
      <div className="absolute inset-x-8 top-[40%] h-8 rounded-full bg-[#6aa23a]/70" />
      {enemies.map((u, i) => (
        <Target key={u.uid} unit={u} index={i} total={enemies.length} player={pos} />
      ))}
      <div className="absolute bottom-[18%] left-1/2 w-28 -translate-x-1/2">
        {playerDef?.portrait ? (
          <img src={playerDef.portrait} alt="" className="h-24 w-full rounded-2xl object-cover shadow-lg" />
        ) : (
          <div className="h-16 rounded-2xl bg-[#4d5a43] shadow-lg" />
        )}
        <p className="mt-1 text-center text-xs text-white drop-shadow">{speed} km/h</p>
      </div>
      <button type="button" className="absolute left-3 top-3 h-24 w-24 rounded-xl border border-white/40 bg-[#d9d3c3]/80 p-1" onClick={() => useGame.getState().setScreen("map")}>
        <span className="relative block h-full w-full">
          <i className="absolute h-2 w-2 rounded-full bg-sky-500" style={{ left: `${pos.x}%`, top: `${pos.y}%` }} />
          {enemies.map((u, i) => {
            const p = spot(i, enemies.length);
            return <i key={u.uid} className="absolute h-1.5 w-1.5 rounded-full bg-red-500" style={{ left: `${p.x}%`, top: `${p.y}%` }} />;
          })}
          <i className="absolute left-1/2 top-[42%] h-2 w-2 -translate-x-1/2 rounded-sm bg-white" />
        </span>
      </button>
      <div className="absolute left-1/2 top-3 -translate-x-1/2 text-center text-white drop-shadow">
        <p className="font-mono text-sm">{fmt(remain)} · A {cap}%</p>
        <p className="text-xs">{node?.name}</p>
      </div>
      <p className="absolute left-1/2 top-16 max-w-[70%] -translate-x-1/2 text-center text-xs text-white drop-shadow">{flash || "搖桿靠近，準星對上再按右邊開火。"}</p>
      <Joystick
        onChange={(v) => {
          stickRef.current = v;
          setStick(v);
        }}
        origin={origin}
      />
      <button type="button" className="absolute bottom-24 right-4 grid h-16 w-16 place-items-center rounded-full bg-cyan-400 text-lg text-white shadow-lg" onClick={fire}>
        砲
      </button>
      <div className="absolute bottom-6 right-4 grid gap-2">
        {AMMO.map((a) => (
          <button key={a.id} type="button" className={`rounded-full px-3 py-2 text-xs text-white ${battle.priority === a.id ? "bg-cyan-500" : "bg-black/40"}`} onClick={() => setPriority(a.id)}>
            {a.label}
          </button>
        ))}
      </div>
      {battle.over || cap >= 100 ? (
        <div className="absolute inset-0 grid place-items-end bg-black/40 p-4">
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
  return { x: 20 + (i + 1) * (60 / (total + 1)), y: 28 + (i % 2) * 10 };
}

function Target({ unit, index, total, player }: { unit: UnitInst; index: number; total: number; player: { x: number; y: number } }) {
  const def = getDef(unit.defId);
  const p = spot(index, total);
  const dist = Math.hypot(p.x - player.x, p.y - player.y);
  const dead = neutralized(unit);
  return (
    <button
      type="button"
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `translate(-50%, -50%) scale(${Math.max(0.7, 1.4 - dist / 80)})` }}
      onClick={() => useGame.getState().shoot(unit.uid)}
    >
      <span className="block text-center text-[10px] text-white drop-shadow">{(dist / 18).toFixed(2)} km</span>
      <span className={`mx-auto mt-1 block h-8 w-14 rounded bg-[#5c5344] ${dead ? "opacity-30" : ""}`} />
      <span className="block text-center text-[10px] text-white">{def?.name}</span>
    </button>
  );
}

function Joystick({
  onChange,
  origin,
}: {
  onChange: (v: { x: number; y: number }) => void;
  origin: { current: { x: number; y: number } | null };
}) {
  return (
    <div
      className="absolute bottom-8 left-4 grid h-28 w-28 place-items-center rounded-full border border-white/50 bg-black/20"
      onPointerDown={(e) => {
        origin.current = { x: e.clientX, y: e.clientY };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!origin.current) return;
        const x = Math.max(-1, Math.min(1, (e.clientX - origin.current.x) / 48));
        const y = Math.max(-1, Math.min(1, (e.clientY - origin.current.y) / 48));
        onChange({ x, y });
      }}
      onPointerUp={() => {
        origin.current = null;
        onChange({ x: 0, y: 0 });
      }}
    >
      <span className="h-12 w-12 rounded-full bg-white/80" />
    </div>
  );
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
