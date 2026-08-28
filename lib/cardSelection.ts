import type { DeckPoolCard } from "@/types/catalog";

export type CardSelectionDirection = -1 | 1;

export function cardSelectionIndex(
  cards: DeckPoolCard[],
  cardId: string,
): number {
  return cards.findIndex((card) => card.id === cardId);
}

export function adjacentCard(
  cards: DeckPoolCard[],
  cardId: string,
  direction: CardSelectionDirection,
): DeckPoolCard | null {
  const index = cardSelectionIndex(cards, cardId);
  if (index < 0) return null;

  return cards[index + direction] ?? null;
}
