import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { GameApp } from "@/components/steel/game-app";
import { useGame } from "@/game/store";
import "./styles.css";

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

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Home />
    </StrictMode>,
  );
}
