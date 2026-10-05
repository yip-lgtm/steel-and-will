import { Anchor, Mountain, Plane } from "lucide-react";
import { useEffect, useState } from "react";
import { airBanner, neutralized, phaseName } from "@/game/battle";
import { getDef, getNode, kindName, layerName, moduleLabel } from "@/game/catalog";
import { sfx } from "@/game/sfx";
import { useGame } from "@/game/store";
import type { Layer, ModuleKey, UnitInst } from "@/game/types";
import { Btn } from "./bits";

const KEYS: ModuleKey[] = ["armor", "engine", "ammo", "crew", "gun"];

export function BattleView() {
  const battle = useGame((s) => s.battle);
  const muted = useGame((s) => s.muted);
  const tick = useGame((s) => s.tickBattle);
  const settle = useGame((s) => s.settle);
  const setFocusTarget = useGame((s) => s.setFocusTarget);
  const setShooter = useGame((s) => s.setShooter);
  const setPriority = useGame((s) => s.setPriority);
  const setLead = useGame((s) => s.setLead);
  const useSkill = useGame((s) => s.useSkill);
  const fireManual = useGame((s) => s.fireManual);
  const [paused, setPaused] = useState(true);
  const [speed, setSpeed] = useState<1 | 2>(1);
  const [brief, setBrief] = useState(true);
  const [lastLog, setLastLog] = useState(0);

  useEffect(() => {
    if (!battle) return;
    const last = battle.log[battle.log.length - 1];
    if (!last || last.id === lastLog) return;
    setLastLog(last.id);
    if (muted) return;
    if (last.text.includes("殉爆")) sfx.boom();
    else if (last.text.includes("命中")) sfx.hit();
  }, [battle, lastLog, muted]);

  useEffect(() => {
    if (!battle || paused || brief || battle.over) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      acc += dt * speed;
      if (acc >= 0.1) {
        const steps = Math.min(4, Math.floor(acc / 0.1));
        acc -= steps * 0.1;
        tick(steps * 0.1);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [battle?.nodeId, battle?.over, paused, brief, speed, tick]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || brief) return;
      e.preventDefault();
      setPaused((p) => !p);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [brief]);

  if (!battle) return null;
  const node = getNode(battle.nodeId);
  const focus = battle.units.find((u) => u.uid === battle.focusUid);
  const focusDef = focus ? getDef(focus.defId) : undefined;

  return (
    <div className={`relative flex h-full min-h-0 flex-1 flex-col ${battle.pulse ? "is-shake" : ""}`}>
      <div className="phone-scroll">
      <header className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs tracking-wide text-subtle">{node?.theater}</p>
          <h1 className="font-display text-2xl text-fg">{node?.name ?? "交戰"}</h1>
        </div>
        <div className="text-right font-mono text-xs tabular-nums text-muted">
          <div>{phaseName(battle.t, battle.layers)}</div>
          <div>{battle.t.toFixed(0)} 秒</div>
        </div>
      </header>
      <LayerLink layers={battle.layers} banner={airBanner(battle)} cross={battle.cross} />
      <div className="mb-3 flex flex-wrap gap-2 text-xs text-muted">
        <span className="rounded-lg border border-line px-2 py-1 font-mono tabular-nums">能量 {Math.floor(battle.energy)}</span>
        <span className="rounded-lg border border-line px-2 py-1">{paused ? "時間停止" : speed === 2 ? "兩倍流速" : "半即時"}</span>
      </div>

      {battle.layers.map((layer) => (
        <Lane
          key={layer}
          layer={layer}
          units={battle.units.filter((u) => getDef(u.defId)?.layer === layer)}
          focusUid={battle.focusUid}
          shooterUid={battle.shooterUid}
          onPick={(u) => (u.side === "enemy" ? setFocusTarget(u.uid) : setShooter(u.uid))}
        />
      ))}
      </div>

      <div className="phone-dock">
        <p className="mb-2 max-h-24 overflow-y-auto text-xs leading-relaxed text-muted">
          {battle.log.slice(-4).map((l) => (
            <span key={l.id} className="block">
              {l.text}
            </span>
          ))}
        </p>
        <p className="mb-2 text-xs text-subtle">目標部件</p>
        <div className="grid grid-cols-5 gap-1">
          {KEYS.map((k) => (
            <button
              key={k}
              type="button"
              data-testid={`mod-${k}`}
              onClick={() => setPriority(k)}
              className={`min-h-11 rounded-lg text-xs ${battle.priority === k ? "bg-accent text-accent-fg" : "bg-elevated text-fg"} ${
                battle.difficulty === "arcade" && k === "ammo" && battle.priority !== k ? "ring-1 ring-accent" : ""
              }`}
            >
              {focusDef ? moduleLabel(focusDef.kind, k) : k === "ammo" ? "彈藥" : k === "engine" ? "動力" : k === "crew" ? "乘員" : k === "gun" ? "火力" : "裝甲"}
            </button>
          ))}
        </div>
        {battle.difficulty === "arcade" && battle.priority !== "ammo" ? (
          <p className="mt-2 text-xs text-subtle">電玩提示：有框的是建議先打的要害。</p>
        ) : null}
        {battle.difficulty === "simulator" ? (
          <div className="mt-3">
            <p className="text-xs text-subtle">提前量。高速為 +2，低速為 0，差一格就偏出。</p>
            <div className="mt-2 flex gap-1">
              {[-2, -1, 0, 1, 2].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setLead(n)}
                  className={`min-h-11 flex-1 rounded-lg font-mono text-sm tabular-nums ${battle.lead === n ? "bg-accent text-accent-fg" : "bg-elevated text-fg"}`}
                >
                  {n > 0 ? `+${n}` : n}
                </button>
              ))}
            </div>
            <div className="mt-2">
              <Btn testid="btn-fire" kind="primary" onClick={() => fireManual()} disabled={!!battle.over}>
                發射
              </Btn>
            </div>
          </div>
        ) : null}
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {battle.units
            .filter((u) => u.side === "player" && !neutralized(u))
            .map((u) => {
              const def = getDef(u.defId);
              if (!def) return null;
              return (
                <button
                  key={u.uid}
                  type="button"
                  disabled={!!battle.over || battle.energy < def.skill.energy || u.skillCd > 0}
                  onClick={() => useSkill(u.uid)}
                  className="min-h-11 shrink-0 rounded-lg border border-line bg-elevated px-3 text-left text-xs disabled:opacity-40"
                >
                  <span className="block text-fg">{def.skill.name}</span>
                  <span className="text-subtle">
                    {def.name} · {def.skill.energy}
                  </span>
                </button>
              );
            })}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Btn testid="btn-pause" onClick={() => setPaused((p) => !p)}>
            {paused ? "繼續" : "暫停"}
          </Btn>
          <Btn
            testid="btn-step"
            onClick={() => {
              setPaused(true);
              tick(2);
            }}
            disabled={!!battle.over}
          >
            推進兩秒
          </Btn>
          <Btn onClick={() => setSpeed((v) => (v === 1 ? 2 : 1))} disabled={paused}>
            {speed === 1 ? "兩倍" : "原速"}
          </Btn>
        </div>
      </div>

      {brief ? (
        <div className="absolute inset-0 z-30 grid place-items-end bg-bg/80 p-4">
          <div className="mx-auto w-full max-w-md rounded-3xl border border-line bg-surface p-5">
            <p className="text-xs text-subtle">戰前</p>
            <h2 className="mt-1 font-display text-2xl">{node?.name}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">{node?.brief}</p>
            <p className="mt-3 text-sm leading-relaxed text-fg">
              沒有血條。打掉彈藥、動力或乘員才算癱瘓。主砲壞了只是不能還手。
            </p>
            <div className="mt-4">
              <Btn testid="btn-engage" kind="primary" onClick={() => { setBrief(false); setPaused(false); }}>
                開始交戰
              </Btn>
            </div>
          </div>
        </div>
      ) : null}

      {battle.over ? (
        <div className="absolute inset-0 z-30 grid place-items-end bg-bg/80 p-4">
          <div className="mx-auto w-full max-w-md rounded-3xl border border-line bg-surface p-5">
            <h2 className="font-display text-2xl">{battle.over === "win" ? "當日目標達成" : "作戰中止"}</h2>
            <p className="mt-2 text-sm text-muted">{battle.log[battle.log.length - 1]?.text}</p>
            <div className="mt-4">
              <Btn testid="btn-settle" kind="primary" onClick={() => settle()}>
                閱讀戰報
              </Btn>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LayerLink({ layers, banner, cross }: { layers: Layer[]; banner: string; cross: boolean }) {
  const items: { id: Layer; label: string; icon: typeof Plane }[] = [
    { id: "air", label: "空", icon: Plane },
    { id: "land", label: "陸", icon: Mountain },
    { id: "sea", label: "海", icon: Anchor },
  ];
  return (
    <section className="mb-3 rounded-3xl border border-line bg-surface p-3">
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const on = layers.includes(item.id);
          return (
            <div
              key={item.id}
              className={`grid min-h-14 place-items-center gap-1 rounded-2xl text-xs ${on ? "bg-elevated text-fg" : "text-subtle"}`}
            >
              <Icon className={`size-4 ${on ? "text-accent" : "text-subtle"}`} aria-hidden />
              {item.label}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted">{banner}</p>
      {cross ? <p className="mt-1 text-xs text-subtle">艦砲可以打上岸。岸上打不到船。</p> : null}
    </section>
  );
}

function Lane({
  layer,
  units,
  focusUid,
  shooterUid,
  onPick,
}: {
  layer: Layer;
  units: UnitInst[];
  focusUid: string | null;
  shooterUid: string | null;
  onPick: (u: UnitInst) => void;
}) {
  if (!units.length) return null;
  return (
    <section className="mb-3">
      <h2 className="mb-2 text-xs text-subtle">{layerName(layer)}層</h2>
      <div className="grid gap-2">
        {units.map((u) => {
          const def = getDef(u.defId);
          if (!def) return null;
          const selected = u.uid === focusUid || u.uid === shooterUid;
          const dead = neutralized(u);
          return (
            <button
              key={u.uid}
              type="button"
              onClick={() => onPick(u)}
              className={`rounded-2xl border p-3 text-left ${selected ? "border-accent" : "border-line"} ${dead ? "opacity-45" : ""} bg-surface`}
            >
              <div className="flex gap-3">
                {def.portrait ? (
                  <img src={def.portrait} alt="" className="h-16 w-12 rounded-2xl object-cover" />
                ) : (
                  <span className="grid h-16 w-12 place-items-center rounded-2xl border border-line font-display text-lg text-accent">
                    {kindName(def.kind).slice(0, 1)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-medium">
                      {u.side === "enemy" ? "敵 · " : ""}
                      {def.name}
                    </span>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-muted">{u.rounds} 發</span>
                  </div>
                  <p className="truncate text-xs text-subtle">
                    {dead ? "已癱瘓" : u.stunned > 0 ? "停火" : u.conceal > 0 ? "難以鎖定" : def.epithet}
                  </p>
                  <div className="mt-2 grid gap-1">
                    {KEYS.map((k) => {
                      const pct = Math.max(0, Math.round((u.mod[k] / u.modMax[k]) * 100));
                      const color = k === "ammo" ? "bg-danger" : k === "engine" ? "bg-ok" : "bg-accent";
                      return (
                        <div key={k} className="flex items-center gap-2">
                          <span className="w-12 shrink-0 text-xs text-subtle">{moduleLabel(def.kind, k)}</span>
                          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg">
                            <span className={`block h-full ${color}`} style={{ width: `${pct}%` }} />
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
