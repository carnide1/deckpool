import { copyLimitForCard, isForbiddenByLeader } from "@/lib/construction";
import type { DeckPoolCard } from "@/types/catalog";
import type { ConstructionRule } from "@/types/construction";

export type VariationStatus = {
  legal: boolean;
  owned: boolean;
  reasons: string[];
};

export type DeckSummaryStatus = {
  variationCount: number;
  anyLegal: boolean;
  anyOwned: boolean;
};

import { mainDeckCount, isColorLegalForLeader } from "@/lib/builder";

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
  variations: { cards: Record<string, number> }[],
  cardsById: Map<string, DeckPoolCard>,
  ownedQtyById: Record<string, number>,
  rules: ConstructionRule[],
): DeckSummaryStatus {
  let anyLegal = false;
  let anyOwned = false;

  for (const variation of variations) {
    const status = validateVariation(
      leaderId,
      variation.cards,
      cardsById,
      ownedQtyById,
      rules,
    );
    if (status.legal) anyLegal = true;
    if (status.owned) anyOwned = true;
  }

  return {
    variationCount: variations.length,
    anyLegal,
    anyOwned,
  };
}
