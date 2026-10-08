import type { Difficulty, Kind, Layer, ModuleKey, NationId, SkillDef, SkillId, UnitDef } from "./types";
import { ARMS } from "./arms";

const pub = (file: string) => `${import.meta.env.BASE_URL}${file}`;

export type FocusDef = {
  id: string;
  nation: NationId;
  name: string;
  cost: number;
  req: string[];
  alt: boolean;
  blurb: string;
  exclusive?: string[];
};

export type NodeDef = {
  id: string;
  name: string;
  y: number;
  m: number;
  theater: string;
  layers: Layer[];
  brief: string;
  axis: string[];
  allies: string[];
  axisNations: NationId[];
  alliedNations: NationId[];
  reward: { steel: number; eq: number; pp: number; oil: number };
  fixedPlayer?: string[];
  fixedEnemy?: string[];
};

export type Gate = {
  nation: NationId | null;
  y: number;
  m: number;
  modifiers: string[];
  focuses: string[];
  won: string[];
};

const sk = (id: SkillId, name: string, blurb: string, energy: number): SkillDef => ({
  id,
  name,
  blurb,
  energy,
});

const SALVO = sk("salvo", "校準齊射", "下一發傷害提高。", 2);

type Seed = {
  id: string;
  name: string;
  designation: string;
  epithet?: string;
  nation: NationId;
  layer: Layer;
  kind: Kind;
  year: number;
  speed?: "fast" | "slow";
  pen: number;
  armor: number;
  rof?: number;
  rounds?: number;
  targets?: Layer[];
  skill?: SkillDef;
  passive?: UnitDef["passive"];
  voice?: string;
  history: string;
  portrait?: string;
};

function unit(p: Seed): UnitDef {
  const slow =
    p.speed ??
    (p.kind === "battleship" || p.kind === "artillery" || p.armor >= 100 ? "slow" : "fast");
  const targets =
    p.targets ??
    (p.layer === "air"
      ? p.kind === "fighter"
        ? (["air", "land"] as Layer[])
        : (["air", "land", "sea"] as Layer[])
      : p.kind === "battleship"
        ? (["sea", "land"] as Layer[])
        : [p.layer]);
  return {
    id: p.id,
    name: p.name,
    designation: p.designation,
    epithet: p.epithet ?? "鋼印",
    nation: p.nation,
    layer: p.layer,
    kind: p.kind,
    year: p.year,
    speed: slow,
    pen: p.pen,
    armor: p.armor,
    rof: p.rof ?? (p.layer === "air" ? 2.3 : p.layer === "sea" ? 4.6 : 3.2),
    rounds: p.rounds ?? 16,
    targets,
    skill: p.skill ?? SALVO,
    passive: p.passive,
    voice: p.voice ?? "打要害。輪廓不算數。",
    history: p.history,
    portrait: p.portrait,
  };
}

