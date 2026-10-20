export type MapSpot = { id: string; name: string; lng: number; lat: number };

const PLACES: Record<string, [number, number, number]> = {
  伊孫佐: [13.61, 45.93, 11],
  第七次伊孫佐戰役: [13.61, 45.93, 11],
  馬恩河: [3.4, 49.0, 7],
  索姆河: [2.7, 50.02, 8],
  康布雷: [3.23, 50.17, 9],
  日德蘭: [5.9, 56.7, 6],
  盧溝橋: [116.22, 39.85, 10],
  波蘭戰役: [19.5, 52.2, 6],
  法蘭西之戰: [2.3, 49.4, 6],
  不列顛: [0.5, 51.3, 6],
  巴巴羅薩: [30.5, 54.5, 5],
  中途島: [-177.37, 28.21, 6],
  庫爾斯克: [36.2, 51.7, 7],
  諾曼第: [-0.8, 49.35, 7],
  朝鮮上空: [127.0, 38.0, 6],
  沙漠風暴: [47.6, 29.3, 6],
  俄國內戰: [37.62, 55.75, 5],
  北海: [5.6, 56.6, 5],
  中國: [116.3, 39.8, 5],
  東歐: [21.0, 52.2, 5],
  東線: [32.0, 54.2, 5],
  太平洋: [-177.4, 28.2, 4],
  本土: [0.1, 51.5, 6],
  冷戰: [127.0, 37.6, 5],
  現代: [47.6, 29.3, 5],
};

/**
 * The theater strings the campaign writer produces, mapped to a point.
 *
 * A dossier names its theater ("地中海與北大西洋", "伊拉克-伊朗邊境與波斯灣"),
 * and the map needs a longitude and a latitude. The old lookup only knew the
 * handful of theaters the hand-written campaigns used, so every campaign the
 * writer added fell through to the default and was drawn on the same map in
 * southern Germany -- a Barbary War frigate fight in the Mediterranean
 * appeared over Ulm.
 *
 * These are the theaters in use across the feed. A campaign whose theater is
 * not listed still gets a map, but it is centred on the Atlantic rather than
 * on a German town.
 */
const THEATER_PLACES: Record<string, [number, number, number]> = {
  "戰場": [12, 42, 4],
  "西線": [2.7, 49.0, 6],
  "東歐": [21.0, 52.2, 5],
  "東線": [32.0, 54.2, 5],
  "北歐與東歐交界": [25.0, 59.0, 5],
  "巴爾幹": [20.0, 42.0, 6],
  "芬蘭本土": [26.0, 62.0, 6],
  "卡累利阿地峽與拉多加湖畔": [33.0, 61.0, 6],
  "俄羅斯全境": [60.0, 56.0, 4],
  "波蘭": [19.5, 52.2, 6],
  "愛爾蘭": [-8.0, 53.3, 6],
  "愛爾蘭都柏林": [-6.26, 53.35, 9],
  "伊孫佐前線": [13.6, 45.9, 10],
  "伊松佐河前線": [13.6, 45.9, 10],
  "西班牙": [-3.7, 40.4, 6],
  "伊比利亞半島葡萄牙與西班牙邊境": [-8.2, 40.2, 7],
  "安納托利亞": [33.0, 39.0, 6],
  "中國": [116.3, 39.8, 5],
  "中國戰場": [114.0, 30.0, 5],
  "華南至華北": [113.0, 30.0, 6],
  "上海": [121.5, 31.2, 8],
  "中原地区（中國華北、華中）": [114.0, 35.0, 7],
  "中東戰線": [38.0, 31.0, 5],
  "巴勒斯坦與以色列": [34.8, 31.5, 8],
  "西奈半島與戈蘭高地": [34.3, 31.0, 8],
  "黎巴嫩": [35.8, 33.9, 8],
  "黎巴嫩南部與黎以邊境地帶": [35.5, 33.2, 9],
  "伊拉克": [43.5, 33.0, 6],
  "伊拉克-伊朗邊境與波斯灣": [47.5, 30.0, 6],
  "波斯灣": [51.0, 26.5, 6],
  "埃及蘇伊士運河區": [32.5, 30.0, 8],
  "阿爾及利亞山區、沿海平原與撒哈拉": [3.0, 28.0, 5],
  "格蘭查科荒漠與沼澤地帶": [23.0, 12.0, 5],
  "蘇丹南部與中部": [30.0, 12.0, 5],
  "東非高原、厄立特里亞與意屬索馬里": [46.0, 7.0, 4],
  "剛果共和國及其周邊": [23.0, -3.0, 5],
  "安哥拉": [16.0, -12.0, 5],
  "安哥拉（葡萄牙殖民時期）": [16.0, -12.0, 5],
  "納戈爾諾-卡拉巴赫戰爭地帶": [46.5, 39.5, 7],
  "車臣共和國（高加索）": [45.5, 43.3, 7],
  "巴德梅邊境地區": [45.0, 36.0, 7],
  "阿富汗山區": [66.0, 34.0, 6],
  "阿富汗戰場": [66.0, 34.0, 6],
  "喜馬拉雅邊境": [79.0, 32.0, 6],
  "克什米爾與旁遮普前線": [74.5, 34.0, 7],
  "印度西部與德幹高原": [77.0, 20.0, 5],
  "孟加拉地區": [90.0, 24.0, 6],
  "南亞": [78.0, 22.0, 4],
  "東南亞": [103.0, 12.0, 4],
  "奈及利亞東部": [12.5, 8.0, 6],
  "中國與越南邊境": [106.0, 22.0, 6],
  "朝鮮半島": [127.0, 38.0, 6],
  "黑龍江省珍寶島地區": [134.0, 48.0, 8],
  "南大西洋": [-15.0, -25.0, 3],
  "地中海與北大西洋": [15.0, 35.0, 4],
  "歐洲戰場": [10.0, 50.0, 4],
  "歐洲與太平洋戰場": [30.0, 35.0, 3],
  "太平洋": [-177.4, 28.2, 4],
  "冷戰": [127.0, 37.6, 5],
  "現代": [47.6, 29.3, 5],
  "戰後": [34.8, 31.5, 6],
};

