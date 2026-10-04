export type CardCategory = "Leader" | "Character" | "Event" | "Stage";

/** Bandai's current block for a card number. X never rotates. */
export type BlockId = "1" | "2" | "3" | "4" | "5" | "X";
export type OptcgColor =
  | "Red"
  | "Green"
  | "Blue"
  | "Purple"
  | "Black"
  | "Yellow";

export interface DeckPoolCard {
  id: string;
  name: string;
  category: CardCategory;
  rarity: string;
  colors: OptcgColor[];
  cost: number | null;
  attributes: string[];
  power: number | null;
  counter: number | null;
  types: string[];
  effect: string | null;
  trigger: string | null;
  packId: string;
  setCode: string;
  series: string;
  images: string[];
  has: string[];
  timings: string[];
  /** Null when this card number has not been classified yet. */
  block: BlockId | null;
}

export interface PackMeta {
  id: string;
  rawTitle: string;
  prefix: string | null;
  label: string | null;
  title: string | null;
  series: string;
  setCode: string;
}
