import { createServerFn } from "@tanstack/react-start";

const NATIONS = ["de", "us", "ussr", "uk", "jp", "cn", "fr", "it", "se", "il"] as const;
const LAYERS = ["air", "land", "sea"] as const;
const KINDS = [
  "fighter",
  "bomber",
  "tank",
  "artillery",
  "infantry",
  "battleship",
  "carrier",
  "submarine",
  "cruiser",
  "destroyer",
] as const;

type Nation = (typeof NATIONS)[number];
type Layer = (typeof LAYERS)[number];
type Kind = (typeof KINDS)[number];

export type DossierDto = {
  name: string;
  designation: string;
  nation: Nation;
  layer: Layer;
  kind: Kind;
  year: number;
  epithet: string;
  history: string;
  voice: string;
  pen: number;
  armor: number;
  skillName: string;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function strip(s: unknown, max: number) {
  return String(s ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

const BANNED = ["艦これ", "碧藍航線", "艦娘", "小學生", "幼女", "萝莉", "蘿莉"];

function banned(text: string) {
  return BANNED.some((w) => text.includes(w));
}

async function chat(prompt: string, maxTokens: number): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, error: "此環境沒有接通檔案室，館藏仍可逐件揭開。" };
  let res: Response;
  try {
    res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.3,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } catch {
    return { ok: false, error: "檔案室暫時無法連線。" };
  }
  if (!res.ok) return { ok: false, error: `檔案室拒絕了請求（${res.status}）。` };
  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = body.choices?.[0]?.message?.content ?? "";
  if (!text) return { ok: false, error: "檔案室沒有寫下任何東西。" };
  return { ok: true, text };
}

function readJson(text: string): unknown {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence?.[1] ?? text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("bad json");
  return JSON.parse(raw.slice(start, end + 1));
}

export const requestEquipment = createServerFn({ method: "POST" })
  .validator((input: { nation: string; layer: string; avoid: string[]; year?: number }) => ({
    nation: (NATIONS as readonly string[]).includes(input?.nation) ? (input.nation as Nation) : "us",
    layer: (LAYERS as readonly string[]).includes(input?.layer) ? (input.layer as Layer) : "land",
    avoid: Array.isArray(input?.avoid) ? input.avoid.map((s) => strip(s, 60)).slice(0, 80) : [],
    year: clamp(Number(input?.year) || 1942, 1905, 1973),
  }))
  .handler(async ({ data }): Promise<{ ok: true; dossier: DossierDto } | { ok: false; error: string }> => {
    const nationName: Record<Nation, string> = {
      de: "Germany",
      us: "United States",
      ussr: "Soviet Union",
      uk: "United Kingdom",
      jp: "Japan",
      cn: "China",
      fr: "France",
      it: "Italy",
      se: "Sweden",
      il: "Israel (post-1945 equipment is allowed and must be labeled with its real service year)",
    };
    const prompt = `You are a military historian. Return ONE real historically documented weapon, vehicle, ship, or aircraft that served or was a real ordered design (paper projects that were officially drawn are allowed; fantasy is not).
Country focus: ${nationName[data.nation]}.
Domain: ${data.layer}.
Prefer a real system that entered service within 8 years of ${data.year}. If that country had little in that domain then, pick the closest real system and keep its true introduction year.
Do NOT use any of these names: ${data.avoid.join(" | ") || "(none)"}.
Do NOT invent anime characters. Adults only if you mention crews. No slurs.
Respond with JSON only:
{"name":"Traditional Chinese short name","designation":"official alphanumeric","nation":"${data.nation}","layer":"${data.layer}","kind":"fighter|bomber|tank|artillery|infantry|battleship|carrier|submarine|cruiser|destroyer","year":1942,"epithet":"4-8 Traditional Chinese characters","history":"40-90 Traditional Chinese characters, one sober historical fact","voice":"one short Traditional Chinese line an adult officer might say","pen":80,"armor":40,"skillName":"2-6 Traditional Chinese characters"}
pen and armor are game scales, 10 to 160, heavier armor and bigger guns higher.`;
    const result = await chat(prompt, 500);
    if (!result.ok) return result;
    let parsed: Record<string, unknown>;
    try {
      parsed = readJson(result.text) as Record<string, unknown>;
    } catch {
      return { ok: false, error: "考證稿無法讀取，請再試一次。" };
    }
    const name = strip(parsed.name, 24);
    const history = strip(parsed.history, 120);
    const voice = strip(parsed.voice, 40);
    const designation = strip(parsed.designation, 48);
    const blob = `${name} ${history} ${voice} ${designation}`;
    if (!name || !history || banned(blob)) return { ok: false, error: "這份考證不合格，已丟棄。" };
    if (data.avoid.some((n) => n === name || n === designation)) return { ok: false, error: "這件裝備已在庫中。" };
    const kind = KINDS.includes(parsed.kind as Kind) ? (parsed.kind as Kind) : data.layer === "air" ? "fighter" : data.layer === "sea" ? "destroyer" : "tank";
    const year = clamp(Number(parsed.year) || 1942, 1900, 1975);
    const dossier: DossierDto = {
      name,
      designation: designation || name,
      nation: data.nation,
      layer: data.layer,
      kind,
      year,
      epithet: strip(parsed.epithet, 16) || "考證",
      history,
      voice: voice || "對準要害。",
      pen: clamp(Number(parsed.pen) || 40, 10, 160),
      armor: clamp(Number(parsed.armor) || 30, 8, 160),
      skillName: strip(parsed.skillName, 12) || "齊射",
    };
    return { ok: true, dossier };
  });

export const writeBulletin = createServerFn({ method: "POST" })
  .validator((input: { headline: string; win: boolean; nation: string }) => ({
    headline: strip(input?.headline, 40),
    win: Boolean(input?.win),
    nation: strip(input?.nation, 20),
  }))
  .handler(async ({ data }): Promise<{ ok: true; text: string } | { ok: false; error: string }> => {
    const prompt = `Write a 70-110 character Traditional Chinese military communique, sober, no slogans, no anime, about this battle result.
Battle: ${data.headline}. Nation: ${data.nation}. Outcome: ${data.win ? "objective taken" : "attack broken off"}.
Mention logistics or a weapon system only if it fits. No hashtags. Plain prose only.`;
    const result = await chat(prompt, 220);
    if (!result.ok) return result;
    const text = strip(result.text.replace(/[#*`]/g, ""), 160);
    if (!text || banned(text)) return { ok: false, error: "戰報沒有通過審稿。" };
    return { ok: true, text };
  });
