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

function answerText(raw: string) {
  return raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

async function chat(prompt: string, maxTokens: number): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) return { ok: false, error: "沒有 MiniMax 金鑰。今日改用真實索引。" };
  const base = (process.env.MINIMAX_BASE_URL || "https://api.minimax.io/v1").replace(/\/$/, "");
  const model = process.env.MINIMAX_MODEL || "MiniMax-M2.7-highspeed";
  let res: Response;
  try {
    res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_completion_tokens: Math.max(maxTokens * 3, 900),
        messages: [
          { role: "system", content: "You write Traditional Chinese for a war-history game. Reply with only what the user asked for. No preface." },
          { role: "user", content: prompt },
        ],
      }),
    });
  } catch {
    return { ok: false, error: "MiniMax 暫時無法連線。" };
  }
  if (!res.ok) return { ok: false, error: `MiniMax 拒絕了請求（${res.status}）。` };
  const body = (await res.json()) as {
    choices?: { message?: { content?: string; reasoning_content?: string } }[];
  };
  const message = body.choices?.[0]?.message;
  const text = answerText(message?.content ?? "") || answerText(message?.reasoning_content ?? "");
  if (!text) return { ok: false, error: "MiniMax 沒有寫下任何東西。" };
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
    year: clamp(Number(input?.year) || 1942, 1886, 2030),
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
Prefer a real system that entered service within 8 years of ${data.year}. The span is firearms and machine guns through armor, aircraft, ships, missiles, nuclear delivery vehicles, and real UAVs or flight-tested autonomous-wingman prototypes.
If the year is after 2026, only name a system that is already in service or has actually flown. Do not invent future physics.
Nuclear systems may be named only as deterrents. Do not describe design, yield calculation, or how to build or use one. Say the game does not simulate the detonation.
UAVs must be real designations. Software may assist sensing. Do not claim a weapon decides to fire by itself.
If that country had little in that domain then, pick the closest real system and keep its true introduction year.
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
    const year = clamp(Number(parsed.year) || 1942, 1860, 2030);
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

const PROLIF = ["離心機", "濃縮鈾", "內爆", "裝藥設計", "當量計算", "製作方法"];

export const dailyScript = createServerFn({ method: "POST" })
  .validator((input: { date?: string }) => {
    const date = strip(input?.date, 10);
    return { date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "1970-01-01" };
  })
  .handler(async ({ data }): Promise<{ ok: true; k: string; t: string; b: string } | { ok: false; error: string }> => {
    const day = Number(data.date.slice(8, 10));
    const future = day % 10 === 7;
    const prompt = future
      ? `Today is ${data.date}. Write ONE near-future story page for a war-history game. Traditional Chinese. The scene may be set a few years ahead, but every weapon you name must already be in service or have actually flown (rifles, armor, jets, ships, missiles, nuclear deterrents, UAVs, flight-tested wingman drones). Do not invent new physics or a new weapon. Do not explain how to build or use a nuclear weapon or a drone. Do not describe civilian casualties. Software may help sensing; a human still decides to fire. 90-140 characters in field b.
JSON only: {"k":"short era label","t":"title at most 12 Chinese characters","b":"..."}`
      : `Today is ${data.date}. Write ONE new sober story page for a war-history game covering 1914 through the present. Traditional Chinese. Pick a real campaign or a real weapon somewhere on the span from firearms and machine guns through artillery, tanks, aircraft, ships, missiles, nuclear deterrence, and real UAVs. Name the real designation. No slogans, no anime, no how-to, no nuclear design, no civilian targeting. 90-140 characters in field b.
JSON only: {"k":"year or campaign label","t":"title at most 12 Chinese characters","b":"..."}`;
    const result = await chat(prompt, 400);
    if (!result.ok) return result;
    let parsed: Record<string, unknown>;
    try {
      parsed = readJson(result.text) as Record<string, unknown>;
    } catch {
      return { ok: false, error: "今日劇本無法讀取。" };
    }
    const k = strip(parsed.k, 24);
    const t = strip(parsed.t, 16);
    const b = strip(parsed.b, 180);
    if (!k || !t || !b || banned(`${k} ${t} ${b}`) || PROLIF.some((w) => `${k} ${t} ${b}`.includes(w))) {
      return { ok: false, error: "今日劇本沒有通過審稿。" };
    }
    return { ok: true, k, t, b };
  });

