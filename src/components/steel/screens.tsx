import { useEffect, useState } from "react";
import {
  ARCHIVES,
  DIFFICULTY_COPY,
  DISPUTES,
  FOCUSES,
  MODELS,
  NATIONS,
  NODES,
  QUIZ,
  STORY,
  allCatalog,
  buyCost,
  canFight,
  difficultyLabel,
  getDef,
  getNode,
  isPrologue,
  kindName,
  layerName,
  nationTitle,
  nextPrologue,
  serviceThisYear,
} from "@/game/catalog";
import { deskPage, loadDaily, todayKey, type DailyPage } from "@/game/daily";
import { researchOnce } from "@/game/research";
import { projectMonth, SAVE_KEY, useGame } from "@/game/store";
import type { Layer, NationId } from "@/game/types";
import { writeBulletin } from "@/lib/dossier.functions";
import { Btn, Field, Panel } from "./bits";

function Resources() {
  const s = useGame();
  return (
    <div className="grid grid-cols-4 gap-3">
      <Field k="鋼" v={s.steel} />
      <Field k="油" v={s.oil} />
      <Field k="膠" v={s.rubber} />
      <Field k="鋁" v={s.alu} />
      <Field k="人" v={s.mp} />
      <Field k="政" v={s.pp} />
      <Field k="補" v={s.supply} />
      <Field k="裝" v={s.eq} />
    </div>
  );
}

function DailyCard() {
  const [page, setPage] = useState<DailyPage | null>(null);
  useEffect(() => {
    let cancel = false;
    setPage(deskPage(todayKey()));
    void loadDaily().then((next) => {
      if (!cancel) setPage(next);
    });
    return () => {
      cancel = true;
    };
  }, []);
  if (!page) return null;
  return (
    <Panel>
      <p className="text-xs text-subtle">
        {page.source === "llm" ? "今日劇本 · 檔案室新寫" : "今日劇本 · 真實索引"} · {page.k}
      </p>
      <h2 className="mt-1 font-display text-xl">{page.t}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{page.b}</p>
    </Panel>
  );
}

export function Hq() {
  const s = useGame();
  const setScreen = useGame((st) => st.setScreen);
  if (!s.nation) return null;
  return (
    <div className="grid gap-4">
      <div>
        <p className="text-xs text-subtle">
          {s.y}年{s.m}月 · {difficultyLabel(s.difficulty)}
        </p>
        <h1 className="font-display text-3xl">{nationTitle(s.nation, s.modifiers)}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{NATIONS[s.nation].blurb}</p>
      </div>
      <DailyCard />
      {s.chronicle.length ? (
        <Panel>
          <p className="text-xs text-subtle">入役紀事</p>
          <ul className="mt-2 grid gap-2">
            {s.chronicle.map((line) => (
              <li key={line} className="text-sm leading-relaxed text-muted">
                {line}
              </li>
            ))}
          </ul>
        </Panel>
      ) : (
        <Panel>
          <p className="text-xs text-subtle">{s.y} 年已在役的一部分</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {serviceThisYear(s.y)
              .map((u) => u.name)
              .slice(0, 8)
              .join("、") || "這一年沒有新的制式裝備寫進名冊。舊械仍在編制裡。"}
          </p>
        </Panel>
      )}
      <Panel>
        <Resources />
        <p className="mt-3 text-xs text-subtle">
          民用 {s.civ} · 軍用 {s.mil}
          {s.modifiers.includes("isolation") ? " · 孤立主義" : ""}
          {s.modifiers.includes("purge") ? " · 軍官團受創" : ""}
          {s.modifiers.includes("rivalry") ? " · 陸海軍不和" : ""}
          {s.modifiers.includes("radar") ? " · 雷達" : ""}
        </p>
      </Panel>
      <div className="grid grid-cols-2 gap-2">
        <Btn kind="primary" testid="nav-map" onClick={() => setScreen("map")}>
          戰役
        </Btn>
        <Btn onClick={() => setScreen("focus")}>國家專注</Btn>
        <Btn onClick={() => setScreen("lecture")}>講堂</Btn>
        <Btn onClick={() => setScreen("industry")}>軍工</Btn>
      </div>
      <Panel>
        <p className="text-sm text-muted">難度可隨時改，下一場戰鬥生效。</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(["arcade", "realistic", "simulator"] as const).map((d) => (
            <Btn key={d} kind={s.difficulty === d ? "primary" : "ghost"} onClick={() => useGame.getState().setDifficulty(d)}>
              {difficultyLabel(d)}
            </Btn>
          ))}
        </div>
      </Panel>
      <div className="flex gap-2">
        <Btn
          kind="quiet"
          onClick={() => {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return;
            const a = document.createElement("a");
            a.href = URL.createObjectURL(new Blob([raw], { type: "application/json" }));
            a.download = "copper-tellurium.json";
            a.click();
          }}
        >
          匯出
        </Btn>
        <label className="inline-flex min-h-11 items-center rounded-lg px-4 text-sm text-muted">
          匯入
          <input
            type="file"
            accept="application/json"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              try {
                const data = JSON.parse(await file.text()) as { version?: number };
                if (!data || typeof data.version !== "number") throw new Error("bad");
                useGame.getState().importData(data);
              } catch {
                useGame.setState({ toast: "這份時間線讀不了。" });
              }
            }}
          />
        </label>
        <Btn kind="quiet" onClick={() => useGame.getState().abandon()}>
          捨棄時間線
        </Btn>
      </div>
    </div>
  );
}