export const UNITS: UnitDef[] = [
  unit({
    id: "ft",
    name: "雷諾 FT",
    designation: "Renault FT",
    epithet: "旋轉砲塔的祖先",
    nation: "fr",
    layer: "land",
    kind: "tank",
    year: 1917,
    pen: 34,
    armor: 22,
    history: "一戰量產輕戰車。可旋轉砲塔成為後來戰車的基本語法，而不是移動碉堡。",
    portrait: pub("portraits/ft.jpg"),
  }),
  unit({
    id: "a7v",
    name: "A7V",
    designation: "Sturmpanzerwagen A7V",
    epithet: "會動的箱子",
    nation: "de",
    layer: "land",
    kind: "tank",
    year: 1918,
    speed: "slow",
    pen: 36,
    armor: 36,
    history: "德國一戰少量超重突擊車，乘員擁擠，越壕能力差。數量從來沒有贏過結構。",
    portrait: pub("portraits/a7v.jpg"),
  }),
  unit({
    id: "lebel",
    name: "勒貝爾班",
    designation: "Lebel / Berthier",
    epithet: "管狀彈倉",
    nation: "fr",
    layer: "land",
    kind: "infantry",
    year: 1886,
    pen: 18,
    armor: 8,
    skill: sk("repair", "掩體整補", "恢復自身機動與兵員。", 2),
    history: "法國一戰步兵的底色。單兵射速打不開鐵絲網，缺口要靠砲兵與鐵路送來的預備隊。",
    portrait: pub("portraits/lebel.jpg"),
  }),
  unit({
    id: "g98",
    name: "毛瑟 98 班",
    designation: "Gewehr 98",
    epithet: "五發栓動",
    nation: "de",
    layer: "land",
    kind: "infantry",
    year: 1898,
    pen: 20,
    armor: 8,
    history: "德軍一戰制式步槍。精準，但班的火力來自機槍，不是排隊齊射。",
    portrait: pub("portraits/g98.jpg"),
  }),
  unit({
    id: "mg08",
    name: "MG08 組",
    designation: "MG 08",
    epithet: "鐵絲網的夥伴",
    nation: "de",
    layer: "land",
    kind: "infantry",
    year: 1908,
    pen: 26,
    armor: 12,
    history: "馬克沁機槍的德軍型。索姆河與馬恩河以後，步兵衝鋒先要解決的是它的彈藥與射手，不是旗幟。",
    portrait: pub("portraits/mg08.jpg"),
  }),
  unit({
    id: "soixante",
    name: "法國 75",
    designation: "Canon de 75 modèle 1897",
    epithet: "快砲",
    nation: "fr",
    layer: "land",
    kind: "artillery",
    year: 1897,
    pen: 46,
    armor: 10,
    skill: sk("barrage", "攔阻射", "濺射敵方陸地單位的兵員與彈藥。", 3),
    history: "液壓駐退讓射速遠超舊砲。馬恩河的勝算裡有它，也有把砲運到對的車站的鐵路。",
    portrait: pub("portraits/soixante.jpg"),
  }),
  unit({
    id: "fk96",
    name: "77 野砲",
    designation: "7.7 cm FK 96 n.A.",
    epithet: "直瞄的答案",
    nation: "de",
    layer: "land",
    kind: "artillery",
    year: 1906,
    pen: 40,
    armor: 8,
    skill: sk("barrage", "直瞄", "打擊近距離戰車的乘員與履帶。", 3),
    history: "德軍一戰野砲。康布雷時專門反戰車砲還沒成體系，戰車多半死在野砲、機槍與故障。",
    portrait: pub("portraits/fk96.jpg"),
  }),
  unit({
    id: "mark1",
    name: "馬克 I",
    designation: "Mark I",
    epithet: "過壕的菱形",
    nation: "uk",
    layer: "land",
    kind: "tank",
    year: 1916,
    speed: "slow",
    pen: 28,
    armor: 24,
    history: "1916 年 9 月索姆河首次投入。菱形車體為了越壕。到達敵陣前，機械故障淘汰的數量不比砲火少。",
    portrait: pub("portraits/mark1.jpg"),
  }),
  unit({
    id: "mark4",
    name: "馬克 IV",
    designation: "Mark IV",
    epithet: "康布雷的主體",
    nation: "uk",
    layer: "land",
    kind: "tank",
    year: 1917,
    speed: "slow",
    pen: 32,
    armor: 30,
    history: "一戰英軍產量最高的菱形戰車。康布雷證明集中使用能撕開防線，也證明沒有步兵與補給時缺口會重新合上。",
    portrait: pub("portraits/mark4.jpg"),
  }),
  unit({
    id: "nieuport",
    name: "紐波特",
    designation: "Nieuport 17",
    epithet: "上單翼的機關槍",
    nation: "fr",
    layer: "air",
    kind: "fighter",
    year: 1916,
    pen: 18,
    armor: 8,
    rof: 2,
    targets: ["air", "land"],
    history: "1916 年西線常見的協約國戰鬥機。空戰此時開始決定砲兵觀察員能不能活著回報彈著。",
    portrait: pub("portraits/nieuport.jpg"),
  }),
  unit({
    id: "camel",
    name: "駱駝",
    designation: "Sopwith Camel",
    epithet: "引擎的陀螺",
    nation: "uk",
    layer: "air",
    kind: "fighter",
    year: 1917,
    pen: 22,
    armor: 10,
    rof: 2,
    targets: ["air", "land"],
    history: "旋轉發動機讓它向右急轉很狠，也讓新手容易進入螺旋。戰果與訓練事故是同一架飛機的兩面。",
  }),
  unit({
    id: "harrier",
    name: "海獵鷹",
    designation: "Sea Harrier FRS.1",
    epithet: "跳出來的制空",
    nation: "uk",
    layer: "air",
    kind: "fighter",
    year: 1980,
    pen: 70,
    armor: 18,
    targets: ["air", "sea"],
    history: "1980 年列裝。福克蘭戰爭裡從無敵級航母短距起飛，爭的是艦隊上空那一小塊，不是阿根廷本土。",
  }),
  unit({
    id: "lion",
    name: "雄獅",
    designation: "HMS Lion",
    epithet: "戰巡旗艦",
    nation: "uk",
    layer: "sea",
    kind: "battleship",
    year: 1912,
    speed: "fast",
    pen: 92,
    armor: 58,
    skill: sk("salvo", "藥庫門", "下一發集中打敵艦彈藥。", 3),
    voice: "中彈的是砲塔，沉不沉看艙壁。",
    history: "比蒂的戰巡旗艦。日德蘭 Q 砲塔起火，因為艙門與裝藥紀律沒有演成胡德那種殉爆。戰巡的賭注是速度換裝甲。",
  }),
  unit({
    id: "derff",
    name: "德弗林格",
    designation: "SMS Derfflinger",
    epithet: "還開得回港",
    nation: "de",
    layer: "sea",
    kind: "battleship",
    year: 1914,
    speed: "fast",
    pen: 98,
    armor: 72,
    history: "德國戰列巡洋艦。日德蘭被重擊仍駛回威廉港。同一天，幾艘英國戰巡死於彈藥庫，不是死於慢慢掉光的船體輪廓。",
  }),
  unit({
    id: "spad",
    name: "斯巴德",
    designation: "SPAD S.XIII",
    epithet: "上翼的機關槍",
    nation: "fr",
    layer: "air",
    kind: "fighter",
    year: 1917,
    pen: 22,
    armor: 12,
    rof: 2.1,
    targets: ["air", "land"],
    history: "協約國後期主力戰鬥機之一。空戰開始決定地面砲兵能不能活著觀察。",
  }),
  unit({
    id: "smle",
    name: "李-恩菲爾德班",
    designation: "SMLE / Lee-Enfield",
    epithet: "十五發的節奏",
    nation: "uk",
    layer: "land",
    kind: "infantry",
    year: 1907,
    pen: 20,
    armor: 8,
    rof: 2.4,
    skill: sk("repair", "戰場搶修", "恢復自身引擎與乘員模組。", 2),
    history: "英聯邦制式步槍，十發彈倉讓班排射速很高。步兵仍要靠砲與戰車打開鐵絲網。",
  }),
  unit({
    id: "kar98",
    name: "毛瑟班",
    designation: "Karabiner 98k",
    nation: "de",
    layer: "land",
    kind: "infantry",
    year: 1935,
    pen: 22,
    armor: 8,
    history: "德軍最普遍的手動步槍。精準，射速受限，勝利靠的是與機槍、砲、戰車的編組。",
  }),
  unit({
    id: "mosin",
    name: "莫辛班",
    designation: "Mosin-Nagant M1891/30",
    nation: "ussr",
    layer: "land",
    kind: "infantry",
    year: 1930,
    pen: 21,
    armor: 8,
    history: "蘇聯及多國使用的舊式步槍，便宜、耐用、數量驚人。人力是資源，也是消耗。",
  }),
  unit({
    id: "garand",
    name: "加蘭德班",
    designation: "M1 Garand",
    nation: "us",
    layer: "land",
    kind: "infantry",
    year: 1936,
    pen: 26,
    armor: 10,
    skill: sk("repair", "搶修組", "恢復引擎與乘員。", 2),
    history: "美軍半自動步槍，八發彈夾。單兵火力上升，仍然喂不飽一場沒有油的裝甲戰。",
  }),
  unit({
    id: "type38",
    name: "三八式班",
    designation: "Type 38 rifle",
    nation: "jp",
    layer: "land",
    kind: "infantry",
    year: 1905,
    pen: 18,
    armor: 8,
    history: "日軍主力步槍，口徑較小、後坐低。工業規模不足以同時餵飽陸軍與艦隊。",
  }),
  unit({
    id: "wzor",
    name: "波軍步兵",
    designation: "kbk wz. 29",
    nation: "fr",
    layer: "land",
    kind: "infantry",
    year: 1929,
    pen: 20,
    armor: 8,
    history: "波蘭以毛瑟系統生產的步槍。1939 年的問題不是勇敢，是對手的空地協同與時間。",
  }),
  unit({
    id: "pz2",
    name: "二號戰車",
    designation: "Pz.Kpfw. II",
    nation: "de",
    layer: "land",
    kind: "tank",
    year: 1936,
    pen: 32,
    armor: 24,
    rof: 2.6,
    history: "戰前與戰爭初期的偵察輕戰車，20 公厘砲。閃擊戰前期它仍在一線，因為中型車不夠。",
  }),
  unit({
    id: "p4h",
    name: "四號 H",
    designation: "Pz.Kpfw. IV Ausf. H",
    epithet: "工作馬",
    nation: "de",
    layer: "land",
    kind: "tank",
    year: 1943,
    pen: 92,
    armor: 68,
    history: "長管 75 公厘的四號是德軍真正的數量支柱。虎式上新聞，四號在撐戰線。",
  }),
  unit({
    id: "tiger",
    name: "虎式",
    designation: "Pz.Kpfw. VI Tiger I",
    epithet: "厚重的故障",
    nation: "de",
    layer: "land",
    kind: "tank",
    year: 1942,
    speed: "slow",
    pen: 138,
    armor: 102,
    rof: 4.1,
    skill: sk("blitz", "陣地震懾", "短時間暈眩敵方陸地單位。", 3),
    passive: "last_stand",
    portrait: pub("portraits/tiger.jpg"),
    voice: "砲還能響。履帶不一定。",
    history:
      "88 公厘 KwK 36 穿深極高，重量帶來機械故障與油耗。市面故事常把它編成黨衛軍車長神話；這裡不收那套崇拜，只保留車輛本身的厚、慢與難以後送。",
  }),
  unit({
    id: "bt7",
    name: "BT-7",
    designation: "BT-7",
    epithet: "克里斯蒂懸吊",
    nation: "ussr",
    layer: "land",
    kind: "tank",
    year: 1935,
    pen: 44,
    armor: 22,
    rof: 2.7,
    history: "快、薄、砲小。它的懸吊與車體思路會流向 T-34，但 1939–41 的它擋不住後續的穿甲彈。",
  }),
  unit({
    id: "t34",
    name: "T-34-85",
    designation: "T-34-85",
    epithet: "斜面與數量",
    nation: "ussr",
    layer: "land",
    kind: "tank",
    year: 1944,
    pen: 108,
    armor: 72,
    history: "85 公厘砲改善對虎式與豹式的劣勢。斜面裝甲與可量產性，比任何單車決鬥更決定東線。",
  }),
  unit({
    id: "sherman",
    name: "謝爾曼",
    designation: "M4 Sherman",
    epithet: "開得動的戰爭",
    nation: "us",
    layer: "land",
    kind: "tank",
    year: 1942,
    pen: 86,
    armor: 64,
    skill: sk("repair", "戰地保修", "恢復引擎與乘員。美國工業的真正技能是把車修回前線。", 2),
    history: "可靠、好修、數量大，後期 76 公厘與螢火蟲等改裝補穿深。單車對虎常吃虧，師的妥善率則相反。",
  }),
  unit({
    id: "m51",
    name: "M51 超級謝爾曼",
    designation: "M51 Super Sherman",
    epithet: "戰後的 105",
    nation: "il",
    layer: "land",
    kind: "tank",
    year: 1962,
    pen: 130,
    armor: 66,
    history: "以色列以謝爾曼車體改裝法制 105 公厘砲，約 1962 年服役。它是二戰底盤的戰後生命，不是 1948 年的裝備。",
  }),
  unit({
    id: "chiha",
    name: "九七式中戰車",
    designation: "Type 97 Chi-Ha",
    nation: "jp",
    layer: "land",
    kind: "tank",
    year: 1938,
    pen: 52,
    armor: 32,
    history: "日軍主力中戰車，初期夠用，對上謝爾曼與 T-34 時砲與裝甲都落後。陸軍資源永遠排在艦隊後面。",
  }),
  unit({
    id: "churchill",
    name: "邱吉爾",
    designation: "Infantry Tank Mk IV Churchill",
    nation: "uk",
    layer: "land",
    kind: "tank",
    year: 1941,
    speed: "slow",
    pen: 84,
    armor: 96,
    history: "步兵戰車：厚、慢，用來伴隨徒步步兵。穿深要看砲型，車體本身是移動掩體。",
  }),
  unit({
    id: "charb1",
    name: "B1 重戰車",
    designation: "Char B1 bis",
    nation: "fr",
    layer: "land",
    kind: "tank",
    year: 1936,
    speed: "slow",
    pen: 80,
    armor: 90,
    history: "裝甲厚、車體 75 砲加砲塔 47 砲。單人砲塔讓車長過載——結構問題，不是士氣問題。",
  }),
  unit({
    id: "m13",
    name: "M13/40",
    designation: "Carro Armato M13/40",
    nation: "it",
    layer: "land",
    kind: "tank",
    year: 1940,
    pen: 58,
    armor: 38,
    history: "義大利北非主力中戰車。柴油引擎適合沙漠，鉚接裝甲與砲力在中後期不足。",
  }),
  unit({
    id: "l3",
    name: "L3 小戰車",
    designation: "L3/35",
    nation: "it",
    layer: "land",
    kind: "tank",
    year: 1935,
    pen: 24,
    armor: 14,
    history: "超輕戰車／機槍載具，數量多、防護極弱。它說明「有裝甲」和「有戰車兵種」不是同一件事。",
  }),
  unit({
    id: "tk3",
    name: "TK-3",
    designation: "TK-3",
    nation: "fr",
    layer: "land",
    kind: "tank",
    year: 1931,
    pen: 18,
    armor: 12,
    history: "波蘭超輕偵察車，機槍為主。1939 年面對德軍時，偵察不等於防線。",
  }),
  unit({
    id: "strvm42",
    name: "Strv m/42",
    designation: "Stridsvagn m/42",
    nation: "se",
    layer: "land",
    kind: "tank",
    year: 1943,
    pen: 72,
    armor: 58,
    history: "瑞典戰時自製中戰車，短管 75 砲。中立國的戰車是武裝中立的價錢，不是遠征的數量。",
  }),
  unit({
    id: "katyusha",
    name: "喀秋莎",
    designation: "BM-13",
    epithet: "面積，不是精確",
    nation: "ussr",
    layer: "land",
    kind: "artillery",
    year: 1941,
    pen: 70,
    armor: 12,
    rof: 5.2,
    skill: sk("barrage", "齊射覆蓋", "對所有敵方陸地單位的隨機部件造成傷害。", 3),
    portrait: pub("portraits/katyusha.jpg"),
    voice: "一片，不是一點。",
    history: "卡車載多管火箭，射速猛、精度差、簽名暴露陣地。它打擊的是區域與士氣，不是單輛虎式的正面。",
  }),
  unit({
    id: "karl",
    name: "卡爾砲",
    designation: "Karl-Gerät 040",
    epithet: "要塞專用",
    nation: "de",
    layer: "land",
    kind: "artillery",
    year: 1941,
    speed: "slow",
    pen: 160,
    armor: 16,
    rof: 7,
    rounds: 8,
    skill: sk("siege", "要塞破壞", "對單一目標的裝甲與主砲造成重創，自身再裝填大幅變慢。", 5),
    history: "600 公厘自走臼砲，用來打塞瓦斯托波爾等要塞。戰略機動幾乎為零，沒有鐵路與工兵就只是一座倉庫。",
  }),
  unit({
    id: "flak88",
    name: "八八砲",
    designation: "8.8 cm Flak 36",
    epithet: "平射的高射砲",
    nation: "de",
    layer: "land",
    kind: "artillery",
    year: 1936,
    pen: 125,
    armor: 14,
    rof: 3.6,
    targets: ["land", "air"],
    passive: "flak",
    skill: sk("sweep", "對空制壓", "暈眩敵方飛行單位。", 3),
    history: "高射砲被拉平打戰車，是應急也是砲術。它強，但陣地固定時很怕砲兵與飛機。",
  }),
  unit({
    id: "p26",
    name: "P-26",
    designation: "Boeing P-26 Peashooter",
    nation: "us",
    layer: "air",
    kind: "fighter",
    year: 1932,
    pen: 18,
    armor: 10,
    history: "美軍第一種全金屬單翼戰鬥機，到二戰爆發已過時。孤立主義時期的家底就是這個速度。",
  }),
  unit({
    id: "i16",
    name: "伊-16",
    designation: "Polikarpov I-16",
    nation: "ussr",
    layer: "air",
    kind: "fighter",
    year: 1934,
    pen: 24,
    armor: 14,
    history: "1930 年代很先進的單翼機，西班牙內戰到蘇德戰爭初期仍在飛。爬升與火力逐步落後Bf 109。",
  }),
  unit({
    id: "a5m",
    name: "九六艦戰",
    designation: "Mitsubishi A5M",
    nation: "jp",
    layer: "air",
    kind: "fighter",
    year: 1936,
    pen: 20,
    armor: 10,
    history: "日本海軍第一種單翼艦載戰鬥機。零戰的前代，輕、靈，幾乎沒有防護。",
  }),
  unit({
    id: "zero",
    name: "零戰",
    designation: "A6M2 Zero",
    epithet: "航程換裝甲",
    nation: "jp",
    layer: "air",
    kind: "fighter",
    year: 1940,
    pen: 30,
    armor: 11,
    rof: 2,
    skill: sk("sweep", "纏鬥", "暈眩敵方戰機。", 3),
    voice: "轉得過。挨不起。",
    history: "航程與水平機動極佳，無自封油箱、裝甲極薄。中途島之後面對有裝甲與俯衝速度的對手，優勢逆轉。",
  }),
  unit({
    id: "bf109",
    name: "Bf 109",
    designation: "Messerschmitt Bf 109 G",
    nation: "de",
    layer: "air",
    kind: "fighter",
    year: 1937,
    pen: 34,
    armor: 20,
    skill: sk("sweep", "躍升", "暈眩敵方戰機。", 3),
    history: "德國產量最大的戰鬥機，爬升與火力強，起落架窄、航程短。不列顛之戰裡航程比勇氣先耗盡。",
  }),
  unit({
    id: "spitfire",
    name: "噴火",
    designation: "Supermarine Spitfire Mk IX",
    nation: "uk",
    layer: "air",
    kind: "fighter",
    year: 1938,
    pen: 34,
    armor: 20,
    skill: sk("sweep", "截擊", "暈眩敵方戰機。", 3),
    history: "橢圓翼與梅林發動機的截擊機。Mk IX 用來對付 Fw 190 的性能壓迫。它贏的是本土防空網，不是單機神話。",
  }),
  unit({
    id: "hurri",
    name: "颶風",
    designation: "Hawker Hurricane",
    nation: "uk",
    layer: "air",
    kind: "fighter",
    year: 1937,
    pen: 30,
    armor: 22,
    history: "不列顛之戰擊落數多於噴火。結構較傳統、好修，常被派去打轟炸機。",
  }),
  unit({
    id: "f4f",
    name: "野貓",
    designation: "Grumman F4F Wildcat",
    nation: "us",
    layer: "air",
    kind: "fighter",
    year: 1940,
    pen: 32,
    armor: 24,
    history: "美國海軍早期艦戰。機動不及零戰，但有裝甲、自封油箱與俯衝加速，配合薩奇剪仍能交換。",
  }),
  unit({
    id: "mustang",
    name: "野馬",
    designation: "P-51D Mustang",
    epithet: "護航才是戰略",
    nation: "us",
    layer: "air",
    kind: "fighter",
    year: 1944,
    pen: 36,
    armor: 22,
    skill: sk("escort", "全程護航", "短時間加快我方空中單位再裝填。", 4),
    portrait: pub("portraits/mustang.jpg"),
    voice: "我跟著轟炸機走到頭。",
    history: "梅林發動機與層流翼讓它把護航做到柏林。1944 年戰略轟炸的轉折是護航距離，不只是投彈噸位。",
  }),
  unit({
    id: "ms406",
    name: "MS.406",
    designation: "Morane-Saulnier M.S.406",
    nation: "fr",
    layer: "air",
    kind: "fighter",
    year: 1938,
    pen: 26,
    armor: 16,
    history: "1940 年法國數量最多的戰鬥機，性能已落後 Bf 109。產量沒有換成制空權。",
  }),
  unit({
    id: "macchi",
    name: "Macchi C.202",
    designation: "Macchi C.202 Folgore",
    nation: "it",
    layer: "air",
    kind: "fighter",
    year: 1941,
    pen: 30,
    armor: 18,
    history: "義大利最好的量產戰鬥機之一，機動優秀，火力與後期產量不足。",
  }),
  unit({
    id: "p40",
    name: "P-40",
    designation: "Curtiss P-40",
    epithet: "飛虎隊的工作機",
    nation: "cn",
    layer: "air",
    kind: "fighter",
    year: 1941,
    pen: 30,
    armor: 24,
    history: "中國戰場與美國志願大隊的標誌機。低空頑強、高空乏力。外援飛機改變戰術，不自動贏得戰爭。",
  }),
  unit({
    id: "j22",
    name: "J 22",
    designation: "FFVS J 22",
    nation: "se",
    layer: "air",
    kind: "fighter",
    year: 1943,
    pen: 28,
    armor: 18,
    history: "瑞典因買不到足夠外國戰鬥機而自製。性能對上早期軸心戰機可一戰，工業背景是中立國的緊急狀態。",
  }),
  unit({
    id: "stuka",
    name: "斯圖卡",
    designation: "Ju 87 Stuka",
    nation: "de",
    layer: "air",
    kind: "bomber",
    year: 1937,
    pen: 72,
    armor: 20,
    rof: 3.8,
    targets: ["land", "sea", "air"],
    skill: sk("dive", "俯衝", "打擊地面或海上目標的彈藥庫。", 3),
    history: "精確俯衝轟炸機，沒有制空權時非常脆弱。不列顛之戰證明：沒有戰鬥機保護的俯衝只是排隊損失。",
  }),
  unit({
    id: "sbd",
    name: "無畏式",
    designation: "SBD Dauntless",
    nation: "us",
    layer: "air",
    kind: "bomber",
    year: 1940,
    pen: 78,
    armor: 24,
    rof: 3.6,
    targets: ["sea", "land", "air"],
    skill: sk("dive", "俯衝投彈", "打擊艦船或地面單位的彈藥庫。", 3),
    history: "中途島擊沉日本航艦的主力俯衝轟炸機。慢，但在正確的時間窗口裡決定艦隊決戰。",
  }),
  unit({
    id: "il2",
    name: "伊爾-2",
    designation: "Ilyushin Il-2",
    epithet: "飛行的砲兵",
    nation: "ussr",
    layer: "air",
    kind: "bomber",
    year: 1941,
    pen: 64,
    armor: 36,
    targets: ["land", "air"],
    skill: sk("dive", "對地突擊", "打擊陸地目標彈藥庫。", 3),
    history: "裝甲攻擊機，產量極大。早期後座機槍缺失付出過慘重代價——「飛行坦克」仍會被戰鬥機從上方打死。",
  }),
  unit({
    id: "b17",
    name: "空中堡壘",
    designation: "B-17 Flying Fortress",
    nation: "us",
    layer: "air",
    kind: "bomber",
    year: 1938,
    pen: 48,
    armor: 34,
    rof: 4,
    speed: "slow",
    targets: ["land", "sea", "air"],
    history: "四引擎日間轟炸機。自衛槍塔沒有取代護航。無護航的深遠突襲在 1943 年損失難以維持。",
  }),
  unit({
    id: "warspite",
    name: "厭戰",
    designation: "HMS Warspite",
    epithet: "從日德蘭到諾曼第",
    nation: "uk",
    layer: "sea",
    kind: "battleship",
    year: 1915,
    pen: 118,
    armor: 100,
    skill: sk("shore", "艦砲支援", "砲擊所有敵方陸地單位的裝甲與引擎。", 3),
    voice: "老船還能把砲抬上灘頭。",
    history: "伊莉莎白女王級。參加日德蘭，二戰再經地中海與諾曼第艦砲支援。長壽來自現代化改裝與還能開的輪機。",
  }),
  unit({
    id: "hood",
    name: "胡德",
    designation: "HMS Hood",
    epithet: "裝甲帶的缺口",
    nation: "uk",
    layer: "sea",
    kind: "battleship",
    year: 1920,
    pen: 110,
    armor: 78,
    passive: "magazine",
    history: "戰間期最大的戰列巡洋艦，象徵帝國，水平防護不足。1941 年 5 月 24 日丹麥海峽一戰，彈藥庫殉爆，三分鐘沉沒。",
  }),
  unit({
    id: "bismarck",
    name: "俾斯麥",
    designation: "DKM Bismarck",
    epithet: "一次出擊",
    nation: "de",
    layer: "sea",
    kind: "battleship",
    year: 1940,
    speed: "slow",
    pen: 132,
    armor: 108,
    skill: sk("hoodshot", "彈藥庫射擊", "下一發對英系主力艦更容易打進彈藥庫。", 3),
    portrait: pub("portraits/bismarck.jpg"),
    voice: "一發就夠，如果打中的是藥庫。",
    history: "萊茵演習擊沉胡德，舵機隨後被魚雷打壞，1941 年 5 月 27 日被圍殲。單艦質量補不回燃油、偵察與空中掩護。",
  }),
  unit({
    id: "yamato",
    name: "大和",
    designation: "IJN Yamato",
    epithet: "燃料巨獸",
    nation: "jp",
    layer: "sea",
    kind: "battleship",
    year: 1941,
    speed: "slow",
    pen: 155,
    armor: 120,
    rof: 5.4,
    rounds: 12,
    skill: sk("shore", "主砲跨界", "以 460 公厘砲轟炸岸上裝甲。", 4),
    passive: "tenichi",
    portrait: pub("portraits/yamato.jpg"),
    voice: "砲比油多的日子不多。",
    history: "九門 460 公厘，排水與油耗都是艦隊的黑洞。1945 年天一號作戰赴沖繩，在沒有制空權時被艦載機擊沉。大艦巨砲輸給飛機與燃油。",
  }),
  unit({
    id: "enterprise",
    name: "企業",
    designation: "USS Enterprise CV-6",
    epithet: "大 E",
    nation: "us",
    layer: "sea",
    kind: "carrier",
    year: 1938,
    pen: 40,
    armor: 30,
    rof: 3.5,
    skill: sk("lucky", "倖存出擊", "空襲目標彈藥庫，並有機會短時間不被選中。", 4),
    portrait: pub("portraits/enterprise.jpg"),
    voice: "甲板還在，就還能放飛。",
    history: "約克鎮級。中途島、東所羅門、聖克魯斯與之後几乎所有太平洋艦隊行動都有她。倖存是損傷管制與美國補艦能力，不是幸運咒語。",
  }),
  unit({
    id: "akagi",
    name: "赤城",
    designation: "IJN Akagi",
    nation: "jp",
    layer: "sea",
    kind: "carrier",
    year: 1927,
    pen: 38,
    armor: 26,
    skill: sk("sweep", "第一波", "開場壓制敵方艦載機。", 3),
    history: "由戰巡艦體改建的航艦。珍珠港的攻擊核心之一，中途島被無畏式命中，誘爆與火災導致沉沒。",
  }),
  unit({
    id: "dunkerque",
    name: "敦克爾克",
    designation: "Dunkerque",
    nation: "fr",
    layer: "sea",
    kind: "battleship",
    year: 1937,
    pen: 96,
    armor: 74,
    history: "法國高速戰列艦，主砲前置。1940 年凱比爾港遭英軍攻擊重創——盟友的砲口有時對準同一邊。",
  }),
  unit({
    id: "littorio",
    name: "利托里奧",
    designation: "RN Littorio",
    nation: "it",
    layer: "sea",
    kind: "battleship",
    year: 1940,
    pen: 120,
    armor: 98,
    skill: sk("tcross", "橫T", "短時間提高我方海上火力。", 3),
    history: "維托里奧·維內托級。火力與速度出色，燃油短缺與缺乏雷達、夜戰訓練限制了出航。",
  }),
  unit({
    id: "gotland",
    name: "哥特蘭",
    designation: "HSwMS Gotland",
    epithet: "看見俾斯麥的人",
    nation: "se",
    layer: "sea",
    kind: "cruiser",
    year: 1934,
    pen: 64,
    armor: 36,
    skill: sk("smoke", "煙幕", "水面單位短時間難以被選中。", 2),
    voice: "我只報告方位。戰爭自己會找上門。",
    history: "瑞典水上飛機巡洋艦。1941 年 5 月 20 日發現俾斯麥編隊，情報輾轉傳到英國。中立國的眼睛也是戰場的一部分。",
  }),
  unit({
    id: "typevii",
    name: "VII 型潛艇",
    designation: "Type VII U-boat",
    epithet: "噸位戰",
    nation: "de",
    layer: "sea",
    kind: "submarine",
    year: 1936,
    pen: 100,
    armor: 12,
    rof: 4.4,
    passive: "wolf",
    skill: sk("salvo", "狼群齊射", "下一發魚雷傷害提高。兩艘以上潛艇同時在場時開場隱蔽更久。", 2),
    history: "大西洋噸位戰的主力艇。早期缺口是盟軍護航與雷達，後期是超長程飛機、護衛航艦與破解恩尼格瑪後的獵殺。",
  }),
  unit({
    id: "ak47",
    name: "AK-47",
    designation: "AK-47",
    nation: "ussr",
    layer: "land",
    kind: "infantry",
    year: 1949,
    pen: 18,
    armor: 8,
    history: "突擊步槍。寬容的公差讓它在泥裡還能響，步兵火力從栓動步槍轉成中間威力彈。",
  }),
  unit({
    id: "m16",
    name: "M16",
    designation: "M16",
    nation: "us",
    layer: "land",
    kind: "infantry",
    year: 1964,
    pen: 18,
    armor: 8,
    history: "小口徑高速彈。越戰初期的卡彈來自保養與彈藥，不是口徑本身有魔法。",
  }),
  unit({
    id: "mig15",
    name: "米格-15",
    designation: "MiG-15",
    nation: "ussr",
    layer: "air",
    kind: "fighter",
    year: 1949,
    pen: 44,
    armor: 22,
    history: "後掠翼噴射戰鬥機。朝鮮空戰裡它壓過直線翼的一代，也被有雷達槍瞄的 F-86 交換。",
  }),
  unit({
    id: "f86",
    name: "軍刀",
    designation: "F-86 Sabre",
    nation: "us",
    layer: "air",
    kind: "fighter",
    year: 1949,
    pen: 42,
    armor: 24,
    history: "北美的後掠翼噴射機。交換比常被講成神話，雷達瞄準和飛行員經驗是可以核對的部分。",
  }),
  unit({
    id: "b52",
    name: "同溫層堡壘",
    designation: "B-52",
    nation: "us",
    layer: "air",
    kind: "bomber",
    year: 1955,
    pen: 70,
    armor: 36,
    history: "1955 年服役的戰略轟炸機，靠掛架和航電改裝活到二十一世紀。機體老，任務變了。",
  }),
  unit({
    id: "minuteman",
    name: "民兵 III",
    designation: "LGM-30G",
    epithet: "威懾",
    nation: "us",
    layer: "land",
    kind: "artillery",
    year: 1970,
    pen: 40,
    armor: 16,
    history: "陸基洲際彈道飛彈，在遊戲裡只代表核威懾存在。不模擬爆炸，也不提供任何製造或運用細節。",
  }),
  unit({
    id: "t72",
    name: "T-72",
    designation: "T-72",
    nation: "ussr",
    layer: "land",
    kind: "tank",
    year: 1973,
    pen: 132,
    armor: 100,
    history: "大量生產的主戰戰車。自動裝彈機省下一個人，也讓車體內的彈藥成為被擊穿後的風險。",
  }),
  unit({
    id: "m1",
    name: "艾布蘭",
    designation: "M1 Abrams",
    nation: "us",
    layer: "land",
    kind: "tank",
    year: 1980,
    pen: 150,
    armor: 120,
    history: "燃氣渦輪與複合裝甲。1991 年的優勢同時是夜視、訓練與後勤，不是單車無敵。",
  }),
  unit({
    id: "ohio",
    name: "俄亥俄級",
    designation: "Ohio-class SSBN",
    epithet: "威懾",
    nation: "us",
    layer: "sea",
    kind: "submarine",
    year: 1981,
    pen: 40,
    armor: 28,
    passive: "wolf",
    history: "彈道飛彈潛艦。價值是不容易被一次打擊清掉。遊戲不模擬核爆。",
  }),
  unit({
    id: "f16",
    name: "戰隼",
    designation: "F-16",
    nation: "us",
    layer: "air",
    kind: "fighter",
    year: 1978,
    pen: 68,
    armor: 28,
    history: "輕型多用途戰鬥機。電傳飛控讓它機動，掛載和數據鏈讓它留到四代半。",
  }),
  unit({
    id: "himars",
    name: "海馬斯",
    designation: "M142 HIMARS",
    nation: "us",
    layer: "land",
    kind: "artillery",
    year: 2005,
    pen: 90,
    armor: 14,
    history: "輪式多管火箭。它吃的是座標、彈藥和會不會被反砲兵找到，不是口號。",
  }),
  unit({
    id: "mq9",
    name: "收割者",
    designation: "MQ-9 Reaper",
    nation: "us",
    layer: "air",
    kind: "bomber",
    year: 2007,
    pen: 52,
    armor: 10,
    history: "遠端駕駛的察打無人機。依賴衛星鏈路和起降場。鏈路斷了，它就不是武器。",
  }),
  unit({
    id: "f35",
    name: "閃電 II",
    designation: "F-35",
    nation: "us",
    layer: "air",
    kind: "fighter",
    year: 2015,
    pen: 74,
    armor: 34,
    history: "低可探測性與感測器融合。它貴，維修工時也算進戰鬥力。",
  }),
  unit({
    id: "j20",
    name: "殲-20",
    designation: "殲-20",
    nation: "cn",
    layer: "air",
    kind: "fighter",
    year: 2017,
    pen: 72,
    armor: 34,
    history: "中國列裝的低可探測戰鬥機。紙面外形不能代替掛載、數量、飛手和地面體系。",
  }),
  unit({
    id: "xq58",
    name: "女武神",
    designation: "XQ-58A Valkyrie",
    epithet: "試飛",
    nation: "us",
    layer: "air",
    kind: "fighter",
    year: 2019,
    pen: 36,
    armor: 12,
    history: "2019 年已試飛的僚機驗證機。軟體可以幫忙看畫面。它不是會自己決定開火的完成體。",
  }),
];

