import { mainDeckCount, isColorLegalForLeader } from "@/lib/builder";
import { copyLimitForCard, isForbiddenByLeader } from "@/lib/construction";
import { resolveFavoriteVariationId } from "@/lib/variations";
import type { DeckPoolCard } from "@/types/catalog";
import type { ConstructionRule } from "@/types/construction";
import type { Variation } from "@/types/deck";

export type VariationStatus = {
  legal: boolean;
  owned: boolean;
  reasons: string[];
};

export type DeckSummaryStatus = {
  variationCount: number;
  legal: boolean;
  owned: boolean;
};

export function validateVariation(
  leaderId: string,
  cards: Record<string, number>,
  cardsById: Map<string, DeckPoolCard>,
  ownedQtyById: Record<string, number>,
  rules: ConstructionRule[],
): VariationStatus {
  const reasons: string[] = [];
  let legal = true;
  let owned = true;

  const leader = cardsById.get(leaderId);
  if (!leader || leader.category !== "Leader") {
    reasons.push("Deck has no valid Leader.");
    legal = false;
  }

  const deckSize = mainDeckCount(cards);
  if (deckSize !== 50) {
    reasons.push(`Main deck has ${deckSize}/50 cards.`);
    legal = false;
  }

  if (leader) {
    for (const [cardId, qty] of Object.entries(cards)) {
      if (qty <= 0) continue;

      const card = cardsById.get(cardId);
      if (!card) {
        reasons.push(`Unknown card ${cardId}.`);
        legal = false;
        continue;
      }

      if (!isColorLegalForLeader(card, leader)) {
        reasons.push(`${card.name} is off-color for this Leader.`);
        legal = false;
      }

      const copyLimit = copyLimitForCard(cardId, rules);
      if (copyLimit !== null && qty > copyLimit) {
        reasons.push(
          `Too many copies of ${card.name} (${qty}/${copyLimit}).`,
        );
        legal = false;
      }

      if (isForbiddenByLeader(card, leaderId, rules)) {
        reasons.push(`${card.name} is forbidden under this Leader.`);
        legal = false;
      }
    }
  }

  const leaderOwned = (ownedQtyById[leaderId] ?? 0) >= 1;
  if (!leaderOwned) {
    reasons.push("Leader not owned.");
    owned = false;
  }

  for (const [cardId, qty] of Object.entries(cards)) {
    if (qty <= 0) continue;
    const ownedQty = ownedQtyById[cardId] ?? 0;
    if (qty > ownedQty) {
      const card = cardsById.get(cardId);
      const label = card?.name ?? cardId;
      reasons.push(`${label}: need ${qty}, own ${ownedQty}.`);
      owned = false;
    }
  }

  return { legal, owned, reasons };
}

export function summarizeDeck(
  leaderId: string,
  variations: Variation[],
  cardsById: Map<string, DeckPoolCard>,
  ownedQtyById: Record<string, number>,
  rules: ConstructionRule[],
  favoriteVariationId?: string | null,
): DeckSummaryStatus {
  if (variations.length === 0) {
    return { variationCount: 0, legal: false, owned: false };
  }

  const favoriteId = resolveFavoriteVariationId(
    favoriteVariationId,
    variations,
  );
  const favorite =
    variations.find((row) => row.id === favoriteId) ?? variations[0];
  const status = validateVariation(
    leaderId,
    favorite.cards,
    cardsById,
    ownedQtyById,
    rules,
  );

  return {
    variationCount: variations.length,
    legal: status.legal,
    owned: status.owned,
  };
}
