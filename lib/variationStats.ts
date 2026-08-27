import type { CardCategory, DeckPoolCard, OptcgColor } from "@/types/catalog";

export const VARIATION_STAT_FLAGS = [
  "blocker",
  "rush",
  "banish",
  "double-attack",
  "trigger",
] as const;

export type VariationStatFlag = (typeof VARIATION_STAT_FLAGS)[number];

export type VariationSetCount = {
  setCode: string;
  copies: number;
};

export type VariationColorCount = {
  color: OptcgColor;
  copies: number;
};

export type VariationStats = {
  copies: number;
  avgCost: number | null;
  avgPower: number | null;
  highestPower: number | null;
  byCategory: Record<CardCategory, number>;
  flags: Record<VariationStatFlag, number>;
  counter1000: number;
  counter2000: number;
  /** Cards with no counter (catalog `null` / printed “-” / 0). */
  counter0: number;
  counterOther: number;
  /** Populated only when the Leader has 2+ colors. */
  byColor: VariationColorCount[];
  /** Sets that appear in the list (Leader excluded), sorted by set code. */
  bySet: VariationSetCount[];
};

export type ComputeVariationStatsOptions = {
  /** When the Leader is multi-color, break down main-deck copies by those colors. */
  leaderColors?: OptcgColor[];
};

const EMPTY_CATEGORY: Record<CardCategory, number> = {
  Leader: 0,
  Character: 0,
  Event: 0,
  Stage: 0,
};

function emptyFlags(): Record<VariationStatFlag, number> {
  return {
    blocker: 0,
    rush: 0,
    banish: 0,
    "double-attack": 0,
    trigger: 0,
  };
}

function compareSetCodes(a: string, b: string): number {
  const matchA = /^([A-Za-z]+)(\d+)$/.exec(a);
  const matchB = /^([A-Za-z]+)(\d+)$/.exec(b);
  if (matchA && matchB) {
    const prefix = matchA[1].localeCompare(matchB[1]);
    if (prefix !== 0) return prefix;
    return Number(matchA[2]) - Number(matchB[2]);
  }
  return a.localeCompare(b);
}

export function computeVariationStats(
  cards: Record<string, number>,
  cardsById: Map<string, DeckPoolCard>,
  options: ComputeVariationStatsOptions = {},
): VariationStats {
  const byCategory: Record<CardCategory, number> = { ...EMPTY_CATEGORY };
  const flags = emptyFlags();
  const setCounts = new Map<string, number>();
  const leaderColors = options.leaderColors ?? [];
  const trackColors = leaderColors.length > 1;
  const colorCounts = trackColors
    ? Object.fromEntries(leaderColors.map((color) => [color, 0])) as Record<
        string,
        number
      >
    : null;

  let copies = 0;
  let costSum = 0;
  let costCopies = 0;
  let powerSum = 0;
  let powerCopies = 0;
  let highestPower: number | null = null;
  let counter1000 = 0;
  let counter2000 = 0;
  let counter0 = 0;
  let counterOther = 0;

  for (const [cardId, qty] of Object.entries(cards)) {
    if (qty <= 0) continue;
    const card = cardsById.get(cardId);
    if (!card) continue;
    // Leader is never part of the 50; skip if one sneaks into the map.
    if (card.category === "Leader") continue;

    copies += qty;
    byCategory[card.category] += qty;

    if (card.cost != null) {
      costSum += card.cost * qty;
      costCopies += qty;
    }
    if (card.power != null) {
      powerSum += card.power * qty;
      powerCopies += qty;
      if (highestPower == null || card.power > highestPower) {
        highestPower = card.power;
      }
    }

    for (const flag of VARIATION_STAT_FLAGS) {
      if (card.has.includes(flag)) flags[flag] += qty;
    }

    if (card.counter === 1000) counter1000 += qty;
    else if (card.counter === 2000) counter2000 += qty;
    else if (card.counter == null || card.counter === 0) counter0 += qty;
    else counterOther += qty;

    if (colorCounts) {
      for (const color of card.colors) {
        if (color in colorCounts) colorCounts[color] += qty;
      }
    }

    const setCode = card.setCode.trim() || "Unknown";
    setCounts.set(setCode, (setCounts.get(setCode) ?? 0) + qty);
  }

  const byColor: VariationColorCount[] = trackColors
    ? leaderColors.map((color) => ({
        color,
        copies: colorCounts?.[color] ?? 0,
      }))
    : [];

  const bySet: VariationSetCount[] = [...setCounts.entries()]
    .map(([setCode, setCopies]) => ({ setCode, copies: setCopies }))
    .sort((a, b) => compareSetCodes(a.setCode, b.setCode));

  return {
    copies,
    avgCost: costCopies > 0 ? costSum / costCopies : null,
    avgPower: powerCopies > 0 ? powerSum / powerCopies : null,
    highestPower,
    byCategory,
    flags,
    counter1000,
    counter2000,
    counter0,
    counterOther,
    byColor,
    bySet,
  };
}
