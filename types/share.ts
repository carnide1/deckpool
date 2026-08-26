/** Public snapshot of one deck variation for SMS-friendly share links. */
export interface DeckShare {
  id: string;
  ownerUid: string;
  deckId: string;
  variationId: string;
  deckName: string;
  leaderId: string;
  variationName: string;
  /** Main-deck counts only (Leader is `leaderId`, not in this map). */
  cards: Record<string, number>;
  /** Optional preferred Bandai image URL per card id (includes Leader). */
  preferredImages: Record<string, string>;
  createdAt?: unknown;
}