const BY_ID = new Map([...UNITS, ...ARMS].map((u) => [u.id, u]));
const extras = new Map<string, UnitDef>();

export function setExtraUnits(list: UnitDef[]) {
  extras.clear();
  for (const u of list) extras.set(u.id, u);
}

export function getDef(id: string): UnitDef | undefined {
  return extras.get(id) ?? BY_ID.get(id);
}

export function allCatalog(): UnitDef[] {
  return [...UNITS, ...ARMS];
}

export const NATIONS: Record<
  NationId,
  { name: string; trait: string; blurb: string }
> = {
  de: {
    name: "德國",
    trait: "單件精良，油料見底",
    blurb: "後期合成燃料與空襲下的工廠，比任何虎式都更決定能打多久。",
  },
  us: {
    name: "美國",
    trait: "工廠先於前線",
    blurb: "孤立主義拖住出兵，兩洋的船臺與油田一旦轉動，損失可以被補上。",
  },
  ussr: {
    name: "蘇聯",
    trait: "數量、空間、整軍",
    blurb: "大清洗留下的軍官缺口不會因為口號消失。縱深與搬遷的工廠會。",
  },
  uk: {
    name: "英國",
    trait: "雷達與海上生命線",
    blurb: "夜戰與本土防空依賴雷達網。島國的橡膠與油從海上來。",
  },
  jp: {
    name: "日本",
    trait: "海軍航空，油在南方",
    blurb: "陸海軍不和會同時拖慢飛機與艦艇。沒有油田，決戰只是一次出航。",
  },
  cn: {
    name: "中國",
    trait: "空間換時間",
    blurb: "工業薄弱，人力與外援飛機支撐持久戰。裝備線不等於勝負線。",
  },
  fr: {
    name: "法國",
    trait: "厚甲與單人砲塔",
    blurb: "1940 的失敗混雜理論、通信、準備與政治，不只是「沒有戰車」。",
  },
  it: {
    name: "義大利",
    trait: "好船，缺油缺雷達",
    blurb: "地中海是內線，燃油與夜間識別才是出海次數的上限。",
  },
  se: {
    name: "瑞典",
    trait: "鐵砂與武裝中立",
    blurb: "出口的鐵礦餵養別人的戰爭。中立是政策，不是沒有軍隊。",
  },
  il: {
    name: "以色列",
    trait: "二戰剩餘物資",
    blurb: "1948 不是二戰章節。裝備多半是剩餘謝爾曼與活塞機，M51 是更晚的改裝。",
  },
};