export function Industry() {
  const s = useGame();
  const lines = projectMonth(s);
  const [filing, setFiling] = useState(false);
  return (
    <div className="grid gap-4">
      <h1 className="font-display text-3xl">軍工</h1>
      <Panel>
        <Resources />
      </Panel>
      <Panel>
        <p className="text-sm text-fg">工廠</p>
        <p className="mt-1 text-sm text-muted">民用建造與貿易，軍用變成裝備存量。轉產會花一點鋼。</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="font-mono tabular-nums">民 {s.civ}</span>
          <div className="flex gap-2">
            <Btn onClick={() => useGame.getState().convert(false)}>轉民用</Btn>
            <Btn onClick={() => useGame.getState().convert(true)}>轉軍用</Btn>
          </div>
          <span className="font-mono tabular-nums">軍 {s.mil}</span>
        </div>
      </Panel>
      <Panel>
        <p className="text-sm">貿易</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Btn onClick={() => useGame.getState().trade("oil")}>4 鋼換 3 油</Btn>
          <Btn onClick={() => useGame.getState().trade("rubber")}>4 鋼換 2 膠</Btn>
        </div>
      </Panel>
      <Panel>
        <p className="text-sm">下一個月</p>
        <ul className="mt-2 grid gap-1 text-sm text-muted">
          {lines.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <div className="mt-3 grid gap-2">
          <Btn
            kind={s.autoResearch ? "primary" : "ghost"}
            onClick={() => useGame.getState().setAutoResearch(!s.autoResearch)}
          >
            {s.autoResearch ? "推進時自動考證：開" : "推進時自動考證：關"}
          </Btn>
          <Btn
            testid="btn-month"
            kind="primary"
            disabled={filing}
            onClick={() => {
              const g = useGame.getState();
              const auto = g.autoResearch;
              const nation = g.nation;
              const layer: Layer = (["land", "air", "sea"] as const)[g.m % 3] ?? "land";
              g.advanceMonth();
              if (!auto || !nation) return;
              setFiling(true);
              void researchOnce(nation, layer, { quietCooldown: true }).finally(() => setFiling(false));
            }}
          >
            {filing ? "考證中" : "推進一個月"}
          </Btn>
        </div>
      </Panel>
    </div>
  );
}

export function Template() {
  const s = useGame();
  const [open, setOpen] = useState<string | null>(null);
  const [span, setSpan] = useState<"now" | "all">("now");
  const owned = s.owned
    .map((id) => getDef(id))
    .filter((u) => u != null);
  const shop = [...allCatalog(), ...s.extras].filter((u) => {
    if (s.owned.includes(u.id)) return false;
    if (span === "all") return true;
    if (s.extras.some((e) => e.id === u.id)) return true;
    return u.year >= s.y - 3 && u.year <= s.y + 1;
  });
  const detail = open ? getDef(open) : undefined;
  return (
    <div className="grid gap-4">
      <div>
        <h1 className="font-display text-3xl">編制</h1>
        <p className="mt-1 text-sm text-muted">六個位置。同一鋼印最多兩件。海陸空要對得上戰區。</p>
        <p className="mt-1 font-mono text-xs text-subtle">目前 {s.template.length} / 6</p>
      </div>
      <div className="grid gap-2">
        {owned.map((u) => {
          if (!u) return null;
          const count = s.template.filter((id) => id === u.id).length;
          return (
            <Panel key={u.id}>
              <button type="button" className="w-full text-left" onClick={() => setOpen(open === u.id ? null : u.id)}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">{u.name}</span>
                  <span className="text-xs text-subtle">
                    {layerName(u.layer)} · {u.year}
                    {u.year > s.y + 1 ? " · 超前" : ""}
                  </span>
                </div>
                <p className="text-xs text-muted">{u.designation}</p>
              </button>
              <div className="mt-3 flex items-center gap-2">
                <Btn onClick={() => useGame.getState().adjustTemplate(u.id, -1)}>減</Btn>
                <span className="font-mono tabular-nums">{count}</span>
                <Btn onClick={() => useGame.getState().adjustTemplate(u.id, 1)}>加</Btn>
              </div>
            </Panel>
          );
        })}
      </div>
      {detail ? (
        <Panel>
          <p className="font-display text-xl">{detail.name}</p>
          <p className="text-xs text-subtle">{detail.epithet}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{detail.history}</p>
          <p className="mt-2 text-sm text-fg">「{detail.voice}」</p>
          <p className="mt-2 text-xs text-subtle">
            {detail.skill.name}：{detail.skill.blurb}
          </p>
        </Panel>
      ) : null}
      <h2 className="font-display text-xl">可列裝</h2>
      <Btn kind={span === "now" ? "primary" : "ghost"} onClick={() => setSpan((v) => (v === "now" ? "all" : "now"))}>
        {span === "now" ? "只看前後幾年" : "全部圖紙與舊械"}
      </Btn>
      <div className="grid gap-2">
        {shop.map((u) => (
          <div key={u.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm">{u.name}</p>
              <p className="text-xs text-subtle">
                {kindName(u.kind)} · {u.year}
                {u.year > s.y + 1 ? " · 圖紙" : ""} · {buyCost(u, s.y)} 裝
              </p>
            </div>
            <Btn onClick={() => useGame.getState().buy(u.id)}>列裝</Btn>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FocusScreen() {
  const s = useGame();
  const list = FOCUSES.filter((f) => f.nation === s.nation);
  return (
    <div className="grid gap-3">
      <h1 className="font-display text-3xl">國家專注</h1>
      <p className="text-sm text-muted">一個月推進一次。標成岔路的選項會跟歷史路線互斥。</p>
      {list.map((f) => {
        const done = s.focuses.includes(f.id);
        const current = s.focusId === f.id;
        return (
          <Panel key={f.id}>
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-medium">
                {f.name}
                {f.alt ? " · 岔路" : ""}
              </h2>
              <span className="text-xs text-subtle">{done ? "完成" : current ? `剩餘 ${s.focusLeft} 月` : `${f.cost} 月`}</span>
            </div>
            <p className="mt-1 text-sm text-muted">{f.blurb}</p>
            {!done && !current ? (
              <div className="mt-3">
                <Btn onClick={() => useGame.getState().startFocus(f.id)}>開始</Btn>
              </div>
            ) : null}
          </Panel>
        );
      })}
    </div>
  );
}

export function MapScreen() {
  const s = useGame();
  const gateState = { nation: s.nation, y: s.y, m: s.m, modifiers: s.modifiers, focuses: s.focuses, won: s.won };
  return (
    <div className="grid gap-3">
      <h1 className="font-display text-3xl">戰役</h1>
      <p className="text-sm text-muted">日期沒到就打不了。美國在孤立主義結束前不能遠征。</p>
      {NODES.filter((n) => !isPrologue(n.id)).map((n) => {
        const gate = canFight(gateState, n);
        return (
          <Panel key={n.id}>
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-medium">{n.name}</h2>
              <span className="font-mono text-xs text-subtle">
                {n.y}.{String(n.m).padStart(2, "0")}
              </span>
            </div>
            <p className="mt-1 text-xs text-subtle">
              {n.theater} · {n.layers.map(layerName).join(" / ")}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{n.brief}</p>
            <p className="mt-2 text-xs text-subtle">{gate.reason}</p>
            <div className="mt-3">
              <Btn testid={`node-${n.id}`} kind="primary" disabled={!gate.ok} onClick={() => useGame.getState().startBattle(n.id)}>
                {s.won.includes(n.id) ? "再戰" : "交戰"}
              </Btn>
            </div>
          </Panel>
        );
      })}
    </div>
  );
}

export function Codex() {
  const s = useGame();
  const [nation, setNation] = useState<NationId>(s.nation ?? "us");
  const [layer, setLayer] = useState<Layer>("land");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const left = ARCHIVES.filter((a) => !s.archiveSeen.includes(a.id)).length;
  return (
    <div className="grid gap-4">
      <div>
        <h1 className="font-display text-3xl">檔案室</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          館藏一次揭一件。即時考證沒有件數上限，但每次只問一件、且要歇一下，避免一次燒光配額。考到的裝備進編制，用裝備存量列裝。鋼印是成年軍官的聲音。
        </p>
      </div>
      <Panel>
        <p className="text-sm">館藏還剩 {left} 件</p>
        <div className="mt-3">
          <Btn testid="btn-archive" kind="primary" onClick={() => useGame.getState().revealArchive()}>
            揭開下一件（4 裝）
          </Btn>
        </div>
      </Panel>
      <Panel>
        <p className="text-sm">即時考證</p>
        <p className="mt-1 text-xs text-subtle">已考證 {s.aiCount} 件。可一直問下去。</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="grid gap-1 text-xs text-subtle">
            國家
            <select
              className="min-h-11 rounded-lg border border-line bg-bg px-2 text-sm text-fg"
              value={nation}
              onChange={(e) => setNation(e.target.value as NationId)}
            >
              {(Object.keys(NATIONS) as NationId[]).map((id) => (
                <option key={id} value={id}>
                  {NATIONS[id].name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs text-subtle">
            領域
            <select
              className="min-h-11 rounded-lg border border-line bg-bg px-2 text-sm text-fg"
              value={layer}
              onChange={(e) => setLayer(e.target.value as Layer)}
            >
              <option value="land">陸</option>
              <option value="air">空</option>
              <option value="sea">海</option>
            </select>
          </label>
        </div>
        <div className="mt-3">
          <Btn
            testid="btn-ai"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              setNote("");
              void researchOnce(nation, layer)
                .then((res) => {
                  if (!res.ok) setNote(res.error);
                  else setNote(`已考證：${res.name}。${res.history}`);
                })
                .finally(() => setBusy(false));
            }}
          >
            {busy ? "查閱中" : "考證一件"}
          </Btn>
        </div>
        {note ? <p className="mt-3 text-sm leading-relaxed text-muted">{note}</p> : null}
      </Panel>
      <div className="grid gap-2">
        {s.extras.map((u) => (
          <Panel key={u.id}>
            <p className="font-medium">{u.name}</p>
            <p className="text-xs text-subtle">
              {u.designation} · {u.year} · {NATIONS[u.nation].name}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{u.history}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}

export function Lecture() {
  const claimed = useGame((s) => s.lectureClaimed);
  const [pick, setPick] = useState<Record<number, number>>({});
  return (
    <div className="grid gap-4">
      <div>
        <p className="text-xs text-subtle">講堂 · 風格取自袁騰飛的歷史講授，不是官方課程</p>
        <h1 className="font-display text-3xl">諸兵種，不是名冊</h1>
      </div>
      <h2 className="text-sm text-subtle">專家大致共用的五個模型</h2>
      {MODELS.map((m) => (
        <Panel key={m.t}>
          <h3 className="font-medium">{m.t}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">{m.d}</p>
        </Panel>
      ))}
      <h2 className="text-sm text-subtle">三個真正的分歧</h2>
      {DISPUTES.map((d) => (
        <Panel key={d.t}>
          <h3 className="font-medium">{d.t}</h3>
          <p className="mt-2 text-sm leading-relaxed text-fg">{d.a}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{d.b}</p>
        </Panel>
      ))}
      <h2 className="text-sm text-subtle">十個能分開背誦與理解的問題</h2>
      {QUIZ.map((q, i) => (
        <Panel key={q.q}>
          <p className="text-sm leading-relaxed">{q.q}</p>
          <div className="mt-2 grid gap-2">
            {q.choices.map((c, ci) => (
              <Btn key={c} kind={pick[i] === ci ? "primary" : "ghost"} onClick={() => setPick((p) => ({ ...p, [i]: ci }))}>
                {c}
              </Btn>
            ))}
          </div>
          {pick[i] != null ? <p className="mt-2 text-sm text-muted">{q.why}</p> : null}
        </Panel>
      ))}
      <Btn kind="primary" disabled={claimed} onClick={() => useGame.getState().claimLecture()}>
        {claimed ? "筆記已收下" : "我讀完了"}
      </Btn>
    </div>
  );
}

export function Debrief() {
  const result = useGame((s) => s.lastResult);
  const [busy, setBusy] = useState(false);
  const nation = useGame((s) => s.nation);
  if (!result) return null;
  const q = QUIZ[result.quiz];
  return (
    <div className="grid gap-4">
      <p className="text-xs text-subtle">{result.win ? "戰報" : "中止"}</p>
      <h1 className="font-display text-3xl">{result.name}</h1>
      <Panel>
        <p className="text-sm leading-relaxed">{result.bulletin}</p>
        <div className="mt-3">
          <Btn
            disabled={busy}
            onClick={() => {
              const s = useGame.getState();
              if (Date.now() - s.lastAiAt < 40000) {
                useGame.setState({ toast: "檔案室需要歇一下。" });
                return;
              }
              setBusy(true);
              void writeBulletin({
                data: {
                  headline: result.name,
                  win: result.win,
                  nation: nation ? NATIONS[nation].name : "觀察員",
                },
              })
                .then((res) => {
                  if (!res.ok) useGame.setState({ toast: res.error });
                  else useGame.getState().setBulletin(res.text);
                })
                .catch(() => useGame.setState({ toast: "戰報沒有寫成。" }))
                .finally(() => setBusy(false));
            }}
          >
            {busy ? "撰寫中" : "請檔案室改寫戰報"}
          </Btn>
        </div>
      </Panel>
      {result.reward ? (
        <p className="font-mono text-sm tabular-nums text-muted">
          鋼 +{result.reward.steel} · 裝 +{result.reward.eq} · 政 +{result.reward.pp} · 油 +{result.reward.oil}
        </p>
      ) : (
        <p className="text-sm text-muted">{result.win ? "這場不再發獎。" : "人力與補給受損。"}</p>
      )}
      <Panel>
        {result.lines.map((l) => (
          <p key={l} className="text-xs leading-relaxed text-muted">
            {l}
          </p>
        ))}
      </Panel>
      {q ? (
        <Panel>
          <p className="text-sm leading-relaxed">{q.q}</p>
          <div className="mt-2 grid gap-2">
            {q.choices.map((c, i) => (
              <Btn key={c} kind={result.picked === i ? "primary" : "ghost"} disabled={result.picked !== null} onClick={() => useGame.getState().pickQuiz(i)}>
                {c}
              </Btn>
            ))}
          </div>
          {result.picked !== null ? (
            <p className="mt-2 text-sm text-muted">
              {result.picked === q.a ? "這是結構，不是口號。" : "再看一次解釋。"} {q.why}
            </p>
          ) : null}
        </Panel>
      ) : null}
      {isPrologue(result.nodeId) && !nation ? (
        result.win ? (
          nextPrologue(result.nodeId) ? (
            <Btn
              testid="btn-back-map"
              kind="primary"
              onClick={() => useGame.getState().startBattle(nextPrologue(result.nodeId)!)}
            >
              下一章 · {getNode(nextPrologue(result.nodeId)!)?.name}
            </Btn>
          ) : (
            <Btn testid="btn-back-map" kind="primary" onClick={() => useGame.getState().setScreen("nation")}>
              選擇國家
            </Btn>
          )
        ) : (
          <Btn testid="btn-back-map" kind="primary" onClick={() => useGame.getState().startBattle(result.nodeId)}>
            再攻一次
          </Btn>
        )
      ) : (
        <Btn testid="btn-back-map" kind="primary" onClick={() => useGame.getState().setScreen("map")}>
          回到戰役
        </Btn>
      )}
    </div>
  );
}

export function Title({ onStart }: { onStart: () => void }) {
  const difficulty = useGame((s) => s.difficulty);
  const nation = useGame((s) => s.nation);
  const muted = useGame((s) => s.muted);
  return (
    <div className="grid min-h-full content-between gap-8">
      <div>
        <p className="text-xs tracking-widest text-accent">Cu · Te</p>
        <img
          src={`${import.meta.env.BASE_URL}banner.jpg`}
          alt=""
          className="mt-3 aspect-video w-full rounded-3xl object-cover"
        />
        <h1 className="mt-3 font-display text-4xl leading-none">
          Copper
          <span className="block">and Tellurium</span>
        </h1>
        <p className="mt-2 text-sm text-muted">銅與碲</p>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
          從一九一四年的步槍與機槍，走到噴射機、核威懾與無人機。海陸空仍互相決定命中。劇本每天換一頁，只引用真實軍武。
        </p>
        <div className="mt-4">
          <DailyCard />
        </div>
      </div>
      <div className="grid gap-3">
        <div className="grid grid-cols-3 gap-2">
          {(["arcade", "realistic", "simulator"] as const).map((d) => (
            <Btn key={d} testid={`diff-${d}`} kind={difficulty === d ? "primary" : "ghost"} onClick={() => useGame.getState().setDifficulty(d)}>
              {difficultyLabel(d)}
            </Btn>
          ))}
        </div>
        <p className="text-xs leading-relaxed text-subtle">{DIFFICULTY_COPY[difficulty]}</p>
        <Btn testid="btn-start" kind="primary" onClick={onStart}>
          從一九一四年開始
        </Btn>
        {nation ? (
          <Btn testid="btn-continue" onClick={() => useGame.getState().setScreen("hq")}>
            繼續 {NATIONS[nation].name}
          </Btn>
        ) : null}
        <Btn kind="quiet" onClick={() => useGame.getState().toggleMute()}>
          {muted ? "聲音關" : "聲音開"}
        </Btn>
      </div>
    </div>
  );
}

export function Story() {
  const step = useGame((s) => s.story);
  const page = STORY[Math.min(step, STORY.length - 1)]!;
  return (
    <div className="grid min-h-full content-between gap-8">
      <div>
        <p className="font-mono text-xs text-subtle">
          0{Math.min(step, STORY.length - 1) + 1} / 0{STORY.length}
        </p>
        <p className="mt-6 text-xs text-subtle">{page.k}</p>
        <h1 className="mt-2 font-display text-4xl leading-tight">{page.t}</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">{page.b}</p>
      </div>
      <Btn testid="btn-story" kind="primary" onClick={() => useGame.getState().nextStory()}>
        {step >= STORY.length - 1 ? "進入馬恩河" : "繼續"}
      </Btn>
    </div>
  );
}

export function NationPick() {
  const ids = Object.keys(NATIONS) as NationId[];
  return (
    <div className="grid gap-4">
      <div>
        <h1 className="font-display text-3xl">選擇國家</h1>
        <p className="mt-2 text-sm text-muted">1936 的家底不會預先發放 1944 的名車。想要虎式、野馬或大和，就得把工廠轉起來。</p>
      </div>
      <div className="grid gap-2">
        {ids.map((id) => (
          <button
            key={id}
            type="button"
            data-testid={`nation-${id}`}
            onClick={() => useGame.getState().chooseNation(id)}
            className="rounded-3xl border border-line bg-surface p-4 text-left"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-medium">{NATIONS[id].name}</span>
              <span className="text-xs text-subtle">{NATIONS[id].trait}</span>
            </div>
            <p className="mt-1 text-sm text-muted">{NATIONS[id].blurb}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
