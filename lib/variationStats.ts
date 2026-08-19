import type { CardCategory, DeckPoolCard } from "@/types/catalog";

export const VARIATION_STAT_FLAGS = [
  "blocker",
  "rush",
  "banish",
  "double-attack",
  "trigger",
] as const;

export type VariationStatFlag = (typeof VARIATION_STAT_FLAGS)[number];

export type VariationStats = {
  copies: number;
  avgCost: number | null;
  avgPower: number | null;
  byCategory: Record<CardCategory, number>;
  flags: Record<VariationStatFlag, number>;
  counter1000: number;
  counter2000: number;
  counterOther: number;
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

export function computeVariationStats(
  cards: Record<string, number>,
  cardsById: Map<string, DeckPoolCard>,
): VariationStats {
  const byCategory: Record<CardCategory, number> = { ...EMPTY_CATEGORY };
  const flags = emptyFlags();
  let copies = 0;
  let costSum = 0;
  let costCopies = 0;
  let powerSum = 0;
  let powerCopies = 0;
  let counter1000 = 0;
  let counter2000 = 0;
  let counterOther = 0;

  for (const [cardId, qty] of Object.entries(cards)) {
    if (qty <= 0) continue;
    const card = cardsById.get(cardId);
    if (!card) continue;

    copies += qty;
    byCategory[card.category] += qty;

    if (card.cost != null) {
      costSum += card.cost * qty;
      costCopies += qty;
    }
    if (card.power != null) {
      powerSum += card.power * qty;
      powerCopies += qty;
    }

    for (const flag of VARIATION_STAT_FLAGS) {
      if (card.has.includes(flag)) flags[flag] += qty;
    }

    if (card.counter === 1000) counter1000 += qty;
    else if (card.counter === 2000) counter2000 += qty;
    else if (card.counter != null) counterOther += qty;
  }

  return {
    copies,
    avgCost: costCopies > 0 ? costSum / costCopies : null,
    avgPower: powerCopies > 0 ? powerSum / powerCopies : null,
    byCategory,
    flags,
    counter1000,
    counter2000,
    counterOther,
  };
}
