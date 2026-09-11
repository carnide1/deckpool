import { sortCards, type SortKey } from "@/lib/search/sortCards";
import type { DeckPoolCard } from "@/types/catalog";

/** Sort keys offered for the visual main-deck board. */
export const DECK_STACK_SORTS: SortKey[] = [
  "cost",
  "name",
  "category",
  "serial",
];

export const DEFAULT_DECK_STACK_SORT: SortKey = "cost";

/** Max card faces drawn in a stack; real qty still shows on the badge. */
export const MAX_VISIBLE_STACK_FACES = 4;

export type DeckStack = {
  card: DeckPoolCard;
  qty: number;
};

export function visibleStackCount(qty: number): number {
  if (qty <= 0) return 0;
  return Math.min(qty, MAX_VISIBLE_STACK_FACES);
}

/**
 * Build ordered stacks for the Edit deck board from a variation count map.
 * Unknown catalog ids are skipped. Qty ≤ 0 rows are omitted.
 */
export function buildDeckStacks(
  variationCards: Record<string, number>,
  cardsById: Map<string, DeckPoolCard>,
  sortKey: SortKey = DEFAULT_DECK_STACK_SORT,
): DeckStack[] {
  const cards: DeckPoolCard[] = [];
  const qtyById: Record<string, number> = {};

  for (const [cardId, qty] of Object.entries(variationCards)) {
    if (qty <= 0) continue;
    const card = cardsById.get(cardId);
    if (!card) continue;
    cards.push(card);
    qtyById[cardId] = qty;
  }

  return sortCards(cards, sortKey).map((card) => ({
    card,
    qty: qtyById[card.id] ?? 0,
  }));
}