export function nationTitle(id: NationId, modifiers: string[]): string {
  if (id === "de" && modifiers.includes("kaiser")) return "德意志帝國";
  if (id === "us" && modifiers.includes("red")) return "工農美利堅";
  return NATIONS[id].name;
}

export type StartPack = {
  civ: number;
  mil: number;
  steel: number;
  oil: number;
  rubber: number;
  alu: number;
  mp: number;
  pp: number;
  supply: number;
  eq: number;
  units: string[];
  y: number;
  m: number;
  modifiers: string[];
};

export const STARTS: Record<NationId, StartPack> = {
  de: { civ: 8, mil: 5, steel: 26, oil: 8, rubber: 1, alu: 8, mp: 40, pp: 22, supply: 60, eq: 14, units: ["pz2", "bf109", "kar98", "typevii"], y: 1936, m: 1, modifiers: [] },
  us: { civ: 14, mil: 2, steel: 34, oil: 24, rubber: 10, alu: 14, mp: 28, pp: 12, supply: 68, eq: 12, units: ["p26", "garand", "enterprise"], y: 1936, m: 1, modifiers: ["isolation"] },
  ussr: { civ: 8, mil: 6, steel: 22, oil: 16, rubber: 2, alu: 7, mp: 78, pp: 16, supply: 46, eq: 14, units: ["bt7", "i16", "mosin"], y: 1936, m: 1, modifiers: ["purge"] },
  uk: { civ: 7, mil: 4, steel: 16, oil: 12, rubber: 6, alu: 7, mp: 26, pp: 18, supply: 64, eq: 14, units: ["hurri", "warspite", "smle"], y: 1936, m: 1, modifiers: ["radar"] },
  jp: { civ: 5, mil: 3, steel: 12, oil: 6, rubber: 7, alu: 5, mp: 34, pp: 16, supply: 50, eq: 12, units: ["a5m", "akagi", "type38"], y: 1936, m: 1, modifiers: ["rivalry"] },
  cn: { civ: 2, mil: 2, steel: 8, oil: 3, rubber: 1, alu: 2, mp: 88, pp: 14, supply: 34, eq: 10, units: ["ft", "mosin"], y: 1937, m: 7, modifiers: [] },
  fr: { civ: 6, mil: 3, steel: 15, oil: 6, rubber: 3, alu: 5, mp: 24, pp: 15, supply: 56, eq: 12, units: ["ft", "ms406", "dunkerque"], y: 1936, m: 1, modifiers: [] },
  it: { civ: 4, mil: 3, steel: 11, oil: 4, rubber: 2, alu: 4, mp: 24, pp: 14, supply: 50, eq: 11, units: ["l3", "littorio", "macchi"], y: 1936, m: 1, modifiers: [] },
  se: { civ: 4, mil: 2, steel: 20, oil: 4, rubber: 2, alu: 4, mp: 12, pp: 16, supply: 72, eq: 12, units: ["gotland", "strvm42", "j22"], y: 1936, m: 1, modifiers: ["neutral"] },
  il: { civ: 3, mil: 2, steel: 8, oil: 5, rubber: 1, alu: 2, mp: 16, pp: 18, supply: 44, eq: 14, units: ["sherman", "spitfire"], y: 1948, m: 5, modifiers: ["epilogue"] },
};

