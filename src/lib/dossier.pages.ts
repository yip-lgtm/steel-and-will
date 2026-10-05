/** Static GitHub Pages build: there is no server, so the archive room stays closed. */

export function requestEquipment(_input?: unknown): Promise<{ ok: false; error: string }> {
  return Promise.resolve({ ok: false, error: "這個網址沒有接通檔案室。館藏仍可逐件揭開。" });
}

export function writeBulletin(_input?: unknown): Promise<{ ok: false; error: string }> {
  return Promise.resolve({ ok: false, error: "這個網址沒有接通檔案室。" });
}

export function dailyScript(_input?: unknown): Promise<{ ok: false; error: string }> {
  return Promise.resolve({ ok: false, error: "這個網址沒有接通檔案室。今日劇本改用真實軍武索引。" });
}
