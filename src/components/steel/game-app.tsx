import { useEffect } from "react";
import { BookOpen, Map, ScrollText } from "lucide-react";
import { unlockAudio } from "@/game/sfx";
import { useGame } from "@/game/store";
import type { Screen } from "@/game/types";
import { BattleView } from "./battle-view";
import { Hero30 } from "./hero30";
import { Codex, Debrief, FocusScreen, Gallery, History, Hq, Industry, Lecture, MapScreen, NationPick, Story, Template, Title } from "./screens";

const NAV: { id: Screen; label: string; icon: typeof Map }[] = [
  { id: "map", label: "出擊", icon: Map },
  { id: "history", label: "歷史", icon: ScrollText },
  { id: "gallery", label: "鑑賞", icon: BookOpen },
];

export function GameApp() {
  const screen = useGame((s) => s.screen);
  const toast = useGame((s) => s.toast);
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);
  const showNav = screen === "map" || screen === "history" || screen === "gallery";
  return (
    <div className="phone-stage text-fg">
      <div className="phone-shell">
        {screen === "battle" ? (
          <BattleView />
        ) : screen === "hero30" ? (
          <Hero30 />
        ) : (
          <>
            <div className="phone-scroll">
              {toast ? (
                <button
                  type="button"
                  className="mb-3 w-full rounded-2xl border border-line bg-elevated px-3 py-3 text-left text-sm"
                  onClick={() => useGame.getState().clearToast()}
                >
                  {toast}
                </button>
              ) : null}
              {screen === "title" && <Title onStart={() => useGame.getState().beginStory()} />}
              {screen === "story" && <Story />}
              {screen === "nation" && <NationPick />}
              {screen === "hq" && <Hq />}
              {screen === "industry" && <Industry />}
              {screen === "template" && <Template />}
              {screen === "focus" && <FocusScreen />}
              {screen === "map" && <MapScreen />}
              {screen === "history" && <History />}
              {screen === "gallery" && <Gallery />}
              {screen === "codex" && <Codex />}
              {screen === "lecture" && <Lecture />}
              {screen === "debrief" && <Debrief />}
            </div>
            {showNav ? (
              <nav className="phone-nav">
                {NAV.map((item) => {
                  const Icon = item.icon;
                  const on = screen === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-testid={`tab-${item.id}`}
                      onClick={() => useGame.getState().setScreen(item.id)}
                      className={`flex min-h-14 min-w-14 shrink-0 flex-1 flex-col items-center justify-center gap-1 text-xs ${on ? "text-fg" : "text-subtle"}`}
                    >
                      <Icon className={`size-4 ${on ? "text-accent" : "text-subtle"}`} aria-hidden />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}