export const FOCUSES: FocusDef[] = [
  { id: "de-rhein", nation: "de", name: "重佔萊茵蘭", cost: 1, req: [], alt: false, blurb: "政治力與補給上升。歷史上的第一顆骰子。" },
  { id: "de-anschluss", nation: "de", name: "德奧合併", cost: 1, req: ["de-rhein"], alt: false, blurb: "民用工廠 +1，人力上升。", exclusive: ["de-oppose"] },
  { id: "de-synth", nation: "de", name: "合成燃料", cost: 2, req: ["de-anschluss"], alt: false, blurb: "每月額外石油。氫化廠不是油田，但能延命。" },
  { id: "de-blitz", nation: "de", name: "閃電戰學說", cost: 2, req: ["de-rhein"], alt: false, blurb: "陸地傷害提高。學說不會憑空造出汽油。" },
  { id: "de-oppose", nation: "de", name: "反對希特勒", cost: 1, req: [], alt: true, blurb: "內戰消耗：民用工廠與人力下降，開啟復辟線。", exclusive: ["de-anschluss"] },
  { id: "de-kaiser", nation: "de", name: "德皇復辟", cost: 2, req: ["de-oppose"], alt: true, blurb: "國號改為德意志帝國，民用工廠回復一些。非歷史。" },
  { id: "us-deal", nation: "us", name: "新政工程", cost: 1, req: [], alt: false, blurb: "民用工廠 +1，補給上升。" },
  { id: "us-ocean", nation: "us", name: "兩洋海軍", cost: 2, req: ["us-deal"], alt: false, blurb: "裝備存量大增。船臺先於宣戰。", exclusive: ["us-red"] },
  { id: "us-war", nation: "us", name: "廢棄孤立", cost: 1, req: [], alt: false, blurb: "解除孤立主義，允許提前遠征。" },
  { id: "us-red", nation: "us", name: "赤色岔路", cost: 2, req: [], alt: true, blurb: "非歷史：解除孤立，人力上升，民用工廠大減。", exclusive: ["us-ocean"] },
  { id: "su-reform", nation: "ussr", name: "恢復軍官團", cost: 2, req: [], alt: false, blurb: "移除大清洗的乘員懲罰。" },
  { id: "su-deep", nation: "ussr", name: "大縱深作戰", cost: 2, req: ["su-reform"], alt: false, blurb: "陸地傷害提高。" },
  { id: "su-ural", nation: "ussr", name: "烏拉爾工廠", cost: 2, req: [], alt: false, blurb: "軍用工廠 +1。" },
  { id: "uk-chain", nation: "uk", name: "本土鏈鎖雷達", cost: 1, req: [], alt: false, blurb: "補給與政治力上升。雷達特質你一開始就有。" },
  { id: "uk-fc", nation: "uk", name: "戰鬥機指揮", cost: 1, req: ["uk-chain"], alt: false, blurb: "空中傷害提高。" },
  { id: "jp-south", nation: "jp", name: "南進", cost: 2, req: [], alt: false, blurb: "立即獲得石油與橡膠。資源在別人的地圖上。", exclusive: ["jp-north"] },
  { id: "jp-north", nation: "jp", name: "北進", cost: 2, req: [], alt: true, blurb: "非歷史：政治力上升，不拿南方的油。", exclusive: ["jp-south"] },
  { id: "jp-unify", nation: "jp", name: "緩和陸海軍對立", cost: 2, req: [], alt: false, blurb: "移除海空傷害懲罰。" },
  { id: "cn-front", nation: "cn", name: "統一戰線", cost: 1, req: [], alt: false, blurb: "補給大幅上升。" },
  { id: "cn-aid", nation: "cn", name: "外援整編", cost: 2, req: ["cn-front"], alt: false, blurb: "裝備存量上升。" },
  { id: "fr-line", nation: "fr", name: "工事與通信", cost: 1, req: [], alt: false, blurb: "補給上升，裝備少量增加。要塞擋不住繞過它的部隊。" },
  { id: "it-sea", nation: "it", name: "內線海", cost: 1, req: [], alt: false, blurb: "海上傷害提高。" },
  { id: "it-oil", nation: "it", name: "燃油配給", cost: 2, req: [], alt: false, blurb: "每月少量石油。" },
  { id: "se-ore", nation: "se", name: "鐵砂外交", cost: 1, req: [], alt: false, blurb: "鋼鐵上升。買主是誰，是政治問題。" },
  { id: "se-arm", nation: "se", name: "武裝中立", cost: 1, req: [], alt: false, blurb: "補給上升。" },
  { id: "il-surplus", nation: "il", name: "剩餘物資", cost: 1, req: [], alt: false, blurb: "裝備存量上升。來源是上一場戰爭的庫存。" },
  { id: "il-field", nation: "il", name: "機場守勢", cost: 1, req: [], alt: false, blurb: "空中傷害提高。" },
];

export const PROLOGUE_IDS = ["marne", "jutland", "somme", "cambrai"] as const;

export function isPrologue(id: string): boolean {
  return (PROLOGUE_IDS as readonly string[]).includes(id);
}

export function nextPrologue(id: string): string | null {
  const i = PROLOGUE_IDS.indexOf(id as (typeof PROLOGUE_IDS)[number]);
  if (i < 0 || i >= PROLOGUE_IDS.length - 1) return null;
  return PROLOGUE_IDS[i + 1] ?? null;
}

export function serviceThisYear(y: number): UnitDef[] {
  return UNITS.filter((u) => u.year === y);
}

