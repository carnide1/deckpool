import { timestampToMillis } from "@/lib/timestamps";
import type { CardCategory, DeckPoolCard } from "@/types/catalog";

export type SortKey =
  | "newest"
  | "oldest"
  | "serial"
  | "name"
  | "category"
  | "cost"
  | "recent";

export const SORT_LABELS: Record<SortKey, string> = {
  newest: "Newest set",
  oldest: "Oldest set",
  serial: "Serial number",
  name: "Name",
  category: "Category",
  cost: "Cost",
  recent: "Recently updated",
};

const FAMILY_RANK: Record<string, number> = {
  OP: 50,
  EB: 40,
  PRB: 30,
  ST: 20,
  P: 10,
};

const CATEGORY_RANK: Record<CardCategory, number> = {
  Leader: 0,
  Character: 1,
  Event: 2,
  Stage: 3,
};

export type ParsedCardId = {
  family: string;
  set: number;
  num: number;
};

export function parseCardIdentity(card: DeckPoolCard): ParsedCardId {
  const id = card.id.toUpperCase();
  const idMatch = id.match(/^([A-Z]+?)(\d*)-(\d+)$/);
  if (idMatch) {
    const family = normalizeFamily(idMatch[1]);
    const setFromId = idMatch[2] ? Number(idMatch[2]) : 0;
    return {
      family,
      set: setFromId || setNumberFromCode(card.setCode, family),
      num: Number(idMatch[3]),
    };
  }

  return {
    family: familyFromSetCode(card.setCode),
    set: setNumberFromCode(card.setCode, familyFromSetCode(card.setCode)),
    num: 0,
  };
}

function normalizeFamily(raw: string): string {
  if (raw.startsWith("PRB")) return "PRB";
  if (raw.startsWith("OP")) return "OP";
  if (raw.startsWith("EB")) return "EB";
  if (raw.startsWith("ST")) return "ST";
  if (raw.startsWith("P")) return "P";
  return raw;
}

function familyFromSetCode(setCode: string): string {
  const upper = setCode.toUpperCase();
  if (upper.startsWith("PRB")) return "PRB";
  if (upper.startsWith("OP")) return "OP";
  if (upper.startsWith("EB")) return "EB";
  if (upper.startsWith("ST")) return "ST";
  if (upper.startsWith("P")) return "P";
  return upper || "ZZ";
}

function setNumberFromCode(setCode: string, family: string): number {
  const upper = setCode.toUpperCase();
  const match = upper.match(new RegExp(`^${family}(\\d+)`));
  if (match) return Number(match[1]);
  const any = upper.match(/(\d+)/);
  return any ? Number(any[1]) : 0;
}

function setRank(parsed: ParsedCardId): number {
  const family = FAMILY_RANK[parsed.family] ?? 0;
  return family * 1000 + parsed.set;
}

function compareSerial(a: DeckPoolCard, b: DeckPoolCard): number {
  const pa = parseCardIdentity(a);
  const pb = parseCardIdentity(b);
  const family = pa.family.localeCompare(pb.family);
  if (family !== 0) return family;
  if (pa.set !== pb.set) return pa.set - pb.set;
  if (pa.num !== pb.num) return pa.num - pb.num;
  return a.id.localeCompare(b.id);
}

function compareNewest(a: DeckPoolCard, b: DeckPoolCard): number {
  const pa = parseCardIdentity(a);
  const pb = parseCardIdentity(b);
  const rank = setRank(pb) - setRank(pa);
  if (rank !== 0) return rank;
  if (pa.num !== pb.num) return pa.num - pb.num;
  return a.id.localeCompare(b.id);
}

export type SortExtras = {
  updatedAtById?: Record<string, unknown>;
};

export function sortCards(
  cards: DeckPoolCard[],
  key: SortKey,
  extras: SortExtras = {},
): DeckPoolCard[] {
  const next = [...cards];
  next.sort((a, b) => {
    switch (key) {
      case "newest":
        return compareNewest(a, b);
      case "oldest":
        return compareNewest(b, a);
      case "serial":
        return compareSerial(a, b);
      case "name": {
        const name = a.name.localeCompare(b.name);
        return name !== 0 ? name : a.id.localeCompare(b.id);
      }
      case "category": {
        const cat =
          CATEGORY_RANK[a.category] - CATEGORY_RANK[b.category];
        if (cat !== 0) return cat;
        return a.name.localeCompare(b.name);
      }
      case "cost": {
        const ac = a.cost ?? 999;
        const bc = b.cost ?? 999;
        if (ac !== bc) return ac - bc;
        return a.name.localeCompare(b.name);
      }
      case "recent": {
        const am = timestampToMillis(extras.updatedAtById?.[a.id]);
        const bm = timestampToMillis(extras.updatedAtById?.[b.id]);
        if (am !== bm) return bm - am;
        return a.name.localeCompare(b.name);
      }
      default:
        return 0;
    }
  });
  return next;
}
