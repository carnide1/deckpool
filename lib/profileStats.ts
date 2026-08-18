import { getConstructionRules } from "@/lib/construction";
import { validateVariation } from "@/lib/legality";
import type { DeckPoolCard } from "@/types/catalog";
import type { Deck, Variation } from "@/types/deck";

export type CollectionStats = {
  uniqueOwnedIds: number;
  totalCopies: number;
};

export type DeckStats = {
  deckCount: number;
  variationCount: number;
  legalVariations: number;
  illegalVariations: number;
  ownedVariations: number;
  unownedVariations: number;
};

export type ProfileStats = CollectionStats & DeckStats;

export function computeCollectionStats(
  ownedQtyById: Record<string, number>,
): CollectionStats {
  let uniqueOwnedIds = 0;
  let totalCopies = 0;

  for (const qty of Object.values(ownedQtyById)) {
    if (qty <= 0) continue;
    uniqueOwnedIds += 1;
    totalCopies += qty;
  }

  return { uniqueOwnedIds, totalCopies };
}

export function computeDeckStats(
  decks: Deck[],
  variationsByDeckId: Record<string, Variation[]>,
  cardsById: Map<string, DeckPoolCard>,
  ownedQtyById: Record<string, number>,
): DeckStats {
  const rules = getConstructionRules();
  let variationCount = 0;
  let legalVariations = 0;
  let illegalVariations = 0;
  let ownedVariations = 0;
  let unownedVariations = 0;

  for (const deck of decks) {
    const variations = variationsByDeckId[deck.id] ?? [];
    for (const variation of variations) {
      variationCount += 1;
      const status = validateVariation(
        deck.leaderId,
        variation.cards,
        cardsById,
        ownedQtyById,
        rules,
      );
      if (status.legal) legalVariations += 1;
      else illegalVariations += 1;
      if (status.owned) ownedVariations += 1;
      else unownedVariations += 1;
    }
  }

  return {
    deckCount: decks.length,
    variationCount,
    legalVariations,
    illegalVariations,
    ownedVariations,
    unownedVariations,
  };
}

export function computeProfileStats(
  ownedQtyById: Record<string, number>,
  decks: Deck[],
  variationsByDeckId: Record<string, Variation[]>,
  cardsById: Map<string, DeckPoolCard>,
): ProfileStats {
  return {
    ...computeCollectionStats(ownedQtyById),
    ...computeDeckStats(decks, variationsByDeckId, cardsById, ownedQtyById),
  };
}