export const NODES: NodeDef[] = [
  {
    id: "marne",
    name: "馬恩河",
    y: 1914,
    m: 9,
    theater: "西線",
    layers: ["land"],
    brief: "德軍右翼在巴黎以東停住。鐵路把法軍預備隊送進缺口。這一週比任何一次白刃衝鋒更早決定。",
    axis: [],
    allies: [],
    axisNations: ["de"],
    alliedNations: ["fr", "uk"],
    reward: { steel: 4, eq: 4, pp: 3, oil: 0 },
    fixedPlayer: ["soixante", "lebel", "smle"],
    fixedEnemy: ["mg08", "g98", "fk96"],
  },
  {
    id: "jutland",
    name: "日德蘭",
    y: 1916,
    m: 5,
    theater: "北海",
    layers: ["sea"],
    brief: "戰巡在霧與煙裡對射。勝負是一發打進彈藥庫，或艙門關上之後還開得回港。沒有人需要看見對面的臉。",
    axis: [],
    allies: [],
    axisNations: ["de"],
    alliedNations: ["uk"],
    reward: { steel: 5, eq: 5, pp: 4, oil: 1 },
    fixedPlayer: ["lion", "warspite"],
    fixedEnemy: ["derff", "derff"],
  },
  {
    id: "somme",
    name: "索姆河",
    y: 1916,
    m: 9,
    theater: "西線",
    layers: ["land", "air"],
    brief: "鐵絲網後面沒有血條。打掉機槍組的彈藥，或讓菱形戰車的引擎先停，陣地才會安靜。",
    axis: [],
    allies: [],
    axisNations: ["de"],
    alliedNations: ["uk", "fr"],
    reward: { steel: 6, eq: 6, pp: 4, oil: 1 },
    fixedPlayer: ["mark1", "nieuport", "smle"],
    fixedEnemy: ["mg08", "g98", "fk96"],
  },
  {
    id: "cambrai",
    name: "康布雷",
    y: 1917,
    m: 11,
    theater: "西線",
    layers: ["land", "air"],
    brief: "戰車第一次成批量地撕開防線。沒有跟著走的步兵與彈藥，缺口會在幾天內合上。",
    axis: [],
    allies: [],
    axisNations: ["de"],
    alliedNations: ["uk"],
    reward: { steel: 6, eq: 6, pp: 4, oil: 1 },
    fixedPlayer: ["mark4", "mark4", "camel"],
    fixedEnemy: ["fk96", "mg08", "g98"],
  },
  {
    id: "lugou",
    name: "盧溝橋",
    y: 1937,
    m: 7,
    theater: "中國",
    layers: ["land", "air"],
    brief: "衝突從橋頭擴成全面戰爭。中國此時的工業撐不起一場短促的裝甲對決。",
    axis: ["chiha", "a5m", "type38"],
    allies: ["ft", "mosin", "mosin"],
    axisNations: ["jp"],
    alliedNations: ["cn"],
    reward: { steel: 6, eq: 6, pp: 4, oil: 1 },
  },
  {
    id: "poland",
    name: "波蘭戰役",
    y: 1939,
    m: 9,
    theater: "東歐",
    layers: ["land", "air"],
    brief: "空軍與裝甲的時間表打穿了尚未完成的動員。這不是騎兵神話能解釋的戰役。",
    axis: ["pz2", "bf109", "kar98"],
    allies: ["tk3", "wzor", "ft"],
    axisNations: ["de"],
    alliedNations: ["uk", "fr"],
    reward: { steel: 8, eq: 7, pp: 4, oil: 2 },
  },
  {
    id: "ore",
    name: "鐵砂航線",
    y: 1940,
    m: 4,
    theater: "北海",
    layers: ["sea", "air"],
    brief: "瑞典鐵礦經挪威水域南下。潛艇打的是噸位，護航打的是到港。",
    axis: ["typevii", "typevii", "bf109"],
    allies: ["gotland", "hurri", "spitfire"],
    axisNations: ["de"],
    alliedNations: ["uk", "se"],
    reward: { steel: 10, eq: 5, pp: 4, oil: 2 },
  },
  {
    id: "fallfr",
    name: "法蘭西之戰",
    y: 1940,
    m: 5,
    theater: "西線",
    layers: ["land", "air"],
    brief: "裝甲集中使用、通信與預備隊的位置，比「誰的戰車更厚」更快決定缺口。",
    axis: ["pz2", "bf109", "stuka"],
    allies: ["charb1", "ms406", "dunkerque"],
    axisNations: ["de", "it"],
    alliedNations: ["fr", "uk"],
    reward: { steel: 8, eq: 7, pp: 4, oil: 2 },
  },
  {
    id: "britain",
    name: "不列顛",
    y: 1940,
    m: 8,
    theater: "本土",
    layers: ["air"],
    brief: "雷達、航程與飛行員回收。德國戰鬥機護不到轟炸機能夠往返的全部距離。",
    axis: ["bf109", "bf109", "stuka"],
    allies: ["spitfire", "hurri", "hurri"],
    axisNations: ["de"],
    alliedNations: ["uk"],
    reward: { steel: 6, eq: 8, pp: 5, oil: 2 },
  },
  {
    id: "barbarossa",
    name: "巴巴羅薩",
    y: 1941,
    m: 6,
    theater: "東線",
    layers: ["land", "air"],
    brief: "初期的包圍戰打死的是尚未展開的部隊。冬天與搬不走的工廠還沒出場。",
    axis: ["pz2", "p4h", "stuka", "kar98"],
    allies: ["bt7", "t34", "i16", "mosin"],
    axisNations: ["de"],
    alliedNations: ["ussr"],
    reward: { steel: 10, eq: 8, pp: 5, oil: 3 },
  },
  {
    id: "midway",
    name: "中途島",
    y: 1942,
    m: 6,
    theater: "太平洋",
    layers: ["air", "sea"],
    brief: "偵察機的一張報告與俯衝轟炸機的幾分鐘。航艦在彈藥與飛機露天時最脆弱。",
    axis: ["akagi", "zero", "zero"],
    allies: ["enterprise", "f4f", "sbd", "f4f"],
    axisNations: ["jp"],
    alliedNations: ["us"],
    reward: { steel: 8, eq: 9, pp: 6, oil: 4 },
  },
  {
    id: "kursk",
    name: "庫爾斯克",
    y: 1943,
    m: 7,
    theater: "東線",
    layers: ["land", "air"],
    brief: "已知的進攻撞上縱深陣地、地雷與數量。虎式能打穿單點，打不穿整個突出部。",
    axis: ["tiger", "p4h", "bf109", "stuka"],
    allies: ["t34", "t34", "il2", "katyusha"],
    axisNations: ["de"],
    alliedNations: ["ussr"],
    reward: { steel: 12, eq: 10, pp: 6, oil: 3 },
  },
  {
    id: "normandy",
    name: "諾曼第",
    y: 1944,
    m: 6,
    theater: "西線",
    layers: ["sea", "land", "air"],
    brief: "艦砲、灘頭、制空權是同一天的三層。沒有補給的突破會在樹籬後面停住。",
    axis: ["p4h", "tiger", "bf109", "flak88"],
    allies: ["sherman", "mustang", "warspite", "garand"],
    axisNations: ["de"],
    alliedNations: ["us", "uk", "fr"],
    reward: { steel: 12, eq: 12, pp: 7, oil: 4 },
  },
  {
    id: "negev",
    name: "1948 公路",
    y: 1948,
    m: 5,
    theater: "戰後",
    layers: ["land", "air"],
    brief: "這不是二戰。獨立戰爭的公路與機場使用大量二戰剩餘裝備。戰鬥只演部隊，不演平民。",
    axis: ["p4h", "bf109", "m13"],
    allies: ["sherman", "spitfire"],
    axisNations: ["de"],
    alliedNations: ["il"],
    reward: { steel: 8, eq: 8, pp: 5, oil: 2 },
  },
  {
    id: "korea",
    name: "朝鮮上空",
    y: 1950,
    m: 12,
    theater: "冷戰",
    layers: ["land", "air"],
    brief: "噴射機與二戰剩餘戰車同時在場。空優沒有自動變成佔領每一座山。只打部隊。",
    axis: ["t34", "mig15", "ak47"],
    allies: ["sherman", "f86", "m16"],
    axisNations: ["ussr"],
    alliedNations: ["us"],
    reward: { steel: 10, eq: 8, pp: 5, oil: 3 },
  },
  {
    id: "gulf",
    name: "沙漠風暴",
    y: 1991,
    m: 2,
    theater: "現代",
    layers: ["air", "land"],
    brief: "夜視、精確導引與制空權。後勤仍在。不打城市。",
    axis: ["t72", "ak47", "mig15"],
    allies: ["m1", "f16", "b52"],
    axisNations: ["ussr"],
    alliedNations: ["us"],
    reward: { steel: 12, eq: 10, pp: 6, oil: 4 },
  },
  {
    id: "link",
    name: "鏈路",
    y: 2022,
    m: 3,
    theater: "現代",
    layers: ["air", "land"],
    brief: "察打無人機與火箭砲並存。數據鏈斷了，無人機就是航模。核威懾不在這一關的傷害裡。",
    axis: ["t72", "ak47", "mig15"],
    allies: ["m1", "mq9", "himars"],
    axisNations: ["ussr"],
    alliedNations: ["us"],
    reward: { steel: 12, eq: 12, pp: 6, oil: 4 },
  },
];

export function getNode(id: string): NodeDef | undefined {
  return NODES.find((n) => n.id === id);
}

function dateReached(g: Gate, n: NodeDef): boolean {
  return g.y > n.y || (g.y === n.y && g.m >= n.m);
}

export function canFight(g: Gate, n: NodeDef): { ok: boolean; reason: string } {
  if (isPrologue(n.id)) return { ok: false, reason: "序章已寫入檔案。" };
  if (!g.nation) return { ok: false, reason: "尚未選擇國家。" };
  if (g.modifiers.includes("isolation") && g.nation === "us" && !g.focuses.includes("us-war") && !g.focuses.includes("us-red")) {
    const late = g.y > 1941 || (g.y === 1941 && g.m >= 12);
    if (!late) return { ok: false, reason: "孤立主義：遠征還未獲准。完成「廢棄孤立」，或等到 1941 年 12 月。" };
  }
  if (!dateReached(g, n)) return { ok: false, reason: `尚未到來。歷史日期是 ${n.y} 年 ${n.m} 月。` };
  if (g.won.includes(n.id)) return { ok: true, reason: "已獲勝，再戰不再發獎。" };
  return { ok: true, reason: "可交戰。" };
}

export function layerName(l: Layer): string {
  return l === "air" ? "空" : l === "land" ? "陸" : "海";
}

export function kindName(k: Kind): string {
  const map: Record<Kind, string> = {
    fighter: "戰鬥機",
    bomber: "攻擊／轟炸",
    tank: "戰車",
    artillery: "火砲",
    infantry: "步兵",
    battleship: "主力艦",
    carrier: "航空母艦",
    submarine: "潛艇",
    cruiser: "巡洋艦",
    destroyer: "驅逐艦",
  };
  return map[k];
}

