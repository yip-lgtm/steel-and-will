import { dailyScript } from "@/lib/dossier.functions";

export type DailyPage = {
  date: string;
  k: string;
  t: string;
  b: string;
  source: "llm" | "desk";
};

const KEY = "cute-daily-script";

const KIT: { y: number; name: string; note: string }[] = [
  { y: 1886, name: "勒貝爾步槍", note: "無煙火藥讓步兵射擊不再用一團白煙暴露自己" },
  { y: 1898, name: "毛瑟 98", note: "栓動步槍精準，班的火力仍要靠機槍" },
  { y: 1908, name: "MG08", note: "馬克沁機槍把衝鋒釘在鐵絲網前" },
  { y: 1916, name: "馬克 I 型", note: "菱形戰車為了越壕，故障淘汰的不比砲火少" },
  { y: 1917, name: "雷諾 FT", note: "旋轉砲塔成為後來戰車的語法" },
  { y: 1941, name: "T-34", note: "斜面裝甲與產量比單車決鬥更能解釋東線" },
  { y: 1942, name: "虎式", note: "88 公厘穿深高，重量帶來故障與油耗" },
  { y: 1944, name: "P-51", note: "長程護航改變的是損失率能不能被工業補上" },
  { y: 1945, name: "核武", note: "廣島與長崎之後，大國直接對撞的天花板變了。這裡不計算爆心，也不寫製造" },
  { y: 1947, name: "AK-47", note: "中間威力彈與寬容公差，把步兵連發變成普通裝備" },
  { y: 1949, name: "米格-15", note: "後掠翼噴射戰鬥機，朝鮮空戰的一邊" },
  { y: 1949, name: "F-86", note: "雷達槍瞄與飛行員經驗，和後掠翼同樣算數" },
  { y: 1955, name: "B-52", note: "戰略轟炸機靠改裝活過半個世紀" },
  { y: 1970, name: "民兵 III", note: "陸基洲際飛彈是威懾，不是這一關的戰術砲" },
  { y: 1973, name: "T-72", note: "大量生產的主戰戰車，彈藥布置是被擊穿後的風險" },
  { y: 1980, name: "M1 艾布蘭", note: "複合裝甲與夜視，1991 年仍要看訓練和後勤" },
  { y: 1981, name: "俄亥俄級", note: "彈道飛彈潛艦的價值是不容易被一次打光" },
  { y: 2005, name: "海馬斯", note: "輪式火箭砲吃的是座標與彈藥，不是口號" },
  { y: 2007, name: "MQ-9", note: "遠端駕駛的察打無人機，衛星鏈路斷了就不是武器" },
  { y: 2015, name: "F-35", note: "低可探測性與感測器融合，維修工時也是戰力" },
  { y: 2017, name: "殲-20", note: "中國列裝的低可探測戰鬥機，仍要看掛載、數量與體系" },
  { y: 2019, name: "XQ-58", note: "已試飛的僚機驗證機。目標識別可以有軟體，開火權仍是人的制度" },
];

const WARS: { y: number; name: string; note: string }[] = [
  { y: 1914, name: "馬恩河", note: "鐵路把預備隊送進缺口，比白刃先決定這一週" },
  { y: 1916, name: "索姆河", note: "機槍和鐵絲網吃掉沒有砲兵準備的衝鋒" },
  { y: 1916, name: "日德蘭", note: "戰巡的致命傷常常是彈藥庫，不是船體慢慢磨光" },
  { y: 1917, name: "康布雷", note: "集中的戰車能撕開口，沒有步兵和補給時缺口會合上" },
  { y: 1940, name: "不列顛", note: "戰鬥機航程護不住轟炸機的往返" },
  { y: 1942, name: "中途島", note: "艦載機的搜索窗口比巨砲的射程先到" },
  { y: 1943, name: "庫爾斯克", note: "已知的進攻撞上縱深、地雷與數量" },
  { y: 1944, name: "諾曼第", note: "艦砲、灘頭和制空權是同一天的三層" },
  { y: 1950, name: "朝鮮", note: "噴射機與二戰剩餘戰車同時在場" },
  { y: 1965, name: "越南", note: "直升機與防空飛彈改寫機動，地面仍要人去佔領" },
  { y: 1973, name: "贖罪日", note: "反戰車飛彈讓沒有步兵的戰車很貴" },
  { y: 1991, name: "沙漠風暴", note: "夜視與制空權沒有取消油料和備件" },
  { y: 2022, name: "烏克蘭", note: "察打無人機、巡飛彈與砲兵偵察並存，防空和電子戰讓天空不便宜" },
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function todayKey(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Hong_Kong" }).format(new Date());
}

export function deskPage(date: string): DailyPage {
  const h = hash(date);
  const day = Number(date.slice(8, 10));
  const kit = KIT[h % KIT.length]!;
  const war = WARS[(h >>> 8) % WARS.length]!;
  const future = day % 10 === 7;
  if (future) {
    return {
      date,
      source: "desk",
      k: `${date} · 未來桌`,
      t: "只寫已經存在的",
      b: `${date} 的未來頁不准發明新物理。今日索引 ${kit.name}（${kit.y}）：${kit.note}。軟體可以幫忙看畫面，開火仍是人的決定。油、鏈路和維修沒有消失。`,
    };
  }
  return {
    date,
    source: "desk",
    k: `${date} · ${war.y}`,
    t: war.name,
    b: `${war.name}（${war.y}）：${war.note}。同日軍武是 ${kit.name}（${kit.y}）：${kit.note}。從火器到核威懾與無人機，這一頁換組合，不換事實。`,
  };
}

function remember(page: DailyPage): DailyPage {
  try {
    localStorage.setItem(KEY, JSON.stringify(page));
  } catch {
    /* private mode */
  }
  return page;
}

export async function loadDaily(): Promise<DailyPage> {
  const date = todayKey();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as DailyPage;
      if (saved.date === date && saved.source === "llm" && saved.b) return saved;
    }
  } catch {
    /* ignore broken cache */
  }
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}daily.json`, { cache: "no-store" });
    if (res.ok) {
      const page = (await res.json()) as DailyPage;
      if (page.date === date && page.b) return remember({ date, k: page.k, t: page.t, b: page.b, source: "llm" });
    }
  } catch {
    /* no published page yet */
  }
  try {
    const res = await dailyScript({ data: { date } });
    if (res.ok) return remember({ date, k: res.k, t: res.t, b: res.b, source: "llm" });
  } catch {
    /* static build or offline archive */
  }
  return deskPage(date);
}
