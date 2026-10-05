import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GameApp } from "@/components/steel/game-app";
import { useGame } from "@/game/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void Promise.resolve(useGame.persist.rehydrate()).finally(() => setReady(true));
  }, []);
  if (!ready) {
    return (
      <main className="grid min-h-dvh place-items-center bg-bg text-fg">
        <p className="font-display text-2xl">Copper and Tellurium</p>
      </main>
    );
  }
  return <GameApp />;
}
