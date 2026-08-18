import {
  copyLimitForCard,
  getConstructionRules,
  isForbiddenByLeader,
} from "@/lib/construction";
import { filterCards } from "@/lib/search/filterCards";
import { parseQuery } from "@/lib/search/parseQuery";
import type { DeckPoolCard } from "@/types/catalog";
import type { ConstructionRule } from "@/types/construction";

export function isMainDeckCategory(category: DeckPoolCard["category"]): boolean {
  return (
    category === "Character" || category === "Event" || category === "Stage"
  );
}

export function isColorLegalForLeader(
  card: DeckPoolCard,
  leader: DeckPoolCard,
): boolean {
  return card.colors.every((color) => leader.colors.includes(color));
}

export function filterBuilderCatalog(
  cards: DeckPoolCard[],
  leader: DeckPoolCard,
  query: string,
  options: {
    ownedOnly: boolean;
    ownedIds: Set<string>;
    labelsByCardId?: Record<string, string[]>;
    rules?: ConstructionRule[];
  },
): DeckPoolCard[] {
  const rules = options.rules ?? getConstructionRules();
  const expr = parseQuery(query);

  const universe = cards.filter((card) => {
    if (!isMainDeckCategory(card.category)) return false;
    if (!isColorLegalForLeader(card, leader)) return false;
    if (isForbiddenByLeader(card, leader.id, rules)) return false;
    return true;
  });

  return filterCards(universe, expr, {
    ownedOnly: options.ownedOnly,
    ownedIds: options.ownedIds,
    labelsByCardId: options.labelsByCardId,
  });
}

export function canIncrementCopy(
  cardId: string,
  currentInDeck: number,
  rules: ConstructionRule[] = getConstructionRules(),
): boolean {
  const limit = copyLimitForCard(cardId, rules);
  if (limit === null) return true;
  return currentInDeck < limit;
}

export function stripIllegalCards(
  cards: Record<string, number>,
  leaderId: string,
  cardsById: Map<string, DeckPoolCard>,
  rules: ConstructionRule[] = getConstructionRules(),
): Record<string, number> {
  const leader = cardsById.get(leaderId);
  if (!leader) return {};

  const next: Record<string, number> = {};
  for (const [cardId, qty] of Object.entries(cards)) {
    if (qty <= 0) continue;
    const card = cardsById.get(cardId);
    if (!card || !isMainDeckCategory(card.category)) continue;
    if (!isColorLegalForLeader(card, leader)) continue;
    if (isForbiddenByLeader(card, leaderId, rules)) continue;
    next[cardId] = qty;
  }
  return next;
}

export function mainDeckCount(cards: Record<string, number>): number {
  return Object.values(cards).reduce((sum, qty) => sum + qty, 0);
}