/** Where a map lands when nothing better is known: the Atlantic, not Ulm. */
const FALLBACK: [number, number, number] = [-25, 20, 3];

export function placeOf(name: string, theater: string): [number, number, number] {
  return PLACES[name] ?? THEATER_PLACES[theater] ?? PLACES[theater] ?? FALLBACK;
}

const NAMED: Record<string, MapSpot[]> = {
  伊孫佐: [
    { id: "town", name: "戈里齊亞", lng: 13.622, lat: 45.954 },
    { id: "shrine", name: "時之補給站", lng: 13.59, lat: 45.93 },
    { id: "field", name: "米倫", lng: 13.607, lat: 45.895 },
    { id: "boss", name: "聖米凱萊山", lng: 13.547, lat: 45.886 },
  ],
};

export function spotsNear(name: string, theater: string, names: { id: string; name: string }[]): MapSpot[] {
  if (name.includes("伊孫佐")) return NAMED.伊孫佐;
  const [lng, lat] = placeOf(name, theater);
  return names.map((s, i) => ({
    id: s.id,
    name: s.name,
    lng: lng + (i - 1) * 0.18,
    lat: lat + (i % 2 === 0 ? 0.12 : -0.1),
  }));
}

function tileXY(lng: number, lat: number, zoom: number) {
  const n = 2 ** zoom;
  const x = ((lng + 180) / 360) * n;
  const r = (lat * Math.PI) / 180;
  const y = (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n;
  return { x, y };
}

export function LiveMap({
  theater,
  label,
  place,
  spots = [],
  active,
  onPick,
}: {
  theater: string;
  label?: string;
  /** Exact position for this campaign, when the dossier knows one. */
  place?: { lng?: number; lat?: number; zoom?: number } | null;
  spots?: MapSpot[];
  active?: string | null;
  onPick?: (id: string) => void;
}) {
  const fallback = placeOf(label || "", theater);
  const lng = typeof place?.lng === "number" ? place.lng : fallback[0];
  const lat = typeof place?.lat === "number" ? place.lat : fallback[1];
  const span = label?.includes("伊孫佐") ? 0.12 : 0.8;
  const bbox = [lng - span, lat - span * 0.7, lng + span, lat + span * 0.7].join(",");
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
  return (
    <div className="grid gap-2">
      <iframe title={label || theater} src={src} className="h-72 w-full rounded-2xl border border-line bg-[#d5e4ef]" />
      <p className="text-[10px] text-subtle">© OpenStreetMap contributors</p>
      {spots.length ? (
        <div className="flex flex-wrap gap-2">
          {spots.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onPick?.(s.id)}
              className={`rounded-xl border px-2 py-1 text-xs ${s.id === active ? "border-accent bg-accent text-accent-fg" : "border-line bg-surface text-fg"}`}
            >
              {s.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
