export interface Deck {
  id: string;
  name: string;
  leaderId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Variation {
  id: string;
  name: string;
  cards: Record<string, number>;
  updatedAt?: unknown;
}
