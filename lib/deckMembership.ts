import type { Deck, Variation } from "@/types/deck";

export type DeckRef = { id: string; name: string };

export type DeckMembershipIndex = {
  decksByCardId: Record<string, DeckRef[]>;
  cardIdsByDeckId: Record<string, string[]>;
};

export function indexDeckMembership(
  decks: Deck[],
  variationsByDeckId: Record<string, Variation[]>,
): DeckMembershipIndex {
  const decksByCardId: Record<string, DeckRef[]> = {};
  const cardIdsByDeckId: Record<string, string[]> = {};

  for (const deck of decks) {
    const ids = new Set<string>();
    if (deck.leaderId) ids.add(deck.leaderId);
    for (const variation of variationsByDeckId[deck.id] ?? []) {
      for (const [cardId, qty] of Object.entries(variation.cards)) {
        if (qty > 0) ids.add(cardId);
      }
    }

    cardIdsByDeckId[deck.id] = [...ids];
    const ref: DeckRef = { id: deck.id, name: deck.name };
    for (const cardId of ids) {
      const list = decksByCardId[cardId] ?? [];
      if (!list.some((row) => row.id === deck.id)) list.push(ref);
      decksByCardId[cardId] = list;
    }
  }

  for (const list of Object.values(decksByCardId)) {
    list.sort(
      (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
    );
  }

  return { decksByCardId, cardIdsByDeckId };
}

export function deckIdsByCardIdFromIndex(
  index: DeckMembershipIndex,
): Record<string, string[]> {
  const next: Record<string, string[]> = {};
  for (const [cardId, decks] of Object.entries(index.decksByCardId)) {
    next[cardId] = decks.map((deck) => deck.id);
  }
  return next;
}
