import type { UnitDef } from "@/game/types";
import { layerName } from "@/game/catalog";

/**
 * The face of a 兵器娘 card.
 *
 * A card without art used to render its initial alone on a flat panel. For
 * 三八式班 that initial is 三, which in the accent colour reads as a hamburger
 * menu — indistinguishable from a failed image load. So the placeholder carries
 * the nation, the layer and an explicit "art pending" mark instead of one bare
 * glyph.
 *
 * The box shape belongs to the caller: the detail card passes a 2/3 box because
 * the 立繪 are 1152x1728 and a 3/4 box was cropping them, while the list tiles
 * keep their own fixed height.
 */
const NATION_TINT: Record<string, string> = {
  fr: "#4A6E8A",
  de: "#5B6B5B",
  uk: "#7A6A44",
  us: "#4A5240",
  ussr: "#4B5A3C",
  jp: "#6A5B4A",
  it: "#6A6B5A",
  se: "#5C6266",
  cn: "#6B6F4E",
  il: "#5C6144",
};

type FaceUnit = Pick<UnitDef, "name" | "nation" | "layer" | "portrait">;

export function CardFace({ unit, size = "sm" }: { unit: FaceUnit; size?: "sm" | "lg" }) {
  if (unit.portrait) {
    return <img src={unit.portrait} alt="" className="h-full w-full object-cover" />;
  }
  const tint = NATION_TINT[unit.nation] ?? "#4A5240";
  return (
    <div
      className="relative grid h-full w-full place-items-center overflow-hidden"
      style={{ background: `linear-gradient(168deg, ${tint} 0%, #100d0f 72%)` }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <span className="absolute right-3 top-2.5 text-xs tracking-[.25em] text-white/45">{layerName(unit.layer)}</span>
      <span
        className={`relative font-display text-white/90 [text-shadow:0_4px_26px_rgba(0,0,0,.75)] ${
          size === "lg" ? "text-6xl" : "text-3xl"
        }`}
      >
        {unit.name.slice(0, 1)}
      </span>
      {size === "lg" ? (
        <span className="absolute inset-x-0 bottom-3 text-center text-[9px] tracking-[.2em] text-accent/85">立繪待生成</span>
      ) : null}
    </div>
  );
}

/** The shape a portrait should sit in: the 立繪 are 1152x1728. */
export const PORTRAIT_RATIO = "2 / 3";