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

export function placeOf(name: string, theater: string): [number, number, number] {
  return PLACES[name] ?? PLACES[theater] ?? [10, 48, 4];
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
  spots = [],
  active,
  onPick,
}: {
  theater: string;
  label?: string;
  spots?: MapSpot[];
  active?: string | null;
  onPick?: (id: string) => void;
}) {
  const [lng, lat] = placeOf(label || "", theater);
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
