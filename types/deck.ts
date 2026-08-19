export interface Deck {
  id: string;
  name: string;
  leaderId: string;
  /** Variation the owner usually plays. Missing on older decks. */
  favoriteVariationId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Variation {
  id: string;
  name: string;
  cards: Record<string, number>;
  updatedAt?: unknown;
}
