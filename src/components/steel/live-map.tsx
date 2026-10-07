import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const CENTER: Record<string, [number, number, number]> = {
  西線: [2.8, 49.4, 6],
  北海: [5.6, 56.6, 5],
  中國: [116.3, 39.8, 5],
  東歐: [21.0, 52.2, 5],
  東線: [32.0, 54.2, 5],
  太平洋: [-177.4, 28.2, 3],
  本土: [0.1, 51.5, 6],
  戰後: [34.8, 31.5, 5],
  冷戰: [127.0, 37.6, 5],
  現代: [47.6, 29.3, 5],
};

export function LiveMap({ theater, label }: { theater: string; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [lng, lat, zoom] = CENTER[theater] ?? [10, 48, 3];
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const map = new maplibregl.Map({
      container: node,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap",
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
      center: [lng, lat],
      zoom,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    new maplibregl.Marker({ color: "#e8a080" }).setLngLat([lng, lat]).addTo(map);
    return () => map.remove();
  }, [lng, lat, zoom]);
  return (
    <div className="relative h-full min-h-48 w-full">
      <div ref={ref} className="h-full w-full" />
      <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-xs text-[#f6d9cb]">{label || theater}</span>
    </div>
  );
}
