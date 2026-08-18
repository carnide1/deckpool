export type CardMatch = {
  category?: "Event" | "Character" | "Stage";
  cost?: { op: ">=" | "<=" | "="; value: number };
  types?: string[];
  /** Card is forbidden unless it has all of these types (e.g. Nami P-117). */
  requireTypes?: string[];
  colors?: string[];
  cardIds?: string[];
};

export type ConstructionRule =
  | { kind: "copyLimit"; cardId: string; max: number | null }
  | { kind: "forbid"; whenLeader: string; match: CardMatch };
