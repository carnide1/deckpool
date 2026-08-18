export type CardCategory = "Leader" | "Character" | "Event" | "Stage";
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
