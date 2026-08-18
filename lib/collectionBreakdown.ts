import {
  CARD_CATEGORIES,
  COST_VALUES,
  OPTCG_COLORS,
} from "@/lib/search/filters";
import type { CardCategory, DeckPoolCard, OptcgColor } from "@/types/catalog";

export type CountPair = { unique: number; copies: number };

export type CollectionBreakdown = {
  unique: number;
  copies: number;
  byCategory: { category: CardCategory; unique: number; copies: number }[];
  byColor: { color: OptcgColor; unique: number; copies: number }[];
  byCost: { cost: number | null; unique: number; copies: number }[];
  byRarity: { rarity: string; unique: number; copies: number }[];
};

function emptyPair(): CountPair {
  return { unique: 0, copies: 0 };
}

function add(pair: CountPair, qty: number): void {
  pair.unique += 1;
  pair.copies += qty;
}

export function computeCollectionBreakdown(
  ownedQtyById: Record<string, number>,
  cardsById: Map<string, DeckPoolCard>,
): CollectionBreakdown {
  const byCategory = Object.fromEntries(
    CARD_CATEGORIES.map((category) => [category, emptyPair()]),
  ) as Record<CardCategory, CountPair>;
  const byColor = Object.fromEntries(
    OPTCG_COLORS.map((color) => [color, emptyPair()]),
  ) as Record<OptcgColor, CountPair>;
  const byCostMap = new Map<string, CountPair>();
  const byRarityMap = new Map<string, CountPair>();

  let unique = 0;
  let copies = 0;

  for (const [cardId, qty] of Object.entries(ownedQtyById)) {
    if (qty <= 0) continue;
    const card = cardsById.get(cardId);
    if (!card) continue;

    unique += 1;
    copies += qty;
    if (byCategory[card.category]) add(byCategory[card.category], qty);
    for (const color of card.colors) {
      if (byColor[color]) add(byColor[color], qty);
    }

    const costKey = card.cost === null ? "null" : String(card.cost);
    const costPair = byCostMap.get(costKey) ?? emptyPair();
    add(costPair, qty);
    byCostMap.set(costKey, costPair);

    const rarity = card.rarity || "Unknown";
    const rarityPair = byRarityMap.get(rarity) ?? emptyPair();
    add(rarityPair, qty);
    byRarityMap.set(rarity, rarityPair);
  }

  const knownCosts = new Set<number>(COST_VALUES);
  const byCost: CollectionBreakdown["byCost"] = [];
  for (const cost of COST_VALUES) {
    const pair = byCostMap.get(String(cost));
    if (pair) byCost.push({ cost, ...pair });
  }
  for (const [key, pair] of byCostMap) {
    if (key === "null") {
      byCost.push({ cost: null, ...pair });
      continue;
    }
    const cost = Number(key);
    if (!knownCosts.has(cost)) byCost.push({ cost, ...pair });
  }
  byCost.sort((a, b) => {
    if (a.cost === null) return 1;
    if (b.cost === null) return -1;
    return a.cost - b.cost;
  });

  const byRarity = [...byRarityMap.entries()]
    .map(([rarity, pair]) => ({ rarity, ...pair }))
    .sort(
      (a, b) => b.copies - a.copies || a.rarity.localeCompare(b.rarity),
    );

  return {
    unique,
    copies,
    byCategory: CARD_CATEGORIES.map((category) => ({
      category,
      ...byCategory[category],
    })),
    byColor: OPTCG_COLORS.map((color) => ({
      color,
      ...byColor[color],
    })),
    byCost,
    byRarity,
  };
}
