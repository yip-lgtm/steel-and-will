import { ARCHIVES, UNITS, fromDossier } from "@/game/catalog";
import { useGame } from "@/game/store";
import type { Layer, NationId } from "@/game/types";
import { requestEquipment } from "@/lib/dossier.functions";

const COOLDOWN_MS = 20000;

export async function researchOnce(
  nation: NationId,
  layer: Layer,
  opts?: { quietCooldown?: boolean },
): Promise<{ ok: true; name: string; history: string } | { ok: false; error: string }> {
  const s = useGame.getState();
  if (Date.now() - s.lastAiAt < COOLDOWN_MS) {
    const error = "檔案室需要歇一下。";
    if (!opts?.quietCooldown) useGame.setState({ toast: error });
    return { ok: false, error };
  }
  useGame.getState().markAi();
  const avoid = [...UNITS.map((u) => u.name), ...s.extras.map((u) => u.name), ...ARCHIVES.map((a) => a.name)];
  try {
    const res = await requestEquipment({ data: { nation, layer, avoid, year: s.y } });
    if (!res.ok) {
      useGame.setState({ toast: res.error });
      return res;
    }
    const id = `ai-${res.dossier.year}-${Math.random().toString(36).slice(2, 7)}`;
    const before = useGame.getState().aiCount;
    useGame.getState().acceptAi(fromDossier({ ...res.dossier, id }));
    if (useGame.getState().aiCount === before) {
      const error = useGame.getState().toast ?? "這件已經在庫裡。";
      return { ok: false, error };
    }
    return { ok: true, name: res.dossier.name, history: res.dossier.history };
  } catch {
    const error = "考證失敗。";
    useGame.setState({ toast: error });
    return { ok: false, error };
  }
}
