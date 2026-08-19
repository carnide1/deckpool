export interface WantedItem {
  cardId: string;
  /** Extra copies to buy, not a total target. */
  quantity: number;
  updatedAt?: unknown;
  updatedAtMs: number;
}
