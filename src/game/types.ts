export type NationId =
  | "de"
  | "us"
  | "ussr"
  | "uk"
  | "jp"
  | "cn"
  | "fr"
  | "it"
  | "se"
  | "il";

export type Layer = "air" | "land" | "sea";

export type Kind =
  | "fighter"
  | "bomber"
  | "tank"
  | "artillery"
  | "infantry"
  | "battleship"
  | "carrier"
  | "submarine"
  | "cruiser"
  | "destroyer";

export type ModuleKey = "armor" | "engine" | "ammo" | "crew" | "gun";

export type Difficulty = "arcade" | "realistic" | "simulator";

export type SkillId =
  | "salvo"
  | "smoke"
  | "tcross"
  | "sweep"
  | "shore"
  | "dive"
  | "blitz"
  | "barrage"
  | "siege"
  | "escort"
  | "lucky"
  | "hoodshot"
  | "repair";

export type Passive = "last_stand" | "tenichi" | "magazine" | "wolf" | "flak";

export type SkillDef = {
  id: SkillId;
  name: string;
  blurb: string;
  energy: number;
};

export type UnitDef = {
  id: string;
  name: string;
  designation: string;
  epithet: string;
  nation: NationId;
  layer: Layer;
  kind: Kind;
  year: number;
  speed: "fast" | "slow";
  pen: number;
  armor: number;
  rof: number;
  rounds: number;
  targets: Layer[];
  skill: SkillDef;
  passive?: Passive;
  voice: string;
  history: string;
  portrait?: string;
};

export type Side = "player" | "enemy";

export type UnitInst = {
  uid: string;
  defId: string;
  side: Side;
  mod: Record<ModuleKey, number>;
  modMax: Record<ModuleKey, number>;
  rounds: number;
  reload: number;
  skillCd: number;
  stunned: number;
  conceal: number;
  invuln: number;
  exploded: boolean;
  tenichi: boolean;
  nextCrit: boolean;
  nextMul: number;
  lastStandNoted: boolean;
};

export type BattleLog = { id: number; text: string };

export type BattleState = {
  nodeId: string;
  difficulty: Difficulty;
  t: number;
  energy: number;
  maxEnergy: number;
  units: UnitInst[];
  log: BattleLog[];
  seq: number;
  over: null | "win" | "lose";
  focusUid: string | null;
  shooterUid: string | null;
  priority: ModuleKey;
  modifiers: string[];
  layers: Layer[];
  cross: boolean;
  buffTcross: number;
  buffEscort: number;
  strikeCd: number;
  pulse: number;
  lead: number;
};

export type Reward = { steel: number; eq: number; pp: number; oil: number };

export type Screen =
  | "title"
  | "story"
  | "nation"
  | "hq"
  | "industry"
  | "template"
  | "focus"
  | "map"
  | "history"
  | "gallery"
  | "codex"
  | "lecture"
  | "battle"
  | "hero30"
  | "debrief";
