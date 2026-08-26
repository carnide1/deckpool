import {
  copyLimitForCard,
  getConstructionRules,
  isForbiddenByLeader,
} from "@/lib/construction";
import {
  applySearchFilters,
  EMPTY_FILTERS,
  type ApplyFilterContext,
  type SearchFilters,
} from "@/lib/search/filters";
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

export function filterBuilderUniverse(
  cards: DeckPoolCard[],
  leader: DeckPoolCard,
  rules: ConstructionRule[] = getConstructionRules(),
): DeckPoolCard[] {
  return cards.filter((card) => {
    if (!isMainDeckCategory(card.category)) return false;
    if (!isColorLegalForLeader(card, leader)) return false;
    if (isForbiddenByLeader(card, leader.id, rules)) return false;
    return true;
  });
}

export function filterBuilderCatalog(
  cards: DeckPoolCard[],
  leader: DeckPoolCard,
  filters: SearchFilters = EMPTY_FILTERS,
  options: ApplyFilterContext & { rules?: ConstructionRule[] } = {},
): DeckPoolCard[] {
  const rules = options.rules ?? getConstructionRules();
  const universe = filterBuilderUniverse(cards, leader, rules);
  return applySearchFilters(universe, filters, options);
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

export function canAddToDeck(
  cardId: string,
  currentInDeck: number,
  ownedQty: number,
  ownedOnly: boolean,
  rules: ConstructionRule[] = getConstructionRules(),
  mainDeckSize = 0,
): boolean {
  if (mainDeckSize >= 50) return false;
  if (!canIncrementCopy(cardId, currentInDeck, rules)) return false;
  if (ownedOnly && currentInDeck >= ownedQty) return false;
  return true;
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