export function moduleLabel(kind: Kind, key: ModuleKey): string {
  if (kind === "infantry") {
    return { armor: "掩體", engine: "機動", ammo: "彈藥", crew: "兵員", gun: "武器" }[key];
  }
  if (kind === "fighter" || kind === "bomber") {
    return { armor: "機體", engine: "發動機", ammo: "彈艙", crew: "飛行員", gun: "機砲" }[key];
  }
  if (kind === "battleship" || kind === "carrier" || kind === "submarine" || kind === "cruiser" || kind === "destroyer") {
    return { armor: "裝甲帶", engine: "輪機", ammo: "彈藥庫", crew: "艦員", gun: "主砲" }[key];
  }
  return { armor: "裝甲", engine: "引擎", ammo: "彈藥庫", crew: "乘員", gun: "主砲" }[key];
}

export function buyCost(u: UnitDef, year: number): number {
  const base = Math.round(8 + u.armor / 18 + u.pen / 26);
  return u.year > year + 1 ? Math.round(base * 1.35) : base;
}

export function skillForKind(kind: Kind): SkillDef {
  if (kind === "fighter") return sk("sweep", "制空", "暈眩敵方飛行單位。", 3);
  if (kind === "bomber") return sk("dive", "突擊", "打擊表面目標的彈藥庫。", 3);
  if (kind === "tank") return sk("blitz", "突破", "暈眩敵方戰車與步兵。", 3);
  if (kind === "artillery") return sk("barrage", "覆蓋", "濺射敵方陸地單位。", 3);
  if (kind === "infantry") return sk("repair", "搶修", "恢復機動與兵員。", 2);
  if (kind === "submarine") return sk("salvo", "雷擊", "下一發傷害提高。", 2);
  if (kind === "destroyer") return sk("smoke", "煙幕", "水面單位短時間難以被選中。", 2);
  if (kind === "carrier") return sk("escort", "放飛", "加快我方空中再裝填。", 4);
  return sk("shore", "砲擊", "打擊岸上裝甲與輪機。", 3);
}

export type ArchiveSeed = {
  id: string;
  name: string;
  designation: string;
  nation: NationId;
  layer: Layer;
  kind: Kind;
  year: number;
  history: string;
  pen?: number;
  armor?: number;
};

export const ARCHIVES: ArchiveSeed[] = [
  { id: "panther", name: "豹式", designation: "Pz.Kpfw. V Panther", nation: "de", layer: "land", kind: "tank", year: 1943, pen: 130, armor: 88, history: "傾斜裝甲與長管 75，機動優於虎式。早期傳動不可靠，側面仍薄。" },
  { id: "firefly", name: "螢火蟲", designation: "Sherman Firefly", nation: "uk", layer: "land", kind: "tank", year: 1944, pen: 128, armor: 64, history: "英軍把 17 磅砲塞進謝爾曼。砲塔擁擠，但終於能在常見交戰距離打虎式正面。" },
  { id: "kv1", name: "KV-1", designation: "KV-1", nation: "ussr", layer: "land", kind: "tank", year: 1940, pen: 78, armor: 100, history: "1941 年厚甲讓德軍 37 與短 50 公厘很痛苦。重量與可靠性拖累機動。" },
  { id: "is2", name: "IS-2", designation: "IS-2", nation: "ussr", layer: "land", kind: "tank", year: 1944, pen: 140, armor: 104, history: "122 公厘砲，穿甲與爆破兼顧，射速慢。用來對付重戰車與據點。" },
  { id: "cromwell", name: "克倫威爾", designation: "Cromwell", nation: "uk", layer: "land", kind: "tank", year: 1944, pen: 74, armor: 60, history: "梅林改裝的流星發動機讓它很快。砲力對後期德軍仍常常不夠。" },
  { id: "hellcat", name: "地獄貓", designation: "F6F Hellcat", nation: "us", layer: "air", kind: "fighter", year: 1943, pen: 36, armor: 26, history: "太平洋美國海軍主力艦戰，為打零戰而設計：速度、裝甲、爬升與六挺 12.7。" },
  { id: "p47", name: "雷電", designation: "P-47 Thunderbolt", nation: "us", layer: "air", kind: "fighter", year: 1942, pen: 40, armor: 32, history: "巨型星型發動機與八挺機槍，高空護航後轉成優秀的戰鬥轟炸機。" },
  { id: "typhoon", name: "颱風", designation: "Hawker Typhoon", nation: "uk", layer: "air", kind: "fighter", year: 1941, pen: 48, armor: 28, history: "低空粗暴，火箭彈打西北歐的火車與戰車。早期機體結構問題奪走過自己飛行員的命。" },
  { id: "yak9", name: "雅克-9", designation: "Yak-9", nation: "ussr", layer: "air", kind: "fighter", year: 1942, pen: 32, armor: 18, history: "木金混合的輕型戰鬥機，產量大、低空靈活。東線制空權的日常，不是單機傳奇。" },
  { id: "ki84", name: "疾風", designation: "Ki-84 Hayate", nation: "jp", layer: "air", kind: "fighter", year: 1944, pen: 38, armor: 22, history: "日本陸軍後期高性能戰鬥機。設計追上對手時，燃料、零件與熟練飛行員已經不夠。" },
  { id: "me262", name: "梅塞施密特 262", designation: "Me 262", nation: "de", layer: "air", kind: "fighter", year: 1944, pen: 52, armor: 20, history: "實戰噴射戰鬥機。引擎壽命短、起飛無力。它證明技術跳躍不等於扭轉戰略。" },
  { id: "lancaster", name: "蘭開斯特", designation: "Avro Lancaster", nation: "uk", layer: "air", kind: "bomber", year: 1942, pen: 50, armor: 30, history: "英國夜間戰略轟炸的主力。區域轟炸的道德與軍事效果至今仍是史家分歧的核心。" },
  { id: "su85", name: "SU-85", designation: "SU-85", nation: "ussr", layer: "land", kind: "tank", year: 1943, pen: 112, armor: 48, history: "T-34 底盤的驅逐戰車，用來補 76 公厘 T-34 打不穿虎式的空窗。" },
  { id: "jagdpanther", name: "獵豹", designation: "Jagdpanther", nation: "de", layer: "land", kind: "tank", year: 1944, pen: 148, armor: 96, history: "豹式底盤加 88 砲。側面與產量仍然是問題。無砲塔意味着側翼一被繞就危險。" },
  { id: "hago", name: "九五式輕戰車", designation: "Type 95 Ha-Go", nation: "jp", layer: "land", kind: "tank", year: 1936, pen: 30, armor: 18, history: "日軍數量最多的戰車之一。對步兵夠用，對任何中戰車都過於脆弱。" },
  { id: "chinu", name: "三式中戰車", designation: "Type 3 Chi-Nu", nation: "jp", layer: "land", kind: "tank", year: 1944, pen: 88, armor: 50, history: "為對付謝爾曼而趕工的 75 公厘戰車。大部分留在本土，沒有形成戰場影響。" },
  { id: "matilda", name: "瑪蒂爾達 II", designation: "Matilda II", nation: "uk", layer: "land", kind: "tank", year: 1939, pen: 48, armor: 92, history: "北非早期的厚甲步兵戰車。砲小，後來被更大口徑的反戰車砲追上。" },
  { id: "nebel", name: "煙幕火箭", designation: "Nebelwerfer 41", nation: "de", layer: "land", kind: "artillery", year: 1940, pen: 60, armor: 8, history: "150 公厘多管火箭。聲音可怕，精度一般，同樣怕反砲兵。" },
  { id: "sexton", name: "塞克斯頓", designation: "Sexton", nation: "uk", layer: "land", kind: "artillery", year: 1943, pen: 74, armor: 30, history: "加拿大以謝爾曼底盤搭載 25 磅砲。自走砲解決的是跟得上戰車，不是口徑崇拜。" },
  { id: "iowa", name: "愛荷華", designation: "USS Iowa", nation: "us", layer: "sea", kind: "battleship", year: 1943, pen: 140, armor: 112, history: "快速戰列艦，為護航航艦戰鬥群與岸轟而活。主砲時代的巔峰正好遇上航艦時代。" },
  { id: "essex", name: "艾塞克斯", designation: "Essex-class", nation: "us", layer: "sea", kind: "carrier", year: 1942, pen: 42, armor: 34, history: "美國戰時航艦產量的答案。損傷管制、飛機補充與數量把單次海戰變成消耗戰。" },
  { id: "fletcher", name: "弗萊徹", designation: "Fletcher-class", nation: "us", layer: "sea", kind: "destroyer", year: 1942, pen: 74, armor: 18, history: "防空、反潛與魚雷都做的艦隊驅逐艦。所羅門夜戰裡，魚雷改寫局面的次數多於戰列艦的對射。" },
  { id: "kagero", name: "陽炎級", designation: "Kagerō-class", nation: "jp", layer: "sea", kind: "destroyer", year: 1939, pen: 90, armor: 16, history: "日本艦隊驅逐艦，氧氣魚雷航程遠。夜戰強，戰爭中期以後防空不足。" },
  { id: "typeix", name: "IX 型潛艇", designation: "Type IX", nation: "de", layer: "sea", kind: "submarine", year: 1938, pen: 102, armor: 14, history: "遠洋潛艇，能到美國東岸與印度洋。遠洋也意味著更長的暴露與更慢的回航。" },
  { id: "richelieu", name: "黎塞留", designation: "Richelieu", nation: "fr", layer: "sea", kind: "battleship", year: 1940, pen: 122, armor: 100, history: "主砲集中艦艏。未完成即逃往達卡，後來加入盟軍改造。政權換了，船還在。" },
  { id: "ppsh", name: "波波沙班", designation: "PPSh-41", nation: "ussr", layer: "land", kind: "infantry", year: 1941, pen: 16, armor: 8, history: "衝鋒槍大量裝備近戰部隊。城市與森林裡射速有用，打不穿戰車。" },
  { id: "mg42", name: "MG42 組", designation: "MG42", nation: "de", layer: "land", kind: "infantry", year: 1942, pen: 24, armor: 10, history: "通用機槍射速極高，班排火力的核心。它讓對手的步兵戰術必須圍繞掩蔽與壓制，而不是排隊衝鋒。" },
  { id: "m4a3e8", name: "謝爾曼 E8", designation: "M4A3E8 Easy Eight", nation: "us", layer: "land", kind: "tank", year: 1944, pen: 96, armor: 68, history: "水平懸吊改善越野與射擊穩定性。美軍裝甲的進化往往是妥善率加上剛好夠用的砲。" },
];

