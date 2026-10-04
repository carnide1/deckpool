import {
  isColorLegalForLeader,
  isMainDeckCategory,
  mainDeckCount,
} from "@/lib/builder";
import { copyLimitForCard, isForbiddenByLeader } from "@/lib/construction";
import {
  bannedPairsIn,
  getStandardRules,
  isBanned,
  isRotated,
  restrictedMax,
} from "@/lib/standard";
import { resolveFavoriteVariationId } from "@/lib/variations";
import type { DeckPoolCard } from "@/types/catalog";
import type { ConstructionRule } from "@/types/construction";
import type { Variation } from "@/types/deck";
import type { StandardRules } from "@/types/standard";

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

function blockReason(name: string, card: DeckPoolCard, minBlock: number): string | null {
  if (card.block == null) return `${name} has no block number.`;
  if (isRotated(card.block, minBlock)) {
    return `${name} is Block ${card.block}. Standard allows Block ${minBlock} or higher.`;
  }
  return null;
}

export function validateVariation(
  leaderId: string,
  cards: Record<string, number>,
  cardsById: Map<string, DeckPoolCard>,
  ownedQtyById: Record<string, number>,
  rules: ConstructionRule[],
  standard: StandardRules = getStandardRules(),
): VariationStatus {
  const reasons: string[] = [];
  let legal = true;
  let owned = true;

  const leader = cardsById.get(leaderId);
  if (!leader || leader.category !== "Leader") {
    reasons.push("Deck has no valid Leader.");
    legal = false;
  } else {
    const leaderBlock = blockReason(
      `Leader ${leader.name}`,
      leader,
      standard.minBlock,
    );
    if (leaderBlock) {
      reasons.push(leaderBlock);
      legal = false;
    }
    if (isBanned(leaderId, standard)) {
      reasons.push(`Leader ${leader.name} is banned.`);
      legal = false;
    }
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

      if (!isMainDeckCategory(card.category)) {
        reasons.push(`${card.name} is not a main-deck card.`);
        legal = false;
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

      const rotated = blockReason(card.name, card, standard.minBlock);
      if (rotated) {
        reasons.push(rotated);
        legal = false;
      }

      if (isBanned(cardId, standard)) {
        reasons.push(`${card.name} is banned.`);
        legal = false;
      }

      const cap = restrictedMax(cardId, standard);
      if (cap !== null && qty > cap) {
        reasons.push(`Too many copies of ${card.name} (${qty}/${cap}).`);
        legal = false;
      }
    }
  }

  const present = new Set<string>();
  if (leader) present.add(leaderId);
  for (const [cardId, qty] of Object.entries(cards)) {
    if (qty > 0) present.add(cardId);
  }
  for (const [idA, idB] of bannedPairsIn(present, standard)) {
    const nameA = cardsById.get(idA)?.name ?? idA;
    const nameB = cardsById.get(idB)?.name ?? idB;
    reasons.push(`${nameA} and ${nameB} cannot be in the same deck.`);
    legal = false;
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

/** Ownership lines assume a binder. Friend decks do not have one. */
export function deckNotes(reasons: string[], includeOwnership: boolean): string[] {
  if (includeOwnership) return reasons;
  return reasons.filter((reason) => !isOwnershipReason(reason));
}

function isOwnershipReason(reason: string): boolean {
  return reason === "Leader not owned." || /: need \d+, own \d+\.$/.test(reason);
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