export function fromDossier(d: {
  id: string;
  name: string;
  designation: string;
  nation: NationId;
  layer: Layer;
  kind: Kind;
  year: number;
  epithet: string;
  history: string;
  voice: string;
  pen: number;
  armor: number;
  skillName: string;
}): UnitDef {
  const skill = skillForKind(d.kind);
  return unit({
    id: d.id,
    name: d.name,
    designation: d.designation,
    epithet: d.epithet || "考證",
    nation: d.nation,
    layer: d.layer,
    kind: d.kind,
    year: d.year,
    pen: d.pen,
    armor: d.armor,
    skill: { ...skill, name: d.skillName || skill.name },
    history: d.history,
    voice: d.voice,
  });
}

export function archiveToUnit(seed: ArchiveSeed): UnitDef {
  const skill = skillForKind(seed.kind);
  const passive = seed.kind === "submarine" ? ("wolf" as const) : undefined;
  return unit({
    id: `arc-${seed.id}`,
    name: seed.name,
    designation: seed.designation,
    epithet: "館藏",
    nation: seed.nation,
    layer: seed.layer,
    kind: seed.kind,
    year: seed.year,
    pen: seed.pen ?? 40,
    armor: seed.armor ?? 24,
    skill,
    passive,
    history: seed.history,
    voice: "館藏鋼印。對準彈藥、動力或乘員。",
  });
}

export const STORY: { k: string; t: string; b: string }[] = [
  { k: "1914 · 六月", t: "列車比將軍準時", b: "薩拉熱窩之後，各國按動員表前進。這不是一場決鬥，是時間表撞上時間表。" },
  { k: "1916 · 索姆河", t: "鐵絲網吃掉衝鋒", b: "機槍、鐵絲網與砲兵把運動戰釘死。下一發該打哪，開始比旗幟重要。" },
  { k: "1916 · 日德蘭", t: "沒有人看見對面的臉", b: "戰巡在霧裡對射。勝負常常是一發打進彈藥庫，而不是把船的輪廓打到某個百分比。" },
  { k: "1919 · 凡爾賽", t: "帳單寫進條約", b: "停火沒有停掉產能。石油、橡膠、鋼與船臺，被寫成下一場戰爭的理由。" },
  { k: "1936", t: "選擇一種意志", b: "馬恩河、日德蘭、索姆河、康布雷之後，你要給一個國家分配工廠、油料，以及會走岔的歷史。" },
  { k: "1945 以後", t: "天花板變了", b: "核武讓大國不敢直接對撞，局部戰爭仍用步槍、戰車與飛機。威懾寫在名冊裡，不化成這一關的傷害數字，也不寫製造。" },
  { k: "現在", t: "鏈路也是補給", b: "無人機、精確導引與夜視沒有取消油料和維修。軟體可以幫忙看，開火仍是人的決定。鏈路斷了，飛行的眼睛就掉下來。" },
  { k: "每日", t: "明天還有一頁", b: "劇本按香港日期每天換一篇。接通 MiniMax 時由它新寫，而且只能引用真實列裝或已經試飛的軍武。沒接通時，用當日的真實戰役和裝備索引寫一頁。" },
];

export const MODELS: { t: string; d: string }[] = [
  { t: "戰爭是後勤", d: "沒有油的裝甲師與沒有橡膠的飛機，是庫存不是戰鬥力。前線的勇敢補不回鐵路被炸斷的那一週。" },
  { t: "要害不是輪廓", d: "實戰的任務殺傷打的是彈藥庫、動力與乘員。主砲損壞讓它不能還手，卻不一定讓它立刻離開戰場。" },
  { t: "制空權是別人的命中率", d: "飛機很少單獨贏得地面戰，但沒有飛機時，戰車與軍艦的偵察、轟炸與補給都會變差。" },
  { t: "工業比例決定明年", d: "民用工廠造鐵路與貿易，軍用工廠造本季的槍砲。全押軍工，下一季就沒有路把子彈送出去。" },
  { t: "歷史是結構裡的岔路", d: "同一套資源限制下，決策仍会分叉。非歷史路線必須付出結構代價，而不是改一個國旗就變強。" },
];

export const DISPUTES: { t: string; a: string; b: string }[] = [
  {
    t: "大艦巨砲，還是航艦",
    a: "主力艦砲在夜間、惡劣天氣與岸轟時仍不可替代，裝甲讓她扛得住巡洋艦解決不了的命中。",
    b: "1942 年以後的艦隊決戰由搜敵距離與艦載機決定。巨砲艦在沒有制空權時是被動的目標，油耗還擠壓護衛艦。",
  },
  {
    t: "決戰突破，還是消耗",
    a: "集中裝甲尋找缺口，能在敵人完成動員前結束戰役，減少總傷亡。",
    b: "1943 年以後的縱深陣地、空中阻絕與產量，讓單次突破無法結束戰爭。忽略補充率的軍隊會在第三次攻勢消失。",
  },
  {
    t: "戰略轟炸能否單獨打垮工業",
    a: "持續打擊煉油、軸承與交通，能從後方瓦解前線，無需地面佔領每一座工廠。",
    b: "德國工業在 1944 年前仍因分散與奴役勞動而增產。無護航的轟炸損失太高；真正的崩潰與地面推進、燃油同時發生。",
  },
];

export type Quiz = { q: string; choices: string[]; a: number; why: string };

export const QUIZ: Quiz[] = [
  {
    q: "不列顛之戰德國失敗，最有解釋力的結構原因是？",
    choices: ["德國飛行員不夠勇敢", "Bf 109 航程護不住轟炸機的往返", "英國沒有雷達", "噴火的數量從第一天就壓倒性領先"],
    a: 1,
    why: "戰鬥機航程、雷達引導與被擊落飛行員能否回到本國，比單機勇氣更能解釋損耗曲線。",
  },
  {
    q: "一輛主砲被打壞、引擎與乘員仍在的戰車，為什麼還不算被「解決」？",
    choices: ["因為遊戲喜歡拖時間", "它仍佔住陣地，也可被拖救；任務殺傷要看動力、乘員與彈藥", "主砲壞了就一定殉爆", "裝甲數字歸零才算"],
    a: 1,
    why: "火力殺傷與任務殺傷不是同一件事。不能開火的車仍是障礙、觀測點或維修目標。",
  },
  {
    q: "1943 年無護航深入德國的日間轟炸難以持續，主因是？",
    choices: ["轟炸機槍塔理論上已經足夠自衛", "護航距離不足，損失率吃掉訓練與飛機補充", "德國沒有戰鬥機", "投彈瞄準具尚未發明"],
    a: 1,
    why: "自衛火力沒有取代戰鬥機護航。野馬這一類長程護航改變的是損失率能否被工業補上。",
  },
  {
    q: "虎式很少成為德軍裝甲的主體，因為？",
    choices: ["砲太小", "重量、故障與油耗讓它無法取代四號的數量與妥善率", "希特勒禁止生產", "東線橋梁全部寬於它"],
    a: 1,
    why: "精良的單車若不能按師補充，戰術勝利會在戰役層被數量與維修吃掉。",
  },
  {
    q: "中途島日本航艦在哪些條件下特別容易被一擊打垮？",
    choices: ["只要天氣放晴", "甲板與機庫正在加油掛彈，火災容易誘爆", "美國潛艇組成了完整封鎖", "零戰航程突然變短"],
    a: 1,
    why: "航艦的要害是飛機、燃油與彈藥暴露的窗口，不是艦體「血量」慢慢下降。",
  },
  {
    q: "把所有民用工廠都改成軍用，下一季最可能先崩潰的是？",
    choices: ["士兵的口號", "鐵路、港口與貿易，也就是補給本身", "將軍的軍銜", "步兵的步槍口徑"],
    a: 1,
    why: "軍工生產當季的武器，民用建設決定這些武器能不能送到有油的地方。",
  },
  {
    q: "蘇聯 1941 年的潰敗，哪種說法把結構與偶然分得比較開？",
    choices: ["只因為冬天還沒到", "展開未完成、軍官團受創、同時德軍達成了戰役突然性", "T-34 還沒被發明", "蘇聯沒有鐵路"],
    a: 1,
    why: "裝備紙面並不差。指揮、展開、通信與突然性解釋了初期包圍，工業東遷則解釋了為什麼沒有就此結束。",
  },
  {
    q: "零戰早期優勢的代價是什麼？",
    choices: ["航程太短", "為了航程與機動，捨棄裝甲與自封油箱", "沒有無線電的任何形式", "不能從航艦起飛"],
    a: 1,
    why: "設計取捨：輕才能遠。一旦對手用速度與防護迫使它進行不能纏鬥的交換，損失的是越來越難補充的飛行員。",
  },
  {
    q: "胡德號沉沒最接近哪種殺傷？",
    choices: ["艦體被平均打穿到某個百分比", "彈藥庫殉爆導致災難性失效", "艦員投票投降", "燃料用盡自行鑿沉"],
    a: 1,
    why: "丹麥海峽的致命過程是藥庫，而不是把整艘船的鋼板均勻削掉。細節仍有彈道爭議，機制不是血條。",
  },
  {
    q: "哪種說法分得清「記得型號」和「懂戰爭」？",
    choices: ["能背出虎式噸位", "能說明同一輛虎式在有油有拖救、和沒有油沒有制空權時是兩種武器", "能說出所有艦娘綽號", "能列出每種槍的口徑"],
    a: 1,
    why: "型號是入口。專家問的是補給、修補、偵察與這件武器在體系裡的位置。",
  },
];

export function difficultyLabel(d: Difficulty): string {
  return d === "arcade" ? "街機" : d === "realistic" ? "歷史性能" : "全真模擬";
}

export const DIFFICULTY_COPY: Record<Difficulty, string> = {
  arcade: "有落點與穿透提示。載具比較好開，節奏快。",
  realistic: "沒有落點圈。性能按史實，彈藥打完要回去補給。",
  simulator: "座艙視角。沒有敵我標記，每一發都要你指定提前量。",
};